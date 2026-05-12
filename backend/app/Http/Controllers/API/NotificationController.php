<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Récupérer toutes les notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $query = Notification::where('id_destinataire', $user->id_utilisateur);

        // Filtrer par statut (lu/non lu)
        if ($request->has('lu')) {
            $query->where('lu', $request->boolean('lu'));
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'notifications' => $notifications,
            'non_lues' => Notification::where('id_destinataire', $user->id_utilisateur)
                ->where('lu', false)
                ->count(),
            'total' => Notification::where('id_destinataire', $user->id_utilisateur)->count()
        ]);
    }

    /**
     * Récupérer uniquement les notifications non lues
     */
    public function nonLues()
    {
        $user = auth()->user();
        
        $notifications = Notification::where('id_destinataire', $user->id_utilisateur)
            ->where('lu', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'notifications' => $notifications,
            'count' => $notifications->count()
        ]);
    }

    /**
     * Voir le détail d'une notification
     */
    public function show($id)
    {
        $user = auth()->user();
        
        $notification = Notification::where('id_destinataire', $user->id_utilisateur)
            ->findOrFail($id);

        return response()->json(['notification' => $notification]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function marquerLue($id)
    {
        $user = auth()->user();
        
        $notification = Notification::where('id_destinataire', $user->id_utilisateur)
            ->findOrFail($id);

        $notification->marquerCommeLue();

        return response()->json([
            'message' => 'Notification marquée comme lue',
            'notification' => $notification
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function marquerToutesLues()
    {
        $user = auth()->user();
        
        $count = Notification::where('id_destinataire', $user->id_utilisateur)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json([
            'message' => "$count notification(s) marquée(s) comme lue(s)"
        ]);
    }

    /**
     * Supprimer une notification
     */
    public function destroy($id)
    {
        $user = auth()->user();
        
        $notification = Notification::where('id_destinataire', $user->id_utilisateur)
            ->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification supprimée avec succès']);
    }

    /**
     * Supprimer toutes les notifications de l'utilisateur
     */
    public function deleteAll()
    {
        $user = auth()->user();
        
        $count = Notification::where('id_destinataire', $user->id_utilisateur)->delete();

        return response()->json([
            'message' => "$count notification(s) supprimée(s)"
        ]);
    }

    /**
     * Envoyer une notification (admin/manager uniquement)
     */
    public function envoyer(Request $request)
    {
        $request->validate([
            'id_destinataire' => 'required|exists:users,id_utilisateur',
            'titre' => 'required|string|max:100',
            'message' => 'required|string'
        ]);

        $user = auth()->user();
        
        // Vérifier que l'utilisateur a le droit d'envoyer des notifications
        if (!$user->isManager() && !$user->isAdmin() && !$user->isIcr()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $notification = Notification::envoyer(
            $request->id_destinataire,
            $request->titre,
            $request->message
        );

        return response()->json([
            'message' => 'Notification envoyée avec succès',
            'notification' => $notification
        ], 201);
    }

    /**
     * Statistiques des notifications pour l'utilisateur
     */
    public function statistiques()
    {
        $user = auth()->user();
        
        $stats = [
            'total' => Notification::where('id_destinataire', $user->id_utilisateur)->count(),
            'non_lues' => Notification::where('id_destinataire', $user->id_utilisateur)->where('lu', false)->count(),
            'lues' => Notification::where('id_destinataire', $user->id_utilisateur)->where('lu', true)->count()
        ];

        return response()->json($stats);
    }
}