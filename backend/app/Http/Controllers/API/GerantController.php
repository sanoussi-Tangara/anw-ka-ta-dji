<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Gerant;
use App\Models\User;
use App\Models\Pompiste;
use App\Models\Stock;
use App\Models\Livraison;
use App\Models\Alerte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class GerantController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES POMPISTES
    // ==============================================

    // 1. Créer un pompiste
    public function creerPompiste(Request $request)
    {
        $request->validate([
            'id_gerant' => 'required|exists:gerants,id_gerant',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|unique:users,telephone',
            'password' => 'nullable|string|min:6'
        ]);

        DB::beginTransaction();
        try {
            // Créer l'utilisateur
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password ?? 'default123'),
                'telephone' => $request->telephone,
                'role' => 'pompiste',
                'statut' => true
            ]);

            // Créer le pompiste
            $pompiste = Pompiste::create([
                'id_utilisateur' => $user->id_utilisateur,
                'id_gerant' => $request->id_gerant,
                'id_station' => $request->id_station ?? null
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Pompiste créé avec succès',
                'pompiste' => $pompiste->load('user')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    // 2. Modifier un pompiste
    public function modifierPompiste(Request $request, $id_pompiste)
    {
        $pompiste = Pompiste::findOrFail($id_pompiste);
        
        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|string|unique:users,telephone,' . $pompiste->id_utilisateur . ',id_utilisateur'
        ]);

        $user = $pompiste->user;
        
        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        return response()->json([
            'message' => 'Pompiste modifié avec succès',
            'pompiste' => $pompiste->fresh('user')
        ]);
    }

    // 3. Désactiver un pompiste
    public function desactiverPompiste($id_pompiste)
    {
        $pompiste = Pompiste::findOrFail($id_pompiste);
        $user = $pompiste->user;
        
        $user->statut = false;
        $user->save();

        return response()->json([
            'message' => 'Pompiste désactivé avec succès'
        ]);
    }

    // 4. Activer un pompiste
    public function activerPompiste($id_pompiste)
    {
        $pompiste = Pompiste::findOrFail($id_pompiste);
        $user = $pompiste->user;
        
        $user->statut = true;
        $user->save();

        return response()->json([
            'message' => 'Pompiste activé avec succès'
        ]);
    }

    // 5. Voir tous les pompistes
    public function voirPompistes($id_gerant)
    {
        $gerant = Gerant::with('pompistes.user')->findOrFail($id_gerant);
        
        return response()->json([
            'pompistes' => $gerant->pompistes
        ]);
    }

    // 6. Voir le stock de la station
    public function voirStock($id_gerant)
    {
        $gerant = Gerant::with('station')->findOrFail($id_gerant);
        
        if (!$gerant->station) {
            return response()->json([
                'message' => 'Aucune station associée',
                'stocks' => []
            ]);
        }

        $stocks = Stock::where('id_station', $gerant->station->id_station)->get();

        return response()->json([
            'station' => [
                'id' => $gerant->station->id_station,
                'nom' => $gerant->station->nom,
                'adresse' => $gerant->station->adresse
            ],
            'stocks' => $stocks
        ]);
    }

    // 7. Alertes stock faible
    public function alertesStock($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        
        $alertes = Alerte::where('id_destinataire', $gerant->id_utilisateur)
            ->where('type', 'stock_faible')
            ->where('statut', 'non_lue')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'alertes' => $alertes
        ]);
    }

    // 8. Livraisons en attente - CORRIGÉ avec 'mission'
    public function livraisonsEnAttente($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        
        $livraisons = Livraison::where('id_gerant', $id_gerant)
            ->where('statut', 'en_attente')
            ->with(['station', 'mission.chauffeur.user', 'mission.camion'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons
        ]);
    }

    // 9. Valider la réception d'une livraison - CORRIGÉ avec 'mission'
   public function validerReception(Request $request)
{
    $request->validate([
        'id_livraison' => 'required|exists:livraisons,id_livraison',
        'id_gerant' => 'required|exists:gerants,id_gerant',
        'code_validation' => 'required|string|size:4',
        'quantite_recue' => 'required|numeric|min:0',
        'photo_compteur' => 'nullable|string',
        'signature' => 'nullable|string'
    ]);

    DB::beginTransaction();
    try {
        $livraison = Livraison::findOrFail($request->id_livraison);
        
        // Vérifier le code
        if ($livraison->code_validation !== $request->code_validation) {
            return response()->json(['message' => 'Code de validation incorrect'], 400);
        }

        // Vérifier que la livraison concerne le gérant
        if ($livraison->id_gerant !== $request->id_gerant) {
            return response()->json(['message' => 'Livraison non autorisée'], 403);
        }

        // Vérifier que la livraison n'est pas déjà validée
        if ($livraison->statut !== 'en_attente') {
            return response()->json(['message' => 'Livraison déjà traitée'], 400);
        }

        // Récupérer la mission associée
        $mission = $livraison->mission;
        
        // Enregistrer la réception
        $livraison->quantite_livree = $request->quantite_recue;
        $livraison->date_livraison = now();
        $livraison->statut = $request->quantite_recue == $livraison->quantite_prevue ? 'validee' : 'ecart';
        
        if ($request->has('photo_compteur')) {
            $livraison->photo_compteur = $request->photo_compteur;
        }
        
        if ($request->has('signature')) {
            $livraison->signature_gerant = $request->signature;
        }
        
        $livraison->save();

        // Mettre à jour le stock de la STATION
        $typeCarburant = $mission && $mission->bon ? $mission->bon->type_carburant : 'essence';
        $stock = Stock::where('id_station', $livraison->id_station)
            ->where('type_carburant', $typeCarburant)
            ->first();
            
        if ($stock) {
            $stock->quantite += $request->quantite_recue;
            $stock->date_mise_a_jour = now();
            $stock->save();
        } else {
            // Créer le stock si inexistant
            Stock::create([
                'id_station' => $livraison->id_station,
                'type_carburant' => $typeCarburant,
                'quantite' => $request->quantite_recue,
                'seuil_alerte' => 5000,
                'date_mise_a_jour' => now()
            ]);
        }

        // ✅ AJOUTER CETTE LIGNE - Vérifier les alertes de stock après la mise à jour
        $this->verifierAlertesStock($request->id_gerant);

        DB::commit();

        return response()->json([
            'message' => 'Livraison validée avec succès',
            'livraison' => $livraison,
            'stock' => $stock
        ]);
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}

    // 10. Historique des livraisons
    public function historiqueLivraisons($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        
        $livraisons = Livraison::where('id_gerant', $id_gerant)
            ->whereIn('statut', ['validee', 'ecart'])
            ->with('station')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons
        ]);
    }

    // 11. Voir les ventes
    public function voirVentes($id_gerant)
    {
        $gerant = Gerant::with(['station'])->findOrFail($id_gerant);
        
        // Récupérer les ventes via la station
        $ventes = \App\Models\Vente::where('id_station', $gerant->station->id_station)
            ->with('pompiste.user')
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'ventes' => $ventes,
            'total' => $ventes->sum('montant')
        ]);
    }

    // 12. Dashboard du gérant
    public function dashboard($id_gerant)
    {
        $gerant = Gerant::with('station.stocks')->findOrFail($id_gerant);
        
        $nombrePompistes = $gerant->pompistes()->count();
        
        $ventesTotal = \App\Models\Vente::where('id_station', $gerant->station->id_station)->sum('montant');
        
        $livraisonsEnAttente = Livraison::where('id_gerant', $id_gerant)
            ->where('statut', 'en_attente')
            ->count();

        $alertesNonLues = Alerte::where('id_destinataire', $gerant->id_utilisateur)
            ->where('statut', 'non_lue')
            ->count();

        return response()->json([
            'gerant' => [
                'id' => $gerant->id_gerant,
                'nom' => $gerant->user->prenom . ' ' . $gerant->user->nom,
                'station' => $gerant->station?->nom
            ],
            'statistiques' => [
                'nombre_pompistes' => $nombrePompistes,
                'total_ventes' => $ventesTotal,
                'livraisons_attente' => $livraisonsEnAttente,
                'alertes_non_lues' => $alertesNonLues
            ],
            'stocks' => $gerant->station?->stocks ?? []
        ]);
    }

    // 13. Voir le profil du gérant
    public function profil($id_gerant)
    {
        $gerant = Gerant::with(['user', 'station'])->findOrFail($id_gerant);
        
        return response()->json([
            'gerant' => $gerant
        ]);
    }

    // 14. Modifier le profil
    public function updateProfil(Request $request, $id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;

        $request->validate([
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur'
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour',
            'gerant' => $gerant->fresh('user')
        ]);
    }

    // 15. Marquer une alerte comme lue
    public function marquerAlerteLue($id_alerte)
    {
        $alerte = Alerte::findOrFail($id_alerte);
        $alerte->statut = 'lue';
        $alerte->save();

        return response()->json([
            'message' => 'Alerte marquée comme lue'
        ]);
    }

    // 16. Mettre à jour le seuil d'alerte d'un stock
public function updateSeuilAlerte(Request $request, $id_gerant)
{
    $request->validate([
        'type_carburant' => 'required|in:essence,gasoil',
        'seuil_alerte' => 'required|numeric|min:0|max:50000'
    ]);

    $gerant = Gerant::with('station')->findOrFail($id_gerant);
    
    if (!$gerant->station) {
        return response()->json(['message' => 'Aucune station associée'], 404);
    }

    $stock = Stock::where('id_station', $gerant->station->id_station)
        ->where('type_carburant', $request->type_carburant)
        ->first();

    if (!$stock) {
        return response()->json(['message' => 'Stock non trouvé pour ce type de carburant'], 404);
    }

    $stock->seuil_alerte = $request->seuil_alerte;
    $stock->save();

    return response()->json([
        'message' => 'Seuil d\'alerte mis à jour avec succès',
        'stock' => $stock
    ]);
}


    // 17. Vérifier les stocks et créer des alertes si nécessaire
    public function verifierAlertesStock($id_gerant)
    {
        $gerant = Gerant::with('station')->findOrFail($id_gerant);
        
        if (!$gerant->station) {
            return response()->json([
                'message' => 'Aucune station associée',
                'alertes_creees' => []
            ]);
        }
        
        $stocks = Stock::where('id_station', $gerant->station->id_station)->get();
        $alertesCreees = [];
        
        foreach ($stocks as $stock) {
            if ($stock->quantite <= $stock->seuil_alerte) {
                // Vérifier si une alerte non lue existe déjà pour ce type de carburant
                $alerteExistante = Alerte::where('id_destinataire', $gerant->id_utilisateur)
                    ->where('type', 'stock_faible')
                    ->where('statut', 'non_lue')
                    ->where('message', 'LIKE', '%' . $stock->type_carburant . '%')
                    ->first();
                
                if (!$alerteExistante) {
                    // Créer une nouvelle alerte
                    $alerte = Alerte::create([
                        'type' => 'stock_faible',
                        'message' => "⚠️ Stock faible : {$stock->type_carburant} - " . round($stock->quantite) . " L restants (seuil: {$stock->seuil_alerte} L)",
                        'date_creation' => now(),
                        'statut' => 'non_lue',
                        'id_destinataire' => $gerant->id_utilisateur,
                        'id_gerant' => $id_gerant
                    ]);
                    $alertesCreees[] = $alerte;
                }
            }
        }
        
        return response()->json([
            'alertes_creees' => $alertesCreees,
            'message' => count($alertesCreees) . ' alerte(s) créée(s)'
        ]);
    }
}