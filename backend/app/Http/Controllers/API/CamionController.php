<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Camion;
use App\Models\Chauffeur;
use Illuminate\Http\Request;

class CamionController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES CAMIONS (CRUD)
    // ==============================================

    // 1. Lister tous les camions
    public function index()
    {
        $camions = Camion::with(['chauffeur.user'])->get();

        return response()->json([
            'camions' => $camions,
            'count' => $camions->count()
        ]);
    }

    // 2. Voir le détail d'un camion
    public function show($id_camion)
    {
        $camion = Camion::with(['chauffeur.user', 'missions'])->findOrFail($id_camion);

        return response()->json([
            'camion' => $camion
        ]);
    }

    // 3. Créer un nouveau camion
    public function store(Request $request)
    {
        $request->validate([
            'immatriculation' => 'required|string|max:20|unique:camions,immatriculation',
            'capacite' => 'required|numeric|min:1',
            'type_carburant' => 'required|in:essence,gasoil',
            'id_chauffeur' => 'nullable|exists:chauffeurs,id_chauffeur'
        ]);

        $camion = Camion::create([
            'immatriculation' => strtoupper($request->immatriculation),
            'capacite' => $request->capacite,
            'type_carburant' => $request->type_carburant,
            'statut' => 'disponible',
            'id_chauffeur' => $request->id_chauffeur
        ]);

        return response()->json([
            'message' => 'Camion créé avec succès',
            'camion' => $camion->load('chauffeur.user')
        ], 201);
    }

    // 4. Modifier un camion
    public function update(Request $request, $id_camion)
    {
        $camion = Camion::findOrFail($id_camion);

        $request->validate([
            'immatriculation' => 'sometimes|string|max:20|unique:camions,immatriculation,' . $id_camion . ',id_camion',
            'capacite' => 'sometimes|numeric|min:1',
            'type_carburant' => 'sometimes|in:essence,gasoil',
            'id_chauffeur' => 'nullable|exists:chauffeurs,id_chauffeur'
        ]);

        if ($request->has('immatriculation')) {
            $camion->immatriculation = strtoupper($request->immatriculation);
        }
        if ($request->has('capacite')) {
            $camion->capacite = $request->capacite;
        }
        if ($request->has('type_carburant')) {
            $camion->type_carburant = $request->type_carburant;
        }
        if ($request->has('id_chauffeur')) {
            $camion->id_chauffeur = $request->id_chauffeur;
        }

        $camion->save();

        return response()->json([
            'message' => 'Camion modifié avec succès',
            'camion' => $camion->load('chauffeur.user')
        ]);
    }

    // 5. Supprimer un camion
    public function destroy($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);

        // Vérifier si le camion a des missions
        if ($camion->missions()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce camion car il a des missions associées'
            ], 400);
        }

        $camion->delete();

        return response()->json([
            'message' => 'Camion supprimé avec succès'
        ]);
    }

    // ==============================================
    // 🔹 GESTION DU STATUT
    // ==============================================

    // 6. Mettre un camion en mission
    public function mettreEnMission($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);

        if (!$camion->estDisponible()) {
            return response()->json([
                'message' => 'Le camion n\'est pas disponible',
                'statut_actuel' => $camion->statut_texte
            ], 400);
        }

        $camion->mettreEnMission();

        return response()->json([
            'message' => 'Camion mis en mission',
            'camion' => $camion
        ]);
    }

    // 7. Mettre un camion en panne
    public function mettreEnPanne($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);
        $camion->mettreEnPanne();

        return response()->json([
            'message' => 'Camion marqué comme en panne',
            'camion' => $camion
        ]);
    }

    // 8. Remettre un camion disponible
    public function rendreDisponible($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);
        $camion->rendreDisponible();

        return response()->json([
            'message' => 'Camion disponible',
            'camion' => $camion
        ]);
    }

    // ==============================================
    // 🔹 FILTRES ET RECHERCHE
    // ==============================================

    // 9. Lister les camions disponibles
    public function disponibles()
    {
        $camions = Camion::where('statut', 'disponible')
            ->with('chauffeur.user')
            ->get();

        return response()->json([
            'camions' => $camions,
            'count' => $camions->count()
        ]);
    }

    // 10. Lister les camions par type de carburant
    public function byType($type_carburant)
    {
        if (!in_array($type_carburant, ['essence', 'gasoil'])) {
            return response()->json(['message' => 'Type invalide'], 400);
        }

        $camions = Camion::where('type_carburant', $type_carburant)
            ->with('chauffeur.user')
            ->get();

        return response()->json([
            'type' => $type_carburant,
            'camions' => $camions,
            'count' => $camions->count()
        ]);
    }

    // 11. Rechercher un camion par immatriculation
    public function findByImmatriculation($immatriculation)
    {
        $camion = Camion::with('chauffeur.user')
            ->where('immatriculation', strtoupper($immatriculation))
            ->first();

        if (!$camion) {
            return response()->json(['message' => 'Camion non trouvé'], 404);
        }

        return response()->json(['camion' => $camion]);
    }

    // 12. Recherche avancée
    public function search(Request $request)
    {
        $query = Camion::with('chauffeur.user');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('type_carburant')) {
            $query->where('type_carburant', $request->type_carburant);
        }

        if ($request->has('capacite_min')) {
            $query->where('capacite', '>=', $request->capacite_min);
        }

        if ($request->has('capacite_max')) {
            $query->where('capacite', '<=', $request->capacite_max);
        }

        if ($request->has('recherche')) {
            $search = $request->recherche;
            $query->where(function($q) use ($search) {
                $q->where('immatriculation', 'LIKE', "%{$search}%");
            });
        }

        $camions = $query->get();

        return response()->json([
            'camions' => $camions,
            'count' => $camions->count(),
            'filtres' => $request->all()
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES ET TABLEAU DE BORD
    // ==============================================

    // 13. Statistiques des camions
    public function statistiques()
    {
        $stats = Camion::getStatistiques();

        // Détail par type de carburant
        $stats['par_type'] = [
            'essence' => Camion::where('type_carburant', 'essence')->count(),
            'gasoil' => Camion::where('type_carburant', 'gasoil')->count()
        ];

        // Capacité totale
        $stats['capacite_totale'] = Camion::sum('capacite');

        return response()->json($stats);
    }

    // 14. Dashboard des camions
    public function dashboard()
    {
        $stats = Camion::getStatistiques();

        $derniersCamions = Camion::with('chauffeur.user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Camions sans chauffeur
        $sansChauffeur = Camion::whereNull('id_chauffeur')
            ->where('statut', '!=', 'en_panne')
            ->count();

        return response()->json([
            'statistiques' => $stats,
            'derniers_camions' => $derniersCamions,
            'camions_sans_chauffeur' => $sansChauffeur
        ]);
    }

    // ==============================================
    // 🔹 AFFECTATION DES CHAUFFEURS
    // ==============================================

    // 15. Affecter un chauffeur à un camion
    public function affecterChauffeur(Request $request, $id_camion)
    {
        $request->validate([
            'id_chauffeur' => 'required|exists:chauffeurs,id_chauffeur'
        ]);

        $camion = Camion::findOrFail($id_camion);
        $chauffeur = Chauffeur::findOrFail($request->id_chauffeur);

        // Vérifier si le chauffeur a déjà un camion
        $camionExistant = Camion::where('id_chauffeur', $request->id_chauffeur)
            ->where('statut', '!=', 'en_panne')
            ->first();

        if ($camionExistant) {
            return response()->json([
                'message' => 'Ce chauffeur est déjà affecté au camion ' . $camionExistant->immatriculation
            ], 400);
        }

        $camion->id_chauffeur = $request->id_chauffeur;
        $camion->save();

        return response()->json([
            'message' => 'Chauffeur affecté au camion avec succès',
            'camion' => $camion->load('chauffeur.user')
        ]);
    }

    // 16. Retirer le chauffeur d'un camion
    public function retirerChauffeur($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);

        if ($camion->estEnMission()) {
            return response()->json([
                'message' => 'Impossible de retirer le chauffeur, le camion est en mission'
            ], 400);
        }

        $camion->id_chauffeur = null;
        $camion->save();

        return response()->json([
            'message' => 'Chauffeur retiré du camion avec succès',
            'camion' => $camion
        ]);
    }

    // ==============================================
    // 🔹 MISSION DU CAMION
    // ==============================================

    // 17. Voir les missions d'un camion
    public function missions($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);

        $missions = $camion->missions()
            ->with(['chauffeur.user', 'bon'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'camion' => $camion->immatriculation,
            'missions' => $missions,
            'count' => $missions->count()
        ]);
    }
}