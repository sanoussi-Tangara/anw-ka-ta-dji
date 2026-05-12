<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Models\Gerant;
use App\Models\Stock;
use App\Models\Vente;
use App\Models\Livraison;
use App\Models\Reservation;
use Illuminate\Http\Request;

class StationController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES STATIONS (CRUD)
    // ==============================================

    // 1. Lister toutes les stations
    public function index()
    {
        $stations = Station::with([
            'gerant.user', 
            'stocks'
        ])->orderBy('nom')->get();

        // Ajouter les informations de disponibilité
        foreach ($stations as $station) {
            $station->est_disponible = $station->est_disponible;
            $station->couleur = $station->couleur;
            $station->stock_essence = $station->stock_essence;
            $station->stock_gasoil = $station->stock_gasoil;
            $station->prix_essence = $station->prix_essence;
            $station->prix_gasoil = $station->prix_gasoil;
            $station->statut_texte = $station->statut_texte;
        }

        return response()->json([
            'stations' => $stations,
            'count' => $stations->count()
        ]);
    }

    // 2. Voir le détail d'une station
    public function show($id_station)
    {
        $station = Station::with([
            'gerant.user',
            'stocks',
            'livraisons' => function($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            },
            'ventes' => function($q) {
                $q->orderBy('date_vente', 'desc')->limit(10);
            }
        ])->findOrFail($id_station);

        // Ajouter les informations de disponibilité
        $station->est_disponible = $station->est_disponible;
        $station->couleur = $station->couleur;
        $station->stock_essence = $station->stock_essence;
        $station->stock_gasoil = $station->stock_gasoil;
        $station->prix_essence = $station->prix_essence;
        $station->prix_gasoil = $station->prix_gasoil;
        $station->statut_texte = $station->statut_texte;

        return response()->json([
            'station' => $station
        ]);
    }

    // 3. Créer une nouvelle station
    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100|unique:stations,nom',
            'adresse' => 'required|string|max:200',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'id_gerant' => 'nullable|exists:gerants,id_gerant'
        ]);

        $station = Station::create([
            'nom' => $request->nom,
            'adresse' => $request->adresse,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'id_gerant' => $request->id_gerant
        ]);

        // Initialiser les stocks de la station
        Stock::initialiserStationStock($station->id_station);

        return response()->json([
            'message' => 'Station créée avec succès',
            'station' => $station->load('gerant.user', 'stocks')
        ], 201);
    }

    // 4. Modifier une station
    public function update(Request $request, $id_station)
    {
        $station = Station::findOrFail($id_station);

        $request->validate([
            'nom' => 'sometimes|string|max:100|unique:stations,nom,' . $id_station . ',id_station',
            'adresse' => 'sometimes|string|max:200',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'id_gerant' => 'nullable|exists:gerants,id_gerant'
        ]);

        if ($request->has('nom')) $station->nom = $request->nom;
        if ($request->has('adresse')) $station->adresse = $request->adresse;
        if ($request->has('latitude')) $station->latitude = $request->latitude;
        if ($request->has('longitude')) $station->longitude = $request->longitude;
        if ($request->has('id_gerant')) $station->id_gerant = $request->id_gerant;

        $station->save();

        return response()->json([
            'message' => 'Station modifiée avec succès',
            'station' => $station->load('gerant.user', 'stocks')
        ]);
    }

    // 5. Supprimer une station
    public function destroy($id_station)
    {
        $station = Station::findOrFail($id_station);

        // Vérifier si la station a des stocks
        if ($station->stocks && $station->stocks->sum('quantite') > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer cette station car elle contient encore du stock'
            ], 400);
        }

        $station->delete();

        return response()->json([
            'message' => 'Station supprimée avec succès'
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES STOCKS DE LA STATION
    // ==============================================

    // 6. Voir les stocks d'une station
    public function voirStocks($id_station)
    {
        $station = Station::findOrFail($id_station);
        
        $stocks = $station->stocks;

        return response()->json([
            'station' => $station->nom,
            'stocks' => $stocks
        ]);
    }

    // 7. Mettre à jour un stock de station
    public function updateStock(Request $request, $id_station)
    {
        $request->validate([
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite' => 'required|numeric'
        ]);

        $station = Station::findOrFail($id_station);
        
        $stock = Stock::where('id_station', $id_station)
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

    // 8. Vérifier la disponibilité
    public function checkDisponibilite($id_station)
    {
        $station = Station::findOrFail($id_station);

        return response()->json([
            'station' => $station->nom,
            'est_disponible' => $station->est_disponible,
            'statut_texte' => $station->statut_texte,
            'couleur' => $station->couleur,
            'essence' => [
                'disponible' => $station->estDisponibleType('essence'),
                'quantite' => $station->stock_essence,
                'prix' => $station->prix_essence
            ],
            'gasoil' => [
                'disponible' => $station->estDisponibleType('gasoil'),
                'quantite' => $station->stock_gasoil,
                'prix' => $station->prix_gasoil
            ]
        ]);
    }

    // ==============================================
    // 🔹 GESTION DU GÉRANT
    // ==============================================

    // 9. Affecter un gérant à une station
    public function affecterGerant(Request $request, $id_station)
    {
        $request->validate([
            'id_gerant' => 'required|exists:gerants,id_gerant'
        ]);

        $station = Station::findOrFail($id_station);

        // Vérifier si le gérant n'est pas déjà affecté à une autre station
        $stationExistante = Station::where('id_gerant', $request->id_gerant)->first();
        if ($stationExistante && $stationExistante->id_station != $id_station) {
            return response()->json([
                'message' => 'Ce gérant est déjà affecté à la station ' . $stationExistante->nom
            ], 400);
        }

        $station->id_gerant = $request->id_gerant;
        $station->save();

        return response()->json([
            'message' => 'Gérant affecté avec succès',
            'station' => $station->load('gerant.user')
        ]);
    }

    // 10. Retirer le gérant d'une station
    public function retirerGerant($id_station)
    {
        $station = Station::findOrFail($id_station);
        $station->id_gerant = null;
        $station->save();

        return response()->json([
            'message' => 'Gérant retiré avec succès',
            'station' => $station
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES DE LA STATION
    // ==============================================

    // 11. Voir les ventes d'une station
    public function voirVentes($id_station, Request $request)
    {
        $station = Station::findOrFail($id_station);

        $query = Vente::where('id_station', $id_station);

        if ($request->has('date_debut')) {
            $query->whereDate('date_vente', '>=', $request->date_debut);
        }
        if ($request->has('date_fin')) {
            $query->whereDate('date_vente', '<=', $request->date_fin);
        }
        if ($request->has('type_carburant')) {
            $query->where('type_carburant', $request->type_carburant);
        }

        $ventes = $query->with('pompiste.user')
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'station' => $station->nom,
            'ventes' => $ventes,
            'count' => $ventes->count(),
            'montant_total' => $ventes->sum('montant')
        ]);
    }

    // 12. Voir les livraisons d'une station
    public function voirLivraisons($id_station, Request $request)
    {
        $station = Station::findOrFail($id_station);

        $query = Livraison::where('id_station', $id_station);

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $livraisons = $query->with(['gerant.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'station' => $station->nom,
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 13. Voir les réservations d'une station
    public function voirReservations($id_station, Request $request)
    {
        $station = Station::findOrFail($id_station);

        $query = Reservation::where('id_station', $id_station);

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $reservations = $query->with(['consommateur.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'station' => $station->nom,
            'reservations' => $reservations,
            'count' => $reservations->count()
        ]);
    }

    // 14. Statistiques d'une station
    public function statistiques($id_station)
    {
        $station = Station::findOrFail($id_station);

        $ventesAujourdHui = Vente::where('id_station', $id_station)
            ->whereDate('date_vente', today())
            ->get();

        $ventesMois = Vente::where('id_station', $id_station)
            ->whereMonth('date_vente', now()->month)
            ->get();

        $livraisonsMois = Livraison::where('id_station', $id_station)
            ->whereMonth('created_at', now()->month)
            ->get();

        $reservationsEnAttente = Reservation::where('id_station', $id_station)
            ->where('statut', 'en_attente')
            ->count();

        return response()->json([
            'station' => [
                'id' => $station->id_station,
                'nom' => $station->nom,
                'gerant' => $station->gerant->user->nom_complet ?? null
            ],
            'stocks' => [
                'essence' => $station->stock_essence,
                'gasoil' => $station->stock_gasoil
            ],
            'ventes' => [
                'aujourd_hui' => [
                    'nombre' => $ventesAujourdHui->count(),
                    'montant' => $ventesAujourdHui->sum('montant')
                ],
                'mois' => [
                    'nombre' => $ventesMois->count(),
                    'montant' => $ventesMois->sum('montant')
                ]
            ],
            'livraisons_mois' => $livraisonsMois->count(),
            'reservations_attente' => $reservationsEnAttente
        ]);
    }

    // ==============================================
    // 🔹 RECHERCHE ET FILTRES
    // ==============================================

    // 15. Stations avec carburant disponible
    public function disponibles()
    {
        $stations = Station::with('stocks')->get();
        
        $stationsDispo = $stations->filter(function($station) {
            return $station->est_disponible;
        });

        foreach ($stationsDispo as $station) {
            $station->stock_essence = $station->stock_essence;
            $station->stock_gasoil = $station->stock_gasoil;
            $station->couleur = $station->couleur;
        }

        return response()->json([
            'stations' => $stationsDispo->values(),
            'count' => $stationsDispo->count()
        ]);
    }

    // 16. Stations par type de carburant
    public function byTypeCarburant($type_carburant)
    {
        if (!in_array($type_carburant, ['essence', 'gasoil'])) {
            return response()->json(['message' => 'Type invalide'], 400);
        }

        $stations = Station::with('stocks')->get();
        
        $stationsFiltrees = $stations->filter(function($station) use ($type_carburant) {
            return $type_carburant === 'essence' 
                ? $station->stock_essence > 0 
                : $station->stock_gasoil > 0;
        });

        return response()->json([
            'type_carburant' => $type_carburant,
            'stations' => $stationsFiltrees->values(),
            'count' => $stationsFiltrees->count()
        ]);
    }

    // 17. Rechercher une station
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $stations = Station::where('nom', 'LIKE', "%{$request->q}%")
            ->orWhere('adresse', 'LIKE', "%{$request->q}%")
            ->with(['gerant.user', 'stocks'])
            ->get();

        foreach ($stations as $station) {
            $station->couleur = $station->couleur;
            $station->est_disponible = $station->est_disponible;
        }

        return response()->json([
            'recherche' => $request->q,
            'stations' => $stations,
            'count' => $stations->count()
        ]);
    }

    // 18. Stations à proximité
    public function aProximite(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'rayon_km' => 'nullable|numeric|min:1|max:50'
        ]);

        $rayon = $request->rayon_km ?? 10;
        
        // Formule de Haversine pour calculer la distance
        $stations = Station::select('*')
            ->selectRaw("(
                6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                )
            ) AS distance", [$request->latitude, $request->longitude, $request->latitude])
            ->having('distance', '<=', $rayon)
            ->with(['gerant.user', 'stocks'])
            ->orderBy('distance')
            ->get();

        foreach ($stations as $station) {
            $station->couleur = $station->couleur;
            $station->est_disponible = $station->est_disponible;
            $station->distance_km = round($station->distance, 1);
        }

        return response()->json([
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'rayon_km' => $rayon,
            'stations' => $stations,
            'count' => $stations->count()
        ]);
    }
}