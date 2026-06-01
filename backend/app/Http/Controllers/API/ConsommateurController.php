<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Consommateur;
use App\Models\User;
use App\Models\Reservation;
use App\Models\Paiement;
use App\Models\Alerte;
use App\Models\Station;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ConsommateurController extends Controller
{
    // ==============================================
    // 🔹 PROFIL
    // ==============================================

    // 1. Voir le profil du consommateur connecté
    public function profil(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateur = Consommateur::with('user')
            ->where('id_utilisateur', $user->id_utilisateur)
            ->first();

        return response()->json([
            'consommateur' => $consommateur
        ]);
    }

    // 2. Modifier le profil
    public function updateProfil(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateur = Consommateur::where('id_utilisateur', $user->id_utilisateur)->first();

        $request->validate([
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|unique:users,telephone,' . $user->id_utilisateur
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour',
            'consommateur' => $consommateur->fresh('user')
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 3. Statistiques du consommateur
    public function statistiques(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateur = Consommateur::where('id_utilisateur', $user->id_utilisateur)->first();

        $stats = [
            'total_reservations' => $consommateur->reservations()->count(),
            'reservations_payees' => $consommateur->reservations()->where('statut', 'payee')->count(),
            'reservations_servies' => $consommateur->reservations()->where('statut', 'servie')->count(),
            'reservations_annulees' => $consommateur->reservations()->where('statut', 'annulee')->count(),
            'quantite_totale' => $consommateur->reservations()->sum('quantite'),
            'montant_total' => $consommateur->reservations()->sum('montant_total')
        ];

        return response()->json($stats);
    }
}