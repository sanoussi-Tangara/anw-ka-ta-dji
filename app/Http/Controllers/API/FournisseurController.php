<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Bon;
use App\Models\Fournisseur;
use App\Models\Icr;
use App\Models\Depot;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FournisseurController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');  // ← Correction
        $this->middleware('role:fournisseur');
    }

    /**
     * 1. Création du bon d'enlèvement
     */
    public function creerBon(Request $request)
    {
        $request->validate([
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite_commandee' => 'required|numeric|min:0.01',
            'date_disponibilite' => 'required|date|after:now',
            'id_depot' => 'required|exists:depots,id_depot',
            'id_icr' => 'required|exists:icr,id_icr'
        ]);

        DB::beginTransaction();

        try {
            $fournisseurId = auth()->user()->fournisseur->id_fournisseur;
            $codeVerification = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            $bon = Bon::create([
                'code_verification' => $codeVerification,
                'type_carburant' => $request->type_carburant,
                'quantite_commandee' => $request->quantite_commandee,
                'quantite_chargee' => null,
                'date_creation' => Carbon::now(),
                'date_disponibilite' => $request->date_disponibilite,
                'statut' => 'cree',
                'signature_fournisseur' => null,
                'photo_compteur' => null,
                'id_fournisseur' => $fournisseurId,
                'id_icr' => $request->id_icr,
                'id_depot' => $request->id_depot
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Bon créé avec succès',
                'bon' => $bon->load(['fournisseur.user', 'icr.user', 'depot']),
                'code_verification' => $codeVerification
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    /**
     * 2. Signature électronique
     */
    public function signerBon(Request $request, $id)
    {
        $request->validate([
            'signature_fournisseur' => 'required|string',
            'code_verification' => 'required|string|size:4'
        ]);

        try {
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->firstOrFail();

            if ($bon->code_verification !== $request->code_verification) {
                return response()->json(['message' => 'Code de vérification invalide'], 401);
            }

            if ($bon->statut !== 'cree') {
                return response()->json(['message' => 'Seul un bon créé peut être signé'], 400);
            }

            $bon->update([
                'signature_fournisseur' => $request->signature_fournisseur,
                'statut' => 'signe'
            ]);

            return response()->json([
                'message' => 'Bon signé avec succès',
                'bon' => $bon->load(['fournisseur.user', 'icr.user', 'depot'])
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la signature'], 500);
        }
    }

    /**
     * 3. Transmettre le bon (envoi à l'ICR et au dépôt)
     */
    public function transmettreBon($id)
    {
        try {
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->firstOrFail();

            if ($bon->statut !== 'signe') {
                return response()->json(['message' => 'Seul un bon signé peut être transmis'], 400);
            }

            $bon->update(['statut' => 'transmis']);

            // Envoyer notification à l'ICR
            Notification::create([
                'titre' => 'Nouveau bon d\'enlèvement',
                'message' => "Un nouveau bon a été créé pour vous. Code: {$bon->code_verification}",
                'date_envoi' => now(),
                'lu' => false,
                'id_destinataire' => $bon->icr->user->id_utilisateur
            ]);

            // Envoyer notification au dépôt
            Notification::create([
                'titre' => 'Nouveau bon d\'enlèvement',
                'message' => "Un nouveau bon est prévu pour votre dépôt. Code: {$bon->code_verification}",
                'date_envoi' => now(),
                'lu' => false,
                'id_destinataire' => $bon->depot->responsable->user->id_utilisateur ?? null
            ]);

            return response()->json([
                'message' => 'Bon transmis avec succès',
                'bon' => $bon
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la transmission'], 500);
        }
    }

    /**
     * 4. Suivi du bon (début et fin de chargement)
     */
    public function suivreBon($id)
    {
        try {
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->with(['fournisseur.user', 'icr.user', 'depot'])
                ->firstOrFail();

            $progression = 0;
            if ($bon->statut === 'termine') {
                $progression = 100;
            } elseif ($bon->statut === 'en_cours') {
                $progression = 50;
            } elseif ($bon->statut === 'signe') {
                $progression = 25;
            } elseif ($bon->statut === 'cree') {
                $progression = 10;
            }

            return response()->json([
                'bon' => $bon,
                'progression' => $progression,
                'chargement' => [
                    'debut' => $bon->date_debut_chargement,
                    'fin' => $bon->date_fin_chargement,
                    'quantite_chargee' => $bon->quantite_chargee
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur de suivi'], 500);
        }
    }

    /**
     * 5. Historique des bons
     */
    public function historique(Request $request)
    {
        try {
            $fournisseurId = auth()->user()->fournisseur->id_fournisseur;

            $bons = Bon::with(['icr.user', 'depot'])
                ->where('id_fournisseur', $fournisseurId)
                ->orderBy('date_creation', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'bons' => $bons,
                'total' => $bons->total()
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du chargement de l\'historique'], 500);
        }
    }

    /**
     * 6. Annuler un bon
     */
    public function annulerBon($id)
    {
        try {
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->firstOrFail();

            if (in_array($bon->statut, ['termine', 'en_cours'])) {
                return response()->json(['message' => 'Ce bon ne peut pas être annulé'], 400);
            }

            $bon->update(['statut' => 'annule']);

            // Notifier l'ICR de l'annulation
            Notification::create([
                'titre' => 'Bon annulé',
                'message' => "Le bon d'enlèvement a été annulé",
                'date_envoi' => now(),
                'lu' => false,
                'id_destinataire' => $bon->icr->user->id_utilisateur
            ]);

            return response()->json(['message' => 'Bon annulé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'annulation'], 500);
        }
    }
}