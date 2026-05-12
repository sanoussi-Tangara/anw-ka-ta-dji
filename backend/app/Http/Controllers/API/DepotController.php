<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Depot;
use App\Models\Stock;
use App\Models\Bon;
use App\Models\ResponsableDepot;
use Illuminate\Http\Request;

class DepotController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES DEPOTS (CRUD)
    // ==============================================

    // 1. Lister tous les dépôts
    public function index()
    {
        $depots = Depot::with(['responsable.user', 'stocks'])
            ->orderBy('nom')
            ->get();

        return response()->json([
            'depots' => $depots,
            'count' => $depots->count()
        ]);
    }

    // 2. Voir le détail d'un dépôt
    public function show($id_depot)
    {
        $depot = Depot::with([
            'responsable.user', 
            'stocks', 
            'bons' => function($q) {
                $q->orderBy('created_at', 'desc')->limit(20);
            }
        ])->findOrFail($id_depot);

        return response()->json([
            'depot' => $depot
        ]);
    }

    // 3. Créer un nouveau dépôt
    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100|unique:depots,nom',
            'localisation' => 'required|string|max:200',
            'id_responsable' => 'nullable|exists:responsables_depot,id_responsable'
        ]);

        $depot = Depot::create([
            'nom' => $request->nom,
            'localisation' => $request->localisation,
            'id_responsable' => $request->id_responsable
        ]);

        // Initialiser les stocks du dépôt (essence et gasoil)
        Stock::initialiserDepotStock($depot->id_depot);

        return response()->json([
            'message' => 'Dépôt créé avec succès',
            'depot' => $depot->load('responsable.user', 'stocks')
        ], 201);
    }

    // 4. Modifier un dépôt
    public function update(Request $request, $id_depot)
    {
        $depot = Depot::findOrFail($id_depot);

        $request->validate([
            'nom' => 'sometimes|string|max:100|unique:depots,nom,' . $id_depot . ',id_depot',
            'localisation' => 'sometimes|string|max:200',
            'id_responsable' => 'nullable|exists:responsables_depot,id_responsable'
        ]);

        if ($request->has('nom')) $depot->nom = $request->nom;
        if ($request->has('localisation')) $depot->localisation = $request->localisation;
        if ($request->has('id_responsable')) $depot->id_responsable = $request->id_responsable;

        $depot->save();

        return response()->json([
            'message' => 'Dépôt modifié avec succès',
            'depot' => $depot->load('responsable.user', 'stocks')
        ]);
    }

    // 5. Supprimer un dépôt
    public function destroy($id_depot)
    {
        $depot = Depot::findOrFail($id_depot);

        // Vérifier si le dépôt a des stock
        if ($depot->stocks && $depot->stocks->sum('quantite') > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce dépôt car il contient encore du stock'
            ], 400);
        }

        $depot->delete();

        return response()->json([
            'message' => 'Dépôt supprimé avec succès'
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES STOCKS DU DÉPÔT
    // ==============================================

    // 6. Voir les stocks du dépôt
    public function voirStocks($id_depot)
    {
        $depot = Depot::with('stocks')->findOrFail($id_depot);

        return response()->json([
            'depot' => $depot->nom,
            'stocks' => $depot->stocks
        ]);
    }

    // 7. Mettre à jour le stock d'un dépôt
    public function updateStock(Request $request, $id_depot)
    {
        $request->validate([
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite' => 'required|numeric'
        ]);

        $depot = Depot::findOrFail($id_depot);
        
        $stock = Stock::where('id_depot', $id_depot)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if (!$stock) {
            return response()->json(['message' => 'Stock non trouvé'], 404);
        }

        $stock->quantite += $request->quantite;
        $stock->date_mise_a_jour = now();
        $stock->save();

        return response()->json([
            'message' => 'Stock mis à jour',
            'stock' => $stock
        ]);
    }

    // 8. Vérifier la disponibilité d'un type de carburant
    public function checkDisponibilite($id_depot, $type_carburant)
    {
        $depot = Depot::findOrFail($id_depot);

        $stock = Stock::where('id_depot', $id_depot)
            ->where('type_carburant', $type_carburant)
            ->first();

        return response()->json([
            'depot' => $depot->nom,
            'type_carburant' => $type_carburant,
            'quantite_disponible' => $stock ? $stock->quantite : 0
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES BONS
    // ==============================================

    // 9. Voir les bons du dépôt
    public function voirBons($id_depot)
    {
        $depot = Depot::findOrFail($id_depot);

        $bons = Bon::where('id_depot', $id_depot)
            ->with(['fournisseur.user', 'icr.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'depot' => $depot->nom,
            'bons' => $bons,
            'count' => $bons->count()
        ]);
    }

    // 10. Voir les bons par statut
    public function voirBonsByStatut($id_depot, $statut)
    {
        $depot = Depot::findOrFail($id_depot);

        $bons = Bon::where('id_depot', $id_depot)
            ->where('statut', $statut)
            ->with(['fournisseur.user', 'icr.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'depot' => $depot->nom,
            'statut' => $statut,
            'bons' => $bons,
            'count' => $bons->count()
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 11. Statistiques des dépôts
    public function statistiques()
    {
        $stats = [
            'total' => Depot::count(),
            'avec_responsable' => Depot::whereNotNull('id_responsable')->count(),
            'sans_responsable' => Depot::whereNull('id_responsable')->count(),
            'stock_total_essence' => Stock::whereNotNull('id_depot')
                ->where('type_carburant', 'essence')
                ->sum('quantite'),
            'stock_total_gasoil' => Stock::whereNotNull('id_depot')
                ->where('type_carburant', 'gasoil')
                ->sum('quantite')
        ];

        return response()->json($stats);
    }

    // 12. Dashboard des dépôts
    public function dashboard()
    {
        $depots = Depot::with(['responsable.user', 'stocks'])->get();

        $totalStock = [
            'essence' => Stock::whereNotNull('id_depot')->where('type_carburant', 'essence')->sum('quantite'),
            'gasoil' => Stock::whereNotNull('id_depot')->where('type_carburant', 'gasoil')->sum('quantite')
        ];

        $depotsStockFaible = collect();
        foreach ($depots as $depot) {
            foreach ($depot->stocks as $stock) {
                if ($stock->quantite <= $stock->seuil_alerte) {
                    $depotsStockFaible->push([
                        'depot' => $depot->nom,
                        'type' => $stock->type_carburant,
                        'quantite' => $stock->quantite,
                        'seuil' => $stock->seuil_alerte
                    ]);
                }
            }
        }

        return response()->json([
            'statistiques' => [
                'total_depots' => $depots->count(),
                'stocks_totaux' => $totalStock
            ],
            'depots' => $depots,
            'alertes_stock' => $depotsStockFaible
        ]);
    }

    // ==============================================
    // 🔹 GESTION DU RESPONSABLE
    // ==============================================

    // 13. Affecter un responsable à un dépôt
    public function affecterResponsable(Request $request, $id_depot)
    {
        $request->validate([
            'id_responsable' => 'required|exists:responsables_depot,id_responsable'
        ]);

        $depot = Depot::findOrFail($id_depot);

        // Vérifier si le responsable n'est pas déjà affecté à un autre dépôt
        $depotExistant = Depot::where('id_responsable', $request->id_responsable)->first();
        if ($depotExistant && $depotExistant->id_depot != $id_depot) {
            return response()->json([
                'message' => 'Ce responsable est déjà affecté au dépôt ' . $depotExistant->nom
            ], 400);
        }

        $depot->id_responsable = $request->id_responsable;
        $depot->save();

        return response()->json([
            'message' => 'Responsable affecté avec succès',
            'depot' => $depot->load('responsable.user')
        ]);
    }

    // 14. Retirer le responsable d'un dépôt
    public function retirerResponsable($id_depot)
    {
        $depot = Depot::findOrFail($id_depot);
        $depot->id_responsable = null;
        $depot->save();

        return response()->json([
            'message' => 'Responsable retiré avec succès',
            'depot' => $depot
        ]);
    }

    // ==============================================
    // 🔹 RECHERCHE
    // ==============================================

    // 15. Rechercher un dépôt
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $depots = Depot::where('nom', 'LIKE', "%{$request->q}%")
            ->orWhere('localisation', 'LIKE', "%{$request->q}%")
            ->with(['responsable.user', 'stocks'])
            ->get();

        return response()->json([
            'recherche' => $request->q,
            'depots' => $depots,
            'count' => $depots->count()
        ]);
    }
}