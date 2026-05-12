<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Bon;
use App\Models\Icr;
use App\Models\Chauffeur;
use App\Models\Camion;
use App\Models\Livraison;
use App\Models\Certificat;
use App\Models\Alerte;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES MISSIONS
    // ==============================================

    // 1. Lister toutes les missions
    public function index()
    {
        $missions = Mission::with([
            'bon.fournisseur.user',
            'bon.depot',
            'icr.user',
            'chauffeur.user',
            'camion',
            'livraisons.station'
        ])->orderBy('created_at', 'desc')->get();

        return response()->json([
            'missions' => $missions,
            'count' => $missions->count()
        ]);
    }

    // 2. Voir le détail d'une mission
    public function show($id_mission)
    {
        $mission = Mission::with([
            'bon.fournisseur.user',
            'bon.depot',
            'icr.user',
            'chauffeur.user',
            'camion',
            'livraisons.station',
            'certificat'
        ])->findOrFail($id_mission);

        return response()->json([
            'mission' => $mission
        ]);
    }

    // 3. Missions par ICR
    public function getByIcr($id_icr)
    {
        $icr = Icr::findOrFail($id_icr);
        
        $missions = Mission::where('id_icr', $id_icr)
            ->with(['bon.fournisseur.user', 'chauffeur.user', 'livraisons.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'icr' => $icr->user->nom_complet ?? $icr->id_icr,
            'missions' => $missions,
            'count' => $missions->count()
        ]);
    }

    // 4. Missions par chauffeur
    public function getByChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        
        $missions = Mission::where('id_chauffeur', $id_chauffeur)
            ->with(['bon.fournisseur.user', 'icr.user', 'livraisons.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'chauffeur' => $chauffeur->user->nom_complet ?? $chauffeur->id_chauffeur,
            'missions' => $missions,
            'count' => $missions->count()
        ]);
    }

    // 5. Missions par bon
    public function getByBon($id_bon)
    {
        $bon = Bon::findOrFail($id_bon);
        
        $mission = Mission::where('id_bon', $id_bon)
            ->with(['icr.user', 'chauffeur.user', 'camion', 'livraisons.station'])
            ->first();

        if (!$mission) {
            return response()->json([
                'message' => 'Aucune mission associée à ce bon'
            ], 404);
        }

        return response()->json([
            'bon' => $bon->id_bon,
            'mission' => $mission
        ]);
    }

    // 6. Missions par statut
    public function getByStatut($statut)
    {
        if (!in_array($statut, ['planifiee', 'en_cours', 'terminee', 'annulee'])) {
            return response()->json(['message' => 'Statut invalide'], 400);
        }

        $missions = Mission::where('statut', $statut)
            ->with(['bon.fournisseur.user', 'chauffeur.user', 'icr.user', 'livraisons.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'statut' => $statut,
            'missions' => $missions,
            'count' => $missions->count()
        ]);
    }

    // 7. Mission en cours d'un chauffeur
    public function getEnCoursForChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        
        $mission = Mission::where('id_chauffeur', $id_chauffeur)
            ->where('statut', 'en_cours')
            ->with(['bon.fournisseur.user', 'bon.depot', 'livraisons.station', 'camion'])
            ->first();

        if (!$mission) {
            return response()->json([
                'message' => 'Aucune mission en cours pour ce chauffeur'
            ], 404);
        }

        return response()->json([
            'mission' => $mission
        ]);
    }

    // ==============================================
    // 🔹 CRÉATION ET GESTION DES MISSIONS
    // ==============================================

    // 8. Créer une mission
    public function store(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon|unique:missions,id_bon',
            'id_icr' => 'required|exists:icr,id_icr',
            'id_chauffeur' => 'required|exists:chauffeurs,id_chauffeur',
            'id_camion' => 'required|exists:camions,id_camion'
        ]);

        // Vérifier que le chauffeur n'a pas déjà une mission en cours
        $missionExistante = Mission::where('id_chauffeur', $request->id_chauffeur)
            ->whereIn('statut', ['planifiee', 'en_cours'])
            ->first();

        if ($missionExistante) {
            return response()->json([
                'message' => 'Ce chauffeur a déjà une mission en cours ou planifiée'
            ], 400);
        }

        // Vérifier que le camion est disponible
        $camion = Camion::find($request->id_camion);
        if (!$camion->estDisponible()) {
            return response()->json([
                'message' => 'Ce camion n\'est pas disponible'
            ], 400);
        }

        $mission = Mission::create([
            'id_bon' => $request->id_bon,
            'id_icr' => $request->id_icr,
            'id_chauffeur' => $request->id_chauffeur,
            'id_camion' => $request->id_camion,
            'statut' => 'planifiee'
        ]);

        // Mettre le camion en mission
        $camion->mettreEnMission();

        return response()->json([
            'message' => 'Mission créée avec succès',
            'mission' => $mission->load(['bon', 'icr.user', 'chauffeur.user', 'camion'])
        ], 201);
    }

    // 9. Démarrer une mission
    public function demarrer($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);

        if ($mission->statut !== 'planifiee') {
            return response()->json([
                'message' => 'Seule une mission planifiée peut être démarrée'
            ], 400);
        }

        $mission->demarrer();

        return response()->json([
            'message' => 'Mission démarrée',
            'mission' => $mission
        ]);
    }

    // 10. Terminer une mission
    public function terminer($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);

        if (!$mission->estTerminable()) {
            return response()->json([
                'message' => 'Toutes les livraisons doivent être validées avant de terminer la mission',
                'livraisons_restantes' => $mission->livraisons()->where('statut', '!=', 'validee')->count()
            ], 400);
        }

        $mission->terminer();

        // Remettre le camion disponible
        if ($mission->camion) {
            $mission->camion->rendreDisponible();
        }

        return response()->json([
            'message' => 'Mission terminée',
            'mission' => $mission
        ]);
    }

    // 11. Annuler une mission
    public function annuler($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);

        if (!in_array($mission->statut, ['planifiee', 'en_cours'])) {
            return response()->json([
                'message' => 'Cette mission ne peut pas être annulée'
            ], 400);
        }

        $mission->annuler();

        // Remettre le camion disponible
        if ($mission->camion) {
            $mission->camion->rendreDisponible();
        }

        return response()->json([
            'message' => 'Mission annulée',
            'mission' => $mission
        ]);
    }

    // 12. Modifier une mission
    public function update(Request $request, $id_mission)
    {
        $mission = Mission::findOrFail($id_mission);

        if ($mission->statut !== 'planifiee') {
            return response()->json([
                'message' => 'Seule une mission planifiée peut être modifiée'
            ], 400);
        }

        $request->validate([
            'id_chauffeur' => 'sometimes|exists:chauffeurs,id_chauffeur',
            'id_camion' => 'sometimes|exists:camions,id_camion'
        ]);

        if ($request->has('id_chauffeur')) {
            // Vérifier que le nouveau chauffeur n'a pas de mission
            $missionExistante = Mission::where('id_chauffeur', $request->id_chauffeur)
                ->whereIn('statut', ['planifiee', 'en_cours'])
                ->where('id_mission', '!=', $id_mission)
                ->first();

            if ($missionExistante) {
                return response()->json([
                    'message' => 'Ce chauffeur a déjà une mission en cours'
                ], 400);
            }
            $mission->id_chauffeur = $request->id_chauffeur;
        }

        if ($request->has('id_camion')) {
            $camion = Camion::find($request->id_camion);
            if (!$camion->estDisponible()) {
                return response()->json([
                    'message' => 'Ce camion n\'est pas disponible'
                ], 400);
            }
            
            // Libérer l'ancien camion
            if ($mission->camion) {
                $mission->camion->rendreDisponible();
            }
            
            $mission->id_camion = $request->id_camion;
            $camion->mettreEnMission();
        }

        $mission->save();

        return response()->json([
            'message' => 'Mission modifiée',
            'mission' => $mission->load(['chauffeur.user', 'camion'])
        ]);
    }

    // ==============================================
    // 🔹 LIVRAISONS D'UNE MISSION
    // ==============================================

    // 13. Ajouter une livraison à une mission
    public function addLivraison(Request $request, $id_mission)
    {
        $request->validate([
            'id_station' => 'required|exists:stations,id_station',
            'id_gerant' => 'required|exists:gerants,id_gerant',
            'quantite_prevue' => 'required|numeric|min:1',
            'code_validation' => 'required|string|size:4'
        ]);

        $mission = Mission::findOrFail($id_mission);

        if ($mission->statut !== 'planifiee') {
            return response()->json([
                'message' => 'Impossible d\'ajouter une livraison à une mission déjà démarrée'
            ], 400);
        }

        $livraison = Livraison::create([
            'id_station' => $request->id_station,
            'id_gerant' => $request->id_gerant,
            'quantite_prevue' => $request->quantite_prevue,
            'code_validation' => $request->code_validation,
            'statut' => 'en_attente'
        ]);

        $mission->livraisons()->attach($livraison->id_livraison);

        return response()->json([
            'message' => 'Livraison ajoutée à la mission',
            'livraison' => $livraison
        ], 201);
    }

    // 14. Retirer une livraison d'une mission
    public function removeLivraison($id_mission, $id_livraison)
    {
        $mission = Mission::findOrFail($id_mission);
        $livraison = Livraison::findOrFail($id_livraison);

        if ($mission->statut !== 'planifiee') {
            return response()->json([
                'message' => 'Impossible de retirer une livraison d\'une mission déjà démarrée'
            ], 400);
        }

        $mission->livraisons()->detach($id_livraison);
        $livraison->delete();

        return response()->json([
            'message' => 'Livraison retirée de la mission'
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 15. Statistiques des missions
    public function statistiques()
    {
        $stats = [
            'total' => Mission::count(),
            'planifiee' => Mission::where('statut', 'planifiee')->count(),
            'en_cours' => Mission::where('statut', 'en_cours')->count(),
            'terminee' => Mission::where('statut', 'terminee')->count(),
            'annulee' => Mission::where('statut', 'annulee')->count()
        ];

        // Délai moyen des missions
        $missionsTerminees = Mission::where('statut', 'terminee')
            ->whereNotNull('date_debut')
            ->whereNotNull('date_fin')
            ->get();

        $dureeMoyenne = 0;
        foreach ($missionsTerminees as $mission) {
            $dureeMoyenne += $mission->duree;
        }
        
        $stats['duree_moyenne_heures'] = $missionsTerminees->count() > 0 
            ? round($dureeMoyenne / $missionsTerminees->count(), 2) 
            : 0;

        return response()->json($stats);
    }

    // 16. Dashboard des missions
    public function dashboard()
    {
        $stats = [
            'total' => Mission::count(),
            'en_cours' => Mission::where('statut', 'en_cours')->count(),
            'aujourd_hui' => Mission::whereDate('date_debut', today())->count()
        ];

        $missionsEnCours = Mission::where('statut', 'en_cours')
            ->with(['bon.depot', 'chauffeur.user', 'livraisons.station'])
            ->get();

        $dernieresMissions = Mission::with(['bon.fournisseur.user', 'chauffeur.user'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'statistiques' => $stats,
            'missions_en_cours' => $missionsEnCours,
            'dernieres_missions' => $dernieresMissions
        ]);
    }

    // 17. Progression d'une mission
    public function progression($id_mission)
    {
        $mission = Mission::with(['livraisons'])->findOrFail($id_mission);

        return response()->json([
            'mission' => [
                'id' => $mission->id_mission,
                'statut' => $mission->statut
            ],
            'progression' => [
                'pourcentage' => $mission->progression,
                'livraisons_validees' => $mission->livraisons_validees,
                'total_livraisons' => $mission->nombre_livraisons
            ]
        ]);
    }
}