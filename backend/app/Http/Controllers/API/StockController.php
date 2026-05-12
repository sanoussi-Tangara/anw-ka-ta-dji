<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\Depot;
use App\Models\Station;
use App\Models\Alerte;
use Illuminate\Http\Request;

class StockController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES STOCKS
    // ==============================================

    // 1. Lister tous les stocks
    public function index()
    {
        $stocks = Stock::with(['depot', 'station'])
            ->orderBy('type_carburant')
            ->get();

        return response()->json([
            'stocks' => $stocks,
            'count' => $stocks->count()
        ]);
    }

    // 2. Voir le détail d'un stock
    public function show($id_stock)
    {
        $stock = Stock::with(['depot', 'station'])->findOrFail($id_stock);

        // Ajouter les informations calculées
        $stock->est_bas = $stock->est_bas;
        $stock->niveau = $stock->niveau;
        $stock->couleur = $stock->couleur;
        $stock->icone = $stock->icone;
        $stock->lieu = $stock->lieu;
        $stock->type_lieu = $stock->type_lieu;

        return response()->json([
            'stock' => $stock
        ]);
    }

    // 3. Stocks d'un dépôt
    public function getByDepot($id_depot)
    {
        $depot = Depot::findOrFail($id_depot);
        
        $stocks = Stock::where('id_depot', $id_depot)->get();

        foreach ($stocks as $stock) {
            $stock->est_bas = $stock->est_bas;
            $stock->niveau = $stock->niveau;
        }

        return response()->json([
            'depot' => $depot->nom,
            'stocks' => $stocks
        ]);
    }

    // 4. Stocks d'une station
    public function getByStation($id_station)
    {
        $station = Station::findOrFail($id_station);
        
        $stocks = Stock::where('id_station', $id_station)->get();

        foreach ($stocks as $stock) {
            $stock->est_bas = $stock->est_bas;
            $stock->niveau = $stock->niveau;
        }

        return response()->json([
            'station' => $station->nom,
            'stocks' => $stocks
        ]);
    }

    // 5. Stock par type de carburant et lieu
    public function getByType(Request $request)
    {
        $request->validate([
            'type_carburant' => 'required|in:essence,gasoil',
            'lieu' => 'required|in:depot,station',
            'id_lieu' => 'required|integer'
        ]);

        $query = Stock::where('type_carburant', $request->type_carburant);
        
        if ($request->lieu === 'depot') {
            $query->where('id_depot', $request->id_lieu);
            $lieu = Depot::find($request->id_lieu);
        } else {
            $query->where('id_station', $request->id_lieu);
            $lieu = Station::find($request->id_lieu);
        }

        $stock = $query->first();

        if (!$stock) {
            return response()->json([
                'message' => 'Stock non trouvé'
            ], 404);
        }

        return response()->json([
            'type_carburant' => $request->type_carburant,
            'lieu' => $lieu->nom ?? 'Inconnu',
            'stock' => $stock
        ]);
    }

    // 6. Stocks bas (alerte)
    public function stocksBas()
    {
        $stocks = Stock::whereRaw('quantite <= seuil_alerte')->get();

        foreach ($stocks as $stock) {
            $stock->est_bas = $stock->est_bas;
            $stock->niveau = $stock->niveau;
            $stock->lieu = $stock->lieu;
        }

        return response()->json([
            'stocks' => $stocks,
            'count' => $stocks->count()
        ]);
    }

    // 7. Stocks par niveau
    public function getByNiveau($niveau)
    {
        if (!in_array($niveau, ['eleve', 'moyen', 'faible', 'rupture'])) {
            return response()->json(['message' => 'Niveau invalide'], 400);
        }

        $stocks = Stock::all()->filter(function($stock) use ($niveau) {
            return $stock->niveau === $niveau;
        })->values();

        return response()->json([
            'niveau' => $niveau,
            'stocks' => $stocks,
            'count' => $stocks->count()
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES STOCKS
    // ==============================================

    // 8. Créer un stock
    public function store(Request $request)
    {
        $request->validate([
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite' => 'required|numeric|min:0',
            'seuil_alerte' => 'nullable|numeric|min:0',
            'id_depot' => 'required_without:id_station|exists:depots,id_depot',
            'id_station' => 'required_without:id_depot|exists:stations,id_station'
        ]);

        $stock = Stock::create([
            'type_carburant' => $request->type_carburant,
            'quantite' => $request->quantite,
            'seuil_alerte' => $request->seuil_alerte ?? 1000,
            'date_mise_a_jour' => now(),
            'id_depot' => $request->id_depot,
            'id_station' => $request->id_station
        ]);

        return response()->json([
            'message' => 'Stock créé avec succès',
            'stock' => $stock
        ], 201);
    }

    // 9. Mettre à jour un stock
    public function update(Request $request, $id_stock)
    {
        $stock = Stock::findOrFail($id_stock);

        $request->validate([
            'quantite' => 'sometimes|numeric|min:0',
            'seuil_alerte' => 'sometimes|numeric|min:0'
        ]);

        $ancienneQuantite = $stock->quantite;

        if ($request->has('quantite')) {
            $stock->quantite = $request->quantite;
        }
        if ($request->has('seuil_alerte')) {
            $stock->seuil_alerte = $request->seuil_alerte;
        }

        $stock->date_mise_a_jour = now();
        $stock->save();

        // Déclencher une alerte si le stock est devenu bas
        if ($stock->est_bas && $ancienneQuantite > $stock->seuil_alerte) {
            $this->declencherAlerteStock($stock);
        }

        return response()->json([
            'message' => 'Stock mis à jour',
            'stock' => $stock
        ]);
    }

    // 10. Ajouter du stock
    public function ajouterStock(Request $request, $id_stock)
    {
        $request->validate([
            'quantite' => 'required|numeric|min:0.01'
        ]);

        $stock = Stock::findOrFail($id_stock);
        
        $ancienneQuantite = $stock->quantite;
        $stock->ajouter($request->quantite);

        return response()->json([
            'message' => 'Stock ajouté avec succès',
            'stock' => $stock,
            'ancienne_quantite' => $ancienneQuantite,
            'nouvelle_quantite' => $stock->quantite
        ]);
    }

    // 11. Retirer du stock
    public function retirerStock(Request $request, $id_stock)
    {
        $request->validate([
            'quantite' => 'required|numeric|min:0.01'
        ]);

        $stock = Stock::findOrFail($id_stock);

        if (!$stock->estDisponible($request->quantite)) {
            return response()->json([
                'message' => 'Stock insuffisant',
                'disponible' => $stock->quantite,
                'demande' => $request->quantite
            ], 400);
        }

        $ancienneQuantite = $stock->quantite;
        $stock->retirer($request->quantite);

        return response()->json([
            'message' => 'Stock retiré avec succès',
            'stock' => $stock,
            'ancienne_quantite' => $ancienneQuantite,
            'nouvelle_quantite' => $stock->quantite
        ]);
    }

    // 12. Vérifier la disponibilité d'une quantité
    public function checkDisponibilite(Request $request, $id_stock)
    {
        $request->validate([
            'quantite' => 'required|numeric|min:0.01'
        ]);

        $stock = Stock::findOrFail($id_stock);
        
        $disponible = $stock->estDisponible($request->quantite);

        return response()->json([
            'stock_id' => $id_stock,
            'quantite_disponible' => $stock->quantite,
            'quantite_demandee' => $request->quantite,
            'disponible' => $disponible
        ]);
    }

    // 13. Supprimer un stock
    public function destroy($id_stock)
    {
        $stock = Stock::findOrFail($id_stock);

        if ($stock->quantite > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer un stock qui contient encore du carburant'
            ], 400);
        }

        $stock->delete();

        return response()->json([
            'message' => 'Stock supprimé avec succès'
        ]);
    }

    // ==================================================
    // 🔹 STATISTIQUES
    // ==================================================

    // 14. Statistiques globales des stocks
    public function statistiques()
    {
        $stats = [
            'total_stocks' => Stock::count(),
            'total_essence' => Stock::where('type_carburant', 'essence')->sum('quantite'),
            'total_gasoil' => Stock::where('type_carburant', 'gasoil')->sum('quantite'),
            'stocks_bas' => Stock::whereRaw('quantite <= seuil_alerte')->count(),
            'stocks_eleves' => Stock::whereRaw('quantite > seuil_alerte * 2')->count(),
            'stocks_moyens' => Stock::whereRaw('quantite > seuil_alerte AND quantite <= seuil_alerte * 2')->count(),
            'stocks_rupture' => Stock::where('quantite', 0)->count()
        ];

        $stats['total_stocks_depots'] = Stock::whereNotNull('id_depot')->count();
        $stats['total_stocks_stations'] = Stock::whereNotNull('id_station')->count();

        return response()->json($stats);
    }

    // 15. Dashboard des stocks
    public function dashboard()
    {
        // Stocks par type
        $essence = [
            'total' => Stock::where('type_carburant', 'essence')->sum('quantite'),
            'depots' => Stock::where('type_carburant', 'essence')->whereNotNull('id_depot')->sum('quantite'),
            'stations' => Stock::where('type_carburant', 'essence')->whereNotNull('id_station')->sum('quantite')
        ];

        $gasoil = [
            'total' => Stock::where('type_carburant', 'gasoil')->sum('quantite'),
            'depots' => Stock::where('type_carburant', 'gasoil')->whereNotNull('id_depot')->sum('quantite'),
            'stations' => Stock::where('type_carburant', 'gasoil')->whereNotNull('id_station')->sum('quantite')
        ];

        // Stocks bas (alertes)
        $alertes = Stock::with(['depot', 'station'])
            ->whereRaw('quantite <= seuil_alerte')
            ->get();

        foreach ($alertes as $alerte) {
            $alerte->lieu = $alerte->lieu;
            $alerte->niveau = $alerte->niveau;
        }

        // Dernières mises à jour
        $dernieresMAJ = Stock::orderBy('date_mise_a_jour', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'resume' => [
                'essence' => $essence,
                'gasoil' => $gasoil
            ],
            'alertes_stock' => $alertes,
            'dernieres_mises_a_jour' => $dernieresMAJ
        ]);
    }

    // 16. Historique des mouvements de stock
    public function historique($id_stock, Request $request)
    {
        $stock = Stock::findOrFail($id_stock);
        
        // Ceci nécessite une table des mouvements de stock
        // Exemple à créer : stock_mouvements (id, id_stock, type, quantite, date, commentaire)
        
        return response()->json([
            'stock' => $stock,
            'message' => 'Cette fonctionnalité nécessite une table des mouvements de stock'
        ]);
    }

    // ==================================================
    // 🔹 FONCTIONS PRIVÉES
    // ==================================================

    // Déclencher une alerte pour stock bas
    private function declencherAlerteStock($stock)
    {
        $destinataireId = null;
        
        if ($stock->id_station && $stock->station && $stock->station->gerant) {
            $destinataireId = $stock->station->gerant->user->id_utilisateur ?? null;
        } elseif ($stock->id_depot && $stock->depot && $stock->depot->responsable) {
            $destinataireId = $stock->depot->responsable->user->id_utilisateur ?? null;
        }
        
        if ($destinataireId) {
            Alerte::create([
                'type' => 'stock_faible',
                'message' => "Stock faible : {$stock->type_carburant} à {$stock->lieu}",
                'date_creation' => now(),
                'statut' => 'non_lue',
                'id_destinataire' => $destinataireId
            ]);
        }
    }
}