<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Station;
use App\Models\Stock;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Lister les réservations du consommateur connecté
     */
    public function index()
    {
        $user = auth()->user();
        
        if (!$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $reservations = Reservation::with(['station'])
            ->where('id_consommateur', $user->consommateur->id_consommateur)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'reservations' => $reservations,
            'count' => $reservations->count()
        ]);
    }

    /**
     * Créer une nouvelle réservation
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_station' => 'required|exists:stations,id_station',
            'quantite' => 'required|numeric|min:1',
            'date_retrait' => 'nullable|date|after:now'
        ]);

        $user = auth()->user();
        
        if (!$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Vérifier le stock
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', 'essence') // À ajuster selon le besoin
            ->first();

        if (!$stock || $stock->quantite < $request->quantite) {
            return response()->json([
                'message' => 'Stock insuffisant dans cette station'
            ], 400);
        }

        $reservation = Reservation::create([
            'id_consommateur' => $user->consommateur->id_consommateur,
            'id_station' => $request->id_station,
            'quantite' => $request->quantite,
            'date_reservation' => now(),
            'date_retrait' => $request->date_retrait ?? now()->addDay(),
            'statut' => 'en_attente'
        ]);

        return response()->json([
            'message' => 'Réservation créée avec succès',
            'reservation' => $reservation->load('station')
        ], 201);
    }

    /**
     * Voir le détail d'une réservation
     */
    public function show($id)
    {
        $user = auth()->user();
        
        $reservation = Reservation::with(['station', 'paiement'])
            ->findOrFail($id);

        // Vérifier que la réservation appartient au consommateur
        if ($user->isConsommateur() && $reservation->id_consommateur !== $user->consommateur->id_consommateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['reservation' => $reservation]);
    }

    /**
     * Annuler une réservation
     */
    public function annuler($id)
    {
        $user = auth()->user();
        
        $reservation = Reservation::findOrFail($id);

        if ($user->isConsommateur() && $reservation->id_consommateur !== $user->consommateur->id_consommateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if ($reservation->estAnnulee()) {
            return response()->json(['message' => 'Cette réservation est déjà annulée'], 400);
        }

        $reservation->annuler();

        return response()->json([
            'message' => 'Réservation annulée avec succès',
            'reservation' => $reservation
        ]);
    }

    /**
     * Confirmer une réservation (après paiement)
     */
    public function confirmer($id)
    {
        $reservation = Reservation::findOrFail($id);

        if ($reservation->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette réservation ne peut pas être confirmée'], 400);
        }

        $reservation->confirmer();

        return response()->json([
            'message' => 'Réservation confirmée',
            'reservation' => $reservation
        ]);
    }

    /**
     * Statistiques des réservations pour le consommateur
     */
    public function statistiques()
    {
        $user = auth()->user();
        
        if (!$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateurId = $user->consommateur->id_consommateur;

        $stats = [
            'total' => Reservation::where('id_consommateur', $consommateurId)->count(),
            'en_attente' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'en_attente')->count(),
            'confirmees' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'confirmee')->count(),
            'annulees' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'annulee')->count(),
            'quantite_totale' => Reservation::where('id_consommateur', $consommateurId)->sum('quantite')
        ];

        return response()->json($stats);
    }
}