<?php

namespace App\Http\Controllers;

use App\Models\Bon;
use App\Models\Fournisseur;
use App\Models\Icr;
use App\Models\Depot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class FournisseurController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:fournisseur');
    }
    
    /**
     * 1. Création du bon d'enlèvement
     */
    public function creerBon(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite_commandee' => 'required|numeric|min:0.01',
            'date_disponibilite' => 'required|date|after:now',
            'id_depot' => 'required|exists:depots,id_depot',
            'id_icr' => 'required|exists:icr,id_icr'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            DB::beginTransaction();
            
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
                'success' => true,
                'data' => [
                    'bon' => $bon->load(['fournisseur', 'icr', 'depot']),
                    'code_verification' => $codeVerification
                ],
                'message' => 'Bon créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 2. Signature électronique
     */
    public function signerBon(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'signature_fournisseur' => 'required|string|min:10',
            'code_verification' => 'required|string|size:4'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Signature et code requis'
            ], 422);
        }

        try {
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->firstOrFail();
            
            if ($bon->code_verification !== $request->code_verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code de vérification invalide'
                ], 401);
            }
            
            if ($bon->statut !== 'cree') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon créé peut être signé'
                ], 400);
            }
            
            $bon->update([
                'signature_fournisseur' => $request->signature_fournisseur,
                'statut' => 'signe'
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $bon->load(['fournisseur', 'icr', 'depot']),
                'message' => 'Bon signé avec succès'
            ], 200);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bon non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la signature',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3. Transmission du bon
     */
    public function transmettreBon($id)
    {
        try {
            DB::beginTransaction();
            
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->firstOrFail();
            
            if ($bon->statut !== 'signe') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seul un bon signé peut être transmis'
                ], 400);
            }
            
            $bon->update(['statut' => 'en_cours']);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $bon->load(['fournisseur', 'icr', 'depot']),
                'message' => 'Bon transmis avec succès'
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la transmission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 4. Suivi du bon
     */
    public function suivreBon($id)
    {
        try {
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->with(['fournisseur', 'icr', 'depot'])
                ->firstOrFail();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'bon' => $bon,
                    'chargement' => [
                        'debut' => $bon->debut_chargement,
                        'fin' => $bon->fin_chargement,
                        'quantite_chargee' => $bon->quantite_chargee
                    ]
                ],
                'message' => 'Suivi récupéré'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de suivi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 5. Historique des bons
     */
    public function historique(Request $request)
    {
        try {
            $fournisseurId = auth()->user()->fournisseur->id_fournisseur;
            
            $bons = Bon::with(['icr', 'depot'])
                ->where('id_fournisseur', $fournisseurId)
                ->orderBy('date_creation', 'desc')
                ->paginate($request->get('per_page', 15));
            
            return response()->json([
                'success' => true,
                'data' => $bons,
                'message' => 'Historique récupéré'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 6. Annuler un bon
     */
    public function annulerBon(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $bon = Bon::where('id_bon', $id)
                ->where('id_fournisseur', auth()->user()->fournisseur->id_fournisseur)
                ->firstOrFail();
            
            if (in_array($bon->statut, ['termine', 'annule', 'en_cours'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bon ne peut pas être annulé'
                ], 400);
            }
            
            $bon->update([
                'statut' => 'annule',
                'motif_annulation' => $request->motif_annulation ?? 'Annulé par le fournisseur'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Bon annulé avec succès'
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}