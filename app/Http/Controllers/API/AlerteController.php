<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Alerte;
use App\Models\User;
use Illuminate\Http\Request;

class AlerteController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES ALERTES
    // ==============================================

    // 1. Récupérer toutes les alertes non lues d'un utilisateur
    public function nonLues($id_utilisateur)
    {
        $alertes = Alerte::where('id_destinataire', $id_utilisateur)
            ->where('statut', 'non_lue')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'alertes' => $alertes,
            'count' => $alertes->count()
        ]);
    }

    // 2. Récupérer toutes les alertes d'un utilisateur
    public function allByUser($id_utilisateur)
    {
        $alertes = Alerte::where('id_destinataire', $id_utilisateur)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'alertes' => $alertes,
            'count' => $alertes->count()
        ]);
    }

    // 3. Récupérer les alertes par type
    public function byType(Request $request, $id_utilisateur)
    {
        $request->validate([
            'type' => 'required|in:stock_faible,ecart_livraison,probleme_consommateur,incident_chauffeur'
        ]);

        $alertes = Alerte::where('id_destinataire', $id_utilisateur)
            ->where('type', $request->type)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'type' => $request->type,
            'alertes' => $alertes,
            'count' => $alertes->count()
        ]);
    }

    // 4. Récupérer une alerte spécifique
    public function show($id_alerte)
    {
        $alerte = Alerte::with(['destinataire'])->findOrFail($id_alerte);
        return response()->json($alerte);
    }

    // ==============================================
    // 🔹 GESTION DES ALERTES
    // ==============================================

    // 5. Marquer une alerte comme lue
    public function marquerLue($id_alerte)
    {
        $alerte = Alerte::findOrFail($id_alerte);
        $alerte->marquerLue();

        return response()->json([
            'message' => 'Alerte marquée comme lue',
            'alerte' => $alerte
        ]);
    }

    // 6. Marquer plusieurs alertes comme lues
    public function marquerPlusieursLues(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:alertes,id_alerte'
        ]);

        $count = Alerte::whereIn('id_alerte', $request->ids)
            ->update(['statut' => 'lue']);

        return response()->json([
            'message' => "$count alerte(s) marquée(s) comme lue(s)"
        ]);
    }

    // 7. Marquer toutes les alertes d'un utilisateur comme lues
    public function marquerToutesLues($id_utilisateur)
    {
        $count = Alerte::where('id_destinataire', $id_utilisateur)
            ->where('statut', 'non_lue')
            ->update(['statut' => 'lue']);

        return response()->json([
            'message' => "$count alerte(s) marquée(s) comme lue(s)"
        ]);
    }

    // 8. Marquer une alerte comme traitée
    public function marquerTraitee($id_alerte)
    {
        $alerte = Alerte::findOrFail($id_alerte);
        $alerte->marquerTraitee();

        return response()->json([
            'message' => 'Alerte marquée comme traitée',
            'alerte' => $alerte
        ]);
    }

    // 9. Supprimer une alerte
    public function destroy($id_alerte)
    {
        $alerte = Alerte::findOrFail($id_alerte);
        $alerte->delete();

        return response()->json([
            'message' => 'Alerte supprimée avec succès'
        ]);
    }

    // 10. Supprimer plusieurs alertes
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:alertes,id_alerte'
        ]);

        $count = Alerte::whereIn('id_alerte', $request->ids)->delete();

        return response()->json([
            'message' => "$count alerte(s) supprimée(s)"
        ]);
    }

    // 11. Supprimer toutes les alertes d'un utilisateur
    public function destroyAllByUser($id_utilisateur)
    {
        $count = Alerte::where('id_destinataire', $id_utilisateur)->delete();

        return response()->json([
            'message' => "$count alerte(s) supprimée(s)"
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 12. Statistiques des alertes pour un utilisateur
    public function statistiques($id_utilisateur)
    {
        $stats = [
            'non_lues' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('statut', 'non_lue')
                ->count(),
            'lues' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('statut', 'lue')
                ->count(),
            'traitees' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('statut', 'traitee')
                ->count(),
            'total' => Alerte::where('id_destinataire', $id_utilisateur)->count()
        ];

        // Statistiques par type
        $types = ['stock_faible', 'ecart_livraison', 'probleme_consommateur', 'incident_chauffeur'];
        foreach ($types as $type) {
            $stats['par_type'][$type] = Alerte::where('id_destinataire', $id_utilisateur)
                ->where('type', $type)
                ->where('statut', 'non_lue')
                ->count();
        }

        return response()->json($stats);
    }

    // 13. Dashboard des alertes (pour manager ou gérant)
    public function dashboard($id_utilisateur)
    {
        $user = User::findOrFail($id_utilisateur);
        
        $alertes = Alerte::where('id_destinataire', $id_utilisateur)
            ->where('statut', 'non_lue')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $stats = [
            'total_non_lues' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('statut', 'non_lue')
                ->count(),
            'stock_faible' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('type', 'stock_faible')
                ->where('statut', 'non_lue')
                ->count(),
            'ecarts_livraison' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('type', 'ecart_livraison')
                ->where('statut', 'non_lue')
                ->count(),
            'problemes' => Alerte::where('id_destinataire', $id_utilisateur)
                ->where('type', 'probleme_consommateur')
                ->where('statut', 'non_lue')
                ->count()
        ];

        return response()->json([
            'utilisateur' => [
                'id' => $user->id_utilisateur,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'role' => $user->role
            ],
            'statistiques' => $stats,
            'dernieres_alertes' => $alertes
        ]);
    }

    // 14. Créer une alerte manuellement (pour tests ou administration)
    public function creer(Request $request)
    {
        $request->validate([
            'type' => 'required|in:stock_faible,ecart_livraison,probleme_consommateur,incident_chauffeur',
            'message' => 'required|string|min:5',
            'id_destinataire' => 'required|exists:users,id_utilisateur'
        ]);

        $alerte = Alerte::create([
            'type' => $request->type,
            'message' => $request->message,
            'date_creation' => now(),
            'statut' => 'non_lue',
            'id_destinataire' => $request->id_destinataire
        ]);

        return response()->json([
            'message' => 'Alerte créée avec succès',
            'alerte' => $alerte
        ], 201);
    }
}