<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Livraison;
use App\Models\Mission;
use App\Models\Station;
use App\Models\Gerant;
use App\Models\Stock;
use App\Models\Alerte;
use Illuminate\Http\Request;

class LivraisonController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES LIVRAISONS
    // ==============================================

    // 1. Lister toutes les livraisons
    public function index()
    {
        $livraisons = Livraison::with(['station', 'gerant.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 2. Voir le détail d'une livraison
    public function show($id_livraison)
    {
        $livraison = Livraison::with([
            'station',
            'gerant.user',
            'pompiste.user',
            'missions'
        ])->findOrFail($id_livraison);

        return response()->json([
            'livraison' => $livraison
        ]);
    }

    // 3. Livraisons par mission
    public function getByMission($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);
        
        $livraisons = Livraison::whereHas('missions', function($q) use ($id_mission) {
            $q->where('id_mission', $id_mission);
        })->with(['station', 'gerant.user'])->get();

        return response()->json([
            'mission' => $mission->id_mission,
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 4. Livraisons par station
    public function getByStation($id_station)
    {
        $station = Station::findOrFail($id_station);
        
        $livraisons = Livraison::where('id_station', $id_station)
            ->with(['gerant.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'station' => $station->nom,
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 5. Livraisons par gérant
    public function getByGerant($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        
        $livraisons = Livraison::where('id_gerant', $id_gerant)
            ->with(['station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'gerant' => $gerant->user->nom_complet ?? $gerant->id_gerant,
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 6. Livraisons en attente
    public function enAttente()
    {
        $livraisons = Livraison::where('statut', 'en_attente')
            ->with(['station', 'gerant.user'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 7. Livraisons avec écart
    public function avecEcart()
    {
        $livraisons = Livraison::where('statut', 'ecart')
            ->with(['station', 'gerant.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // 8. Livraisons validées
    public function validees()
    {
        $livraisons = Livraison::where('statut', 'validee')
            ->with(['station', 'gerant.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'livraisons' => $livraisons,
            'count' => $livraisons->count()
        ]);
    }

    // ==============================================
    // 🔹 VALIDATION DES LIVRAISONS
    // ==============================================

    // 9. Valider une livraison (par le gérant)
    public function valider(Request $request, $id_livraison)
    {
        $request->validate([
            'quantite_livree' => 'required|numeric|min:0',
            'code_validation' => 'required|string|size:4',
            'signature_gerant' => 'required|string',
            'signature_chauffeur' => 'required|string',
            'photo_compteur' => 'nullable|string'
        ]);

        $livraison = Livraison::findOrFail($id_livraison);

        // Vérifier le code
        if (!$livraison->verifierCode($request->code_validation)) {
            return response()->json([
                'message' => 'Code de validation incorrect'
            ], 400);
        }

        // Vérifier que la livraison n'est pas déjà validée
        if ($livraison->statut === 'validee') {
            return response()->json([
                'message' => 'Cette livraison est déjà validée'
            ], 400);
        }

        // Valider la livraison
        $livraison->valider(
            $request->quantite_livree,
            $request->signature_gerant,
            $request->signature_chauffeur,
            $request->photo_compteur
        );

        return response()->json([
            'message' => 'Livraison validée avec succès',
            'livraison' => $livraison,
            'ecart' => $livraison->ecart,
            'a_ecart' => $livraison->a_ecart
        ]);
    }

    // 10. Valider plusieurs livraisons (fin de mission)
    public function validerMultiples(Request $request)
    {
        $request->validate([
            'id_mission' => 'required|exists:missions,id_mission',
            'livraisons' => 'required|array',
            'livraisons.*.id_livraison' => 'required|exists:livraisons,id_livraison',
            'livraisons.*.quantite_livree' => 'required|numeric|min:0',
            'livraisons.*.code_validation' => 'required|string|size:4'
        ]);

        $results = [];
        $errors = [];
        $totalEcart = 0;

        foreach ($request->livraisons as $data) {
            $livraison = Livraison::find($data['id_livraison']);

            if (!$livraison->verifierCode($data['code_validation'])) {
                $errors[] = [
                    'id_livraison' => $livraison->id_livraison,
                    'message' => 'Code incorrect'
                ];
                continue;
            }

            $livraison->quantite_livree = $data['quantite_livree'];
            $livraison->date_livraison = now();
            $livraison->statut = ($data['quantite_livree'] == $livraison->quantite_prevue) ? 'validee' : 'ecart';
            $livraison->save();

            $results[] = [
                'id_livraison' => $livraison->id_livraison,
                'statut' => $livraison->statut,
                'ecart' => $livraison->ecart
            ];

            $totalEcart += abs($livraison->ecart);

            // Mettre à jour le stock de la station
            $this->updateStationStock($livraison);
        }

        // Mettre à jour le statut de la mission si toutes les livraisons sont validées
        $mission = Mission::find($request->id_mission);
        $livraisonsRestantes = Livraison::whereHas('missions', function($q) use ($request) {
            $q->where('id_mission', $request->id_mission);
        })->where('statut', 'en_attente')->count();

        if ($livraisonsRestantes === 0) {
            $mission->statut = 'terminee';
            $mission->date_fin = now();
            $mission->save();
        }

        return response()->json([
            'message' => count($errors) > 0 ? 'Livraisons partiellement validées' : 'Toutes les livraisons validées',
            'results' => $results,
            'errors' => $errors,
            'total_ecart' => $totalEcart
        ]);
    }

    // 11. Signaler un écart sur une livraison
    public function signalerEcart(Request $request, $id_livraison)
    {
        $request->validate([
            'quantite_livree' => 'required|numeric|min:0',
            'commentaire' => 'nullable|string'
        ]);

        $livraison = Livraison::findOrFail($id_livraison);

        if ($livraison->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Cette livraison ne peut plus être modifiée'
            ], 400);
        }

        $livraison->signalerEcart($request->quantite_livree, $request->commentaire);

        return response()->json([
            'message' => 'Écart signalé',
            'livraison' => $livraison,
            'ecart' => $livraison->ecart
        ]);
    }

    // ==============================================
    // 🔹 CRÉATION ET MODIFICATION
    // ==============================================

    // 12. Créer une livraison
    public function store(Request $request)
    {
        $request->validate([
            'id_mission' => 'required|exists:missions,id_mission',
            'id_station' => 'required|exists:stations,id_station',
            'id_gerant' => 'required|exists:gerants,id_gerant',
            'quantite_prevue' => 'required|numeric|min:1',
            'code_validation' => 'required|string|size:4'
        ]);

        $livraison = Livraison::create([
            'id_station' => $request->id_station,
            'id_gerant' => $request->id_gerant,
            'quantite_prevue' => $request->quantite_prevue,
            'code_validation' => $request->code_validation,
            'statut' => 'en_attente'
        ]);

        // Associer à la mission (table pivot)
        $livraison->missions()->attach($request->id_mission);

        return response()->json([
            'message' => 'Livraison créée avec succès',
            'livraison' => $livraison
        ], 201);
    }

    // 13. Annuler une livraison
    public function annuler($id_livraison)
    {
        $livraison = Livraison::findOrFail($id_livraison);

        if ($livraison->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Cette livraison ne peut pas être annulée'
            ], 400);
        }

        $livraison->delete();

        return response()->json([
            'message' => 'Livraison annulée avec succès'
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 14. Statistiques des livraisons
    public function statistiques()
    {
        $stats = Livraison::getStatistiques();

        // Écart total
        $stats['ecart_total'] = Livraison::where('statut', 'ecart')
            ->sum(\DB::raw('quantite_prevue - quantite_livree'));

        // Taux de conformité
        $totalValidees = Livraison::where('statut', 'validee')->count();
        $total = Livraison::count();
        $stats['taux_conformite'] = $total > 0 ? round(($totalValidees / $total) * 100, 2) : 0;

        return response()->json($stats);
    }

    // 15. Dashboard des livraisons
    public function dashboard()
    {
        $stats = Livraison::getStatistiques();

        $dernieresLivraisons = Livraison::with(['station', 'gerant.user'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $livraisonsParStation = Livraison::select('id_station', \DB::raw('count(*) as total'))
            ->groupBy('id_station')
            ->with('station')
            ->get();

        return response()->json([
            'statistiques' => $stats,
            'dernieres_livraisons' => $dernieresLivraisons,
            'livraisons_par_station' => $livraisonsParStation
        ]);
    }

    // ==============================================
    // 🔹 FONCTIONS PRIVÉES
    // ==============================================

    // Mettre à jour le stock de la station
    private function updateStationStock($livraison)
    {
        if ($livraison->quantite_livree && $livraison->station) {
            $mission = $livraison->missions()->first();
            if ($mission && $mission->bon) {
                $typeCarburant = $mission->bon->type_carburant;
                
                $stock = Stock::where('id_station', $livraison->id_station)
                    ->where('type_carburant', $typeCarburant)
                    ->first();
                    
                if ($stock) {
                    $stock->quantite += $livraison->quantite_livree;
                    $stock->date_mise_a_jour = now();
                    $stock->save();
                }
            }
        }
    }
}