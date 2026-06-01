<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Station;
use App\Models\Stock;
use App\Models\Paiement;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * Lister les réservations du consommateur connecté
     */
    public function index()
    {
        $user = auth()->user();
        
        if (!$user || !$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateur = $user->consommateur;
        if (!$consommateur) {
            return response()->json(['reservations' => [], 'count' => 0]);
        }

        $reservations = Reservation::with(['station'])
            ->where('id_consommateur', $consommateur->id_consommateur)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'reservations' => $reservations,
            'count' => $reservations->count()
        ]);
    }

    /**
     * Créer une réservation (sans paiement - statut en_attente)
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_station' => 'required|exists:stations,id_station',
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite' => 'required|numeric|min:1',
            'date_retrait' => 'nullable|date|after:now'
        ]);

        $user = auth()->user();
        
        if (!$user || !$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateur = $user->consommateur;
        if (!$consommateur) {
            return response()->json(['message' => 'Profil consommateur incomplet'], 400);
        }

        // Vérifier le stock (sans diminuer)
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if (!$stock || $stock->quantite < $request->quantite) {
            return response()->json(['message' => 'Stock insuffisant'], 400);
        }

        // Récupérer le prix
        $manager = User::where('role', 'manager')->first();
        $prix = $request->type_carburant === 'essence' 
            ? ($manager->prix_essence ?? 750) 
            : ($manager->prix_gasoil ?? 700);
        $montant = $request->quantite * $prix;

        // Créer la réservation avec statut "en_attente"
        $reservation = Reservation::create([
            'id_consommateur' => $consommateur->id_consommateur,
            'id_station' => $request->id_station,
            'type_carburant' => $request->type_carburant,
            'quantite' => $request->quantite,
            'montant_total' => $montant,
            'date_reservation' => now(),
            'date_retrait' => $request->date_retrait ?? now()->addDay(),
            'statut' => 'en_attente'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réservation créée, veuillez procéder au paiement',
            'reservation' => $reservation->load('station'),
            'id_reservation' => $reservation->id_reservation,
            'montant_total' => $montant,
            'a_payer' => $montant
        ], 201);
    }

    /**
     * Payer une réservation
     */
    public function payer(Request $request)
    {
        $request->validate([
            'id_reservation' => 'required|exists:reservations,id_reservation',
            'mode_paiement' => 'required|in:orange_money,mobicash,wave,card,especes'
        ]);

        $reservation = Reservation::with('station')->findOrFail($request->id_reservation);
        $user = auth()->user();

        // Vérifier que la réservation appartient au consommateur
        if ($reservation->id_consommateur !== $user->consommateur->id_consommateur) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérifier que la réservation est en attente
        if ($reservation->statut !== 'en_attente') {
            return response()->json(['message' => 'Réservation déjà payée ou annulée'], 400);
        }

        DB::beginTransaction();

        try {
            // Vérifier à nouveau le stock
            $stock = Stock::where('id_station', $reservation->id_station)
                ->where('type_carburant', $reservation->type_carburant)
                ->first();

            if (!$stock || $stock->quantite < $reservation->quantite) {
                return response()->json(['message' => 'Stock insuffisant'], 400);
            }

            // Simulation paiement (95% succès)
            $success = rand(1, 100) <= 95;

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paiement échoué. Veuillez réessayer.'
                ], 400);
            }

            // DIMINUER LE STOCK
            $stock->quantite -= $reservation->quantite;
            $stock->save();

            // CRÉER LE PAIEMENT
            $paiement = Paiement::create([
                'id_reservation' => $reservation->id_reservation,
                'montant' => $reservation->montant_total,
                'mode_paiement' => $request->mode_paiement,
                'date_paiement' => now(),
                'statut' => 'paye',
                'reference_transaction' => 'TXN_' . strtoupper(uniqid())
            ]);

            // METTRE À JOUR LA RÉSERVATION
            $reservation->statut = 'payee';
            $reservation->save();

            // NOTIFIER LE CONSOMMATEUR
            Notification::create([
                'type' => 'paiement',
                'titre' => '✅ Paiement accepté',
                'message' => "Votre paiement de {$reservation->montant_total} FCFA a été accepté. Rendez-vous à la station {$reservation->station->nom}.",
                'id_destinataire' => $user->id_utilisateur,
                'date_envoi' => now(),
                'lu' => false
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement effectué avec succès',
                'reservation' => $reservation->load('station'),
                'paiement' => $paiement
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Voir le détail d'une réservation
     */
    public function show($id)
    {
        $user = auth()->user();
        
        $reservation = Reservation::with(['station', 'paiement'])
            ->findOrFail($id);

        if ($user->isConsommateur() && $reservation->id_consommateur !== $user->consommateur->id_consommateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['reservation' => $reservation]);
    }

    /**
     * Annuler une réservation (et restaurer le stock si payée)
     */
    public function annuler($id)
    {
        $user = auth()->user();
        
        $reservation = Reservation::findOrFail($id);

        if ($user->isConsommateur() && $reservation->id_consommateur !== $user->consommateur->id_consommateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if ($reservation->statut === 'annulee') {
            return response()->json(['message' => 'Cette réservation est déjà annulée'], 400);
        }

        if ($reservation->statut === 'servie') {
            return response()->json(['message' => 'Une réservation servie ne peut pas être annulée'], 400);
        }

        DB::beginTransaction();
        
        try {
            // RESTAURER LE STOCK (si la réservation était payée)
            if ($reservation->statut === 'payee') {
                $stock = Stock::where('id_station', $reservation->id_station)
                    ->where('type_carburant', $reservation->type_carburant)
                    ->first();

                if ($stock) {
                    $stock->quantite += $reservation->quantite;
                    $stock->save();
                }
            }

            $reservation->statut = 'annulee';
            $reservation->save();

            // Notifier le consommateur
            Notification::create([
                'type' => 'reservation',
                'titre' => '❌ Réservation annulée',
                'message' => "Votre réservation de {$reservation->quantite}L a été annulée.",
                'id_destinataire' => $user->id_utilisateur,
                'date_envoi' => now(),
                'lu' => false
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Réservation annulée avec succès',
                'reservation' => $reservation
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POMPISTE - Voir les réservations de sa station
     */
    public function getReservationsPompiste()
    {
        $user = auth()->user();
        $pompiste = $user->pompiste;
        
        if (!$pompiste || !$pompiste->station) {
            return response()->json(['reservations' => []]);
        }
        
        $reservations = Reservation::where('id_station', $pompiste->station->id_station)
            ->where('statut', 'payee')
            ->with(['consommateur.user'])
            ->orderBy('date_reservation', 'asc')
            ->get()
            ->map(function($res) {
                return [
                    'id_reservation' => $res->id_reservation,
                    'quantite' => $res->quantite,
                    'type_carburant' => $res->type_carburant,
                    'montant_total' => $res->montant_total,
                    'nom_client' => $res->consommateur->user->nom ?? '',
                    'prenom_client' => $res->consommateur->user->prenom ?? '',
                    'telephone_client' => $res->consommateur->user->telephone ?? '',
                    'date_reservation' => $res->date_reservation,
                    'date_retrait' => $res->date_retrait
                ];
            });
        
        return response()->json([
            'reservations' => $reservations
        ]);
    }

    /**
     * POMPISTE - Servir une réservation
     */
    public function servirReservation($id)
    {
        $user = auth()->user();
        $pompiste = $user->pompiste;
        
        $reservation = Reservation::findOrFail($id);
        
        if (!$pompiste || $pompiste->station->id_station != $reservation->id_station) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        if ($reservation->statut !== 'payee') {
            return response()->json(['message' => 'Cette réservation ne peut pas être servie'], 400);
        }
        
        $reservation->statut = 'servie';
        $reservation->save();
        
        // Notifier le consommateur
        Notification::create([
            'type' => 'reservation',
            'titre' => '⛽ Carburant servi',
            'message' => "Votre réservation de {$reservation->quantite}L a été servie. Merci de votre confiance !",
            'id_destinataire' => $reservation->consommateur->user->id_utilisateur,
            'date_envoi' => now(),
            'lu' => false
        ]);
        
        return response()->json([
            'message' => 'Réservation servie avec succès',
            'reservation' => $reservation
        ]);
    }

    /**
     * Statistiques des réservations pour le consommateur
     */
    public function statistiques()
    {
        $user = auth()->user();
        
        if (!$user || !$user->isConsommateur()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $consommateur = $user->consommateur;
        if (!$consommateur) {
            return response()->json(['statistiques' => []]);
        }

        $consommateurId = $consommateur->id_consommateur;

        $stats = [
            'total' => Reservation::where('id_consommateur', $consommateurId)->count(),
            'en_attente' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'en_attente')->count(),
            'payees' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'payee')->count(),
            'servies' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'servie')->count(),
            'annulees' => Reservation::where('id_consommateur', $consommateurId)->where('statut', 'annulee')->count(),
            'quantite_totale' => Reservation::where('id_consommateur', $consommateurId)->sum('quantite'),
            'montant_total' => Reservation::where('id_consommateur', $consommateurId)->sum('montant_total')
        ];

        return response()->json($stats);
    }
}