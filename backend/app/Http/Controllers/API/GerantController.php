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
            'telephone' => 'required|string|unique:users,telephone'
        ]);

        // Créer l'utilisateur
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password ?? 'default123'),
            'telephone' => $request->telephone,
            'role' => 'pompiste'
        ]);

        // Créer le pompiste
        $pompiste = Pompiste::create([
            'id_utilisateur' => $user->id_utilisateur,
            'id_gerant' => $request->id_gerant
        ]);

        return response()->json([
            'message' => 'Pompiste créé avec succès',
            'pompiste' => $pompiste->load('user')
        ], 201);
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

    // ==============================================
    // 🔹 GESTION DES STOCKS
    // ==============================================

    // 6. Voir le stock de la station
    public function voirStock($id_gerant)
    {
        $gerant = Gerant::with('station.stocks')->findOrFail($id_gerant);
        
        if (!$gerant->station) {
            return response()->json(['message' => 'Aucune station associée'], 404);
        }

        return response()->json([
            'station' => $gerant->station->nom,
            'stocks' => $gerant->station->stocks
        ]);
    }

    // 7. Recevoir une alerte stock faible
    public function alertesStock($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        
        $alertes = Alerte::where('id_destinataire', $gerant->id_utilisateur)
            ->where('type', 'stock_faible')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'alertes' => $alertes
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES LIVRAISONS
    // ==============================================

    // 8. Valider la réception d'une livraison
    public function validerReception(Request $request)
    {
        $request->validate([
            'id_livraison' => 'required|exists:livraisons,id_livraison',
            'id_gerant' => 'required|exists:gerants,id_gerant',
            'code_validation' => 'required|string|size:4',
            'quantite_recue' => 'required|numeric|min:0',
            'photo_compteur' => 'nullable|string' // URL ou base64
        ]);

        $livraison = Livraison::findOrFail($request->id_livraison);
        
        // Vérifier le code
        if ($livraison->code_validation !== $request->code_validation) {
            return response()->json(['message' => 'Code de validation incorrect'], 400);
        }

        // Vérifier que la livraison concerne le gérant
        if ($livraison->id_gerant !== $request->id_gerant) {
            return response()->json(['message' => 'Livraison non autorisée'], 403);
        }

        // Enregistrer la réception
        $livraison->quantite_livree = $request->quantite_recue;
        $livraison->date_livraison = now();
        $livraison->statut = $request->quantite_recue === $livraison->quantite_prevue ? 'validee' : 'ecart';
        
        if ($request->has('photo_compteur')) {
            $livraison->photo_compteur = $request->photo_compteur;
        }
        
        $livraison->save();

        // Mettre à jour le stock
        $stock = Stock::where('id_station', $livraison->id_station)
            ->where('type_carburant', $livraison->type_carburant)
            ->first();
            
        if ($stock) {
            $stock->quantite += $request->quantite_recue;
            $stock->date_mise_a_jour = now();
            $stock->save();
        }

        // Signer électroniquement (à implémenter avec signature numérique)
        // $livraison->signature_gerant = $request->signature;

        return response()->json([
            'message' => 'Livraison validée avec succès',
            'livraison' => $livraison
        ]);
    }

    // 9. Historique des livraisons
    public function historiqueLivraisons($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        
        $livraisons = Livraison::where('id_gerant', $id_gerant)
            ->with('station')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons
        ]);
    }

    // ==============================================
    // 🔹 CONSULTATION
    // ==============================================

    // 10. Voir les ventes des pompistes
    public function voirVentes($id_gerant)
    {
        $gerant = Gerant::with(['pompistes.ventes.station'])->findOrFail($id_gerant);
        
        $ventes = [];
        foreach ($gerant->pompistes as $pompiste) {
            $ventes[] = [
                'pompiste' => $pompiste->user->nom_complet ?? $pompiste->id_pompiste,
                'ventes' => $pompiste->ventes
            ];
        }

        return response()->json([
            'ventes' => $ventes
        ]);
    }

    // 11. Dashboard du gérant (résumé)
    public function dashboard($id_gerant)
    {
        $gerant = Gerant::with('station.stocks')->findOrFail($id_gerant);
        
        $nombrePompistes = $gerant->pompistes()->count();
        
        $ventesTotal = $gerant->ventes()->sum('montant');
        
        $livraisonsEnAttente = Livraison::where('id_gerant', $id_gerant)
            ->where('statut', 'en_attente')
            ->count();

        $alertesNonLues = Alerte::where('id_destinataire', $gerant->id_utilisateur)
            ->where('statut', 'non_lue')
            ->count();

        return response()->json([
            'gerant' => [
                'id' => $gerant->id_gerant,
                'nom' => $gerant->nom,
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

    // ==============================================
    // 🔹 PROFIL
    // ==============================================

    // 12. Voir le profil du gérant
    public function profil($id_gerant)
    {
        $gerant = Gerant::with(['user', 'station'])->findOrFail($id_gerant);
        
        return response()->json([
            'gerant' => $gerant
        ]);
    }

    // 13. Modifier le profil
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
}