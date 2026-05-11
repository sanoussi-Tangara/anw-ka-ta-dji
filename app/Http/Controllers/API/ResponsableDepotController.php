<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ResponsableDepot;
use App\Models\User;
use App\Models\Bon;
use App\Models\Depot;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ResponsableDepotController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES COMPTES (PAR MANAGER)
    // ==============================================

    // 1. Créer un responsable de dépôt (par le manager)
    public function creer(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|unique:users,telephone',
            'id_depot' => 'required|exists:depots,id_depot'
        ]);

        // Créer l'utilisateur
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password ?? 'default123'),
            'telephone' => $request->telephone,
            'role' => 'responsable_depot'
        ]);

        // Créer le responsable
        $responsable = ResponsableDepot::create([
            'id_utilisateur' => $user->id_utilisateur
        ]);

        // Associer le dépôt
        $depot = Depot::find($request->id_depot);
        $depot->id_responsable = $responsable->id_responsable;
        $depot->save();

        return response()->json([
            'message' => 'Responsable de dépôt créé avec succès',
            'responsable' => $responsable->load('user', 'depot')
        ], 201);
    }

    // 2. Voir tous les responsables
    public function index()
    {
        $responsables = ResponsableDepot::with(['user', 'depot'])->get();
        return response()->json($responsables);
    }

    // 3. Voir un responsable
    public function show($id)
    {
        $responsable = ResponsableDepot::with(['user', 'depot'])->findOrFail($id);
        return response()->json($responsable);
    }

    // 4. Désactiver un responsable
    public function desactiver($id)
    {
        $responsable = ResponsableDepot::findOrFail($id);
        $user = $responsable->user;
        $user->statut = false;
        $user->save();

        return response()->json(['message' => 'Responsable désactivé']);
    }

    // 5. Activer un responsable
    public function activer($id)
    {
        $responsable = ResponsableDepot::findOrFail($id);
        $user = $responsable->user;
        $user->statut = true;
        $user->save();

        return response()->json(['message' => 'Responsable activé']);
    }

    // ==============================================
    // 🔹 GESTION DES BONS (NOTIFICATIONS)
    // ==============================================

    // 6. Voir les bons reçus (notifications)
    public function bonsRecus($id_responsable)
    {
        $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
        
        $bons = Bon::where('id_depot', $responsable->depot->id_depot)
            ->with('fournisseur.user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'depot' => $responsable->depot->nom,
            'bons' => $bons
        ]);
    }

    // 7. Voir le détail d'un bon
    public function detailBon($id_bon)
    {
        $bon = Bon::with(['fournisseur.user', 'icr.user', 'depot'])->findOrFail($id_bon);
        return response()->json($bon);
    }

    // ==============================================
    // 🔹 VÉRIFICATION ET CHARGEMENT
    // ==============================================

    // 8. Vérifier le code ICR et autoriser le chargement
    public function verifierCode(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon',
            'code' => 'required|string|size:4'
        ]);

        $bon = Bon::findOrFail($request->id_bon);

        if ($bon->code_verification !== $request->code) {
            return response()->json([
                'message' => 'Code incorrect',
                'valide' => false
            ], 400);
        }

        if ($bon->statut !== 'signe') {
            return response()->json([
                'message' => 'Bon non signé par le fournisseur',
                'valide' => false
            ], 400);
        }

        return response()->json([
            'message' => 'Code valide, chargement autorisé',
            'valide' => true,
            'bon' => $bon
        ]);
    }

    // 9. Autoriser le chargement
    public function autoriserChargement(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon'
        ]);

        $bon = Bon::findOrFail($request->id_bon);
        $bon->statut = 'en_cours';
        $bon->save();

        return response()->json([
            'message' => 'Chargement autorisé',
            'bon' => $bon
        ]);
    }

    // 10. Suivre le chargement (fin de chargement)
    public function terminerChargement(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon',
            'quantite_chargee' => 'required|numeric|min:0'
        ]);

        $bon = Bon::findOrFail($request->id_bon);
        $bon->quantite_chargee = $request->quantite_chargee;
        $bon->statut = 'termine';
        $bon->save();

        // Mettre à jour le stock du dépôt
        $stock = Stock::where('id_depot', $bon->id_depot)
            ->where('type_carburant', $bon->type_carburant)
            ->first();

        if ($stock) {
            $stock->quantite -= $request->quantite_chargee;
            $stock->date_mise_a_jour = now();
            $stock->save();
        }

        return response()->json([
            'message' => 'Chargement terminé, stock mis à jour',
            'stock_restant' => $stock->quantite ?? 0
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES STOCKS
    // ==============================================

    // 11. Voir le stock du dépôt
    public function voirStock($id_responsable)
    {
        $responsable = ResponsableDepot::with('depot.stocks')->findOrFail($id_responsable);
        
        return response()->json([
            'depot' => $responsable->depot->nom,
            'stocks' => $responsable->depot->stocks
        ]);
    }

    // 12. Historique des sorties (bons terminés)
    public function historiqueSorties($id_responsable)
    {
        $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
        
        $historique = Bon::where('id_depot', $responsable->depot->id_depot)
            ->whereIn('statut', ['termine', 'annule'])
            ->with('fournisseur.user')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'historique' => $historique
        ]);
    }

    // ==============================================
    // 🔹 PROFIL
    // ==============================================

    // 13. Voir le profil
    public function profil($id_responsable)
    {
        $responsable = ResponsableDepot::with(['user', 'depot'])->findOrFail($id_responsable);
        return response()->json($responsable);
    }

    // 14. Modifier le profil
    public function updateProfil(Request $request, $id_responsable)
    {
        $responsable = ResponsableDepot::findOrFail($id_responsable);
        $user = $responsable->user;

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
            'responsable' => $responsable->fresh('user')
        ]);
    }
}