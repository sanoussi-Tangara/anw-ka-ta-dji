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

    /**
     * Notifier l'ICR et le responsable du dépôt
     */
    private function notifierBonDestinataires($bon, $action)
    {
        // Notification à l'ICR
        if ($bon->icr && $bon->icr->user) {
            Notification::create([
                'titre' => $action === 'creation' ? 'Nouveau bon d\'enlèvement créé' : 'Mise à jour du bon',
                'message' => $action === 'creation' 
                    ? "Un nouveau bon d'enlèvement a été créé. Code: {$bon->code_verification}"
                    : "Le bon {$bon->code_verification} a été mis à jour. Statut: {$bon->statut}",
                'date_envoi' => now(),
                'lu' => false,
                'id_destinataire' => $bon->icr->user->id_utilisateur
            ]);
            \Log::info('Notification envoyée à ICR ID: ' . $bon->icr->user->id_utilisateur);
        } else {
            \Log::warning('ICR ou utilisateur ICR non trouvé', [
                'bon_id' => $bon->id_bon,
                'icr_exists' => !is_null($bon->icr)
            ]);
        }

        // Notification au responsable du dépôt
        if ($bon->depot && $bon->depot->responsable && $bon->depot->responsable->user) {
            Notification::create([
                'titre' => $action === 'creation' ? 'Nouveau bon d\'enlèvement' : 'Mise à jour du bon',
                'message' => $action === 'creation'
                    ? "Un nouveau bon d'enlèvement est prévu dans votre dépôt. Code: {$bon->code_verification}"
                    : "Le bon {$bon->code_verification} dans votre dépôt a été mis à jour",
                'date_envoi' => now(),
                'lu' => false,
                'id_destinataire' => $bon->depot->responsable->user->id_utilisateur
            ]);
            \Log::info('Notification envoyée au responsable dépôt ID: ' . $bon->depot->responsable->user->id_utilisateur);
        } else {
            \Log::warning('Responsable dépôt non trouvé', [
                'bon_id' => $bon->id_bon,
                'depot_exists' => !is_null($bon->depot),
                'responsable_exists' => !is_null($bon->depot->responsable ?? null)
            ]);
        }
    }

    /**
     * 1. Création du bon d'enlèvement
     */
    public function creerBon(Request $request)
    {
        $request->validate([
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite_commandee' => 'required|numeric|min:0.01',
            'date_disponibilite' => 'required|date',
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

            // Recharge avec les relations
            $bon->load(['icr.user', 'depot.responsable.user']);
            
            // Envoyer les notifications
            $this->notifierBonDestinataires($bon, 'creation');

            DB::commit();

            return response()->json([
                'message' => 'Bon créé avec succès',
                'bon' => $bon->load(['fournisseur.user', 'icr.user', 'depot']),
                'code_verification' => $codeVerification
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur création bon: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la création: ' . $e->getMessage()], 500);
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
            \Log::error('Erreur signature: ' . $e->getMessage());
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
                ->with(['icr.user', 'depot.responsable.user'])
                ->firstOrFail();

            if ($bon->statut !== 'signe') {
                return response()->json(['message' => 'Seul un bon signé peut être transmis'], 400);
            }

            // Notification à l'ICR
            if ($bon->icr && $bon->icr->user) {
                Notification::create([
                    'titre' => 'Bon transmis',
                    'message' => "Le bon d'enlèvement vous a été transmis. Code: {$bon->code_verification}",
                    'date_envoi' => now(),
                    'lu' => false,
                    'id_destinataire' => $bon->icr->user->id_utilisateur
                ]);
                \Log::info('Transmission - Notification envoyée à ICR: ' . $bon->icr->user->id_utilisateur);
            } else {
                \Log::warning('Transmission - ICR non trouvé');
            }

            // Notification au responsable du dépôt
            if ($bon->depot && $bon->depot->responsable && $bon->depot->responsable->user) {
                Notification::create([
                    'titre' => 'Bon transmis au dépôt',
                    'message' => "Un bon d'enlèvement vous a été transmis pour votre dépôt. Code: {$bon->code_verification}",
                    'date_envoi' => now(),
                    'lu' => false,
                    'id_destinataire' => $bon->depot->responsable->user->id_utilisateur
                ]);
                \Log::info('Transmission - Notification envoyée au responsable dépôt: ' . $bon->depot->responsable->user->id_utilisateur);
            } else {
                \Log::warning('Transmission - Responsable dépôt non trouvé');
            }

            return response()->json([
                'message' => 'Bon transmis avec succès',
                'bon' => $bon
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur transmission: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la transmission: ' . $e->getMessage()], 500);
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
            \Log::error('Erreur suivi: ' . $e->getMessage());
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
            \Log::error('Erreur historique: ' . $e->getMessage());
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
                ->with(['icr.user'])
                ->firstOrFail();

            if (in_array($bon->statut, ['termine', 'en_cours'])) {
                return response()->json(['message' => 'Ce bon ne peut pas être annulé'], 400);
            }

            $bon->update(['statut' => 'annule']);

            // Notifier l'ICR de l'annulation
            if ($bon->icr && $bon->icr->user) {
                Notification::create([
                    'titre' => 'Bon annulé',
                    'message' => "Le bon d'enlèvement a été annulé. Code: {$bon->code_verification}",
                    'date_envoi' => now(),
                    'lu' => false,
                    'id_destinataire' => $bon->icr->user->id_utilisateur
                ]);
                \Log::info('Annulation - Notification envoyée à ICR');
            }

            return response()->json(['message' => 'Bon annulé avec succès']);

        } catch (\Exception $e) {
            \Log::error('Erreur annulation: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'annulation'], 500);
        }
    }

    /**
     * 7. Liste des ICR pour le fournisseur
     */
    public function listeIcrs()
    {
        try {
            $icrs = Icr::with('user')->get();
            return response()->json(['icrs' => $icrs]);
        } catch (\Exception $e) {
            \Log::error('Erreur liste ICR: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement des ICR'], 500);
        }
    }

    /**
     * 8. Liste des dépôts pour le fournisseur
     */
    public function listeDepots()
    {
        try {
            $depots = Depot::all();
            return response()->json(['depots' => $depots]);
        } catch (\Exception $e) {
            \Log::error('Erreur liste dépôts: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors du chargement des dépôts'], 500);
        }
    }


    public function getDetailsBon($id_bon)
{
    $bon = Bon::with([
        'icr.user',
        'depot',
    ])->findOrFail($id_bon);

    return response()->json([
        'bon' => [
            'id_bon' => $bon->id_bon,
            'code_verification' => $bon->code_verification,
            'type_carburant' => $bon->type_carburant,
            'quantite_commandee' => $bon->quantite_commandee,
            'quantite_chargee' => $bon->quantite_chargee,
            'statut' => $bon->statut,
            'date_creation' => $bon->date_creation,
            'date_disponibilite' => $bon->date_disponibilite,
            'signature_fournisseur' => $bon->signature_fournisseur,
            'date_debut_chargement' => $bon->date_debut_chargement,
            'date_fin_chargement' => $bon->date_fin_chargement,
            'icr' => $bon->icr ? [
                'id_icr' => $bon->icr->id_icr,
                'matricule' => $bon->icr->matricule,
                'zone' => $bon->icr->zone,
                'nom' => $bon->icr->user->nom ?? '',
                'prenom' => $bon->icr->user->prenom ?? '',
                'email' => $bon->icr->user->email ?? '',
                'telephone' => $bon->icr->user->telephone ?? '',
            ] : null,
            'depot' => $bon->depot ? [
                'id_depot' => $bon->depot->id_depot,
                'nom' => $bon->depot->nom,
                'localisation' => $bon->depot->localisation,
            ] : null,
        ]
    ]);
}

}