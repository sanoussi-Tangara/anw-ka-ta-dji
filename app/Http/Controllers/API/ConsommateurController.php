<?php

namespace App\Http\Controllers;

use App\Models\Consommateur;
use App\Models\Reservation;
use App\Models\Paiement;
use App\Models\Alerte;
use App\Models\Station;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConsommateurController extends Controller
{
    // 🔹 1. Réserver carburant
    public function reserver(Request $request)
    {
        $request->validate([
            'id_consommateur' => 'required|exists:consommateurs,id_consommateur',
            'id_station' => 'required|exists:stations,id_station',
            'quantite' => 'required|numeric|min:1',
            'type_carburant' => 'required|in:essence,gasoil'
        ]);

        // Vérifier si la station a assez de stock
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if (!$stock || $stock->quantite < $request->quantite) {
            return response()->json([
                'message' => 'Stock insuffisant dans cette station'
            ], 400);
        }

        // Créer la réservation
        $reservation = Reservation::create([
            'id_consommateur' => $request->id_consommateur,
            'id_station' => $request->id_station,
            'quantite' => $request->quantite,
            'date_reservation' => now(),
            'date_retrait' => $request->date_retrait ?? now()->addDay(),
            'statut' => 'en_attente'
        ]);

        return response()->json([
            'message' => 'Réservation effectuée avec succès',
            'reservation' => $reservation
        ], 201);
    }

    // 🔹 2. Paiement en ligne
    public function payer(Request $request)
    {
        $request->validate([
            'id_reservation' => 'required|exists:reservations,id_reservation',
            'montant' => 'required|numeric|min:1',
            'mode_paiement' => 'required|in:orange_money,mobicash,wave,carte'
        ]);

        // Vérifier si la réservation existe et n'est pas déjà payée
        $reservation = Reservation::find($request->id_reservation);

        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        if ($reservation->paiement) {
            return response()->json(['message' => 'Cette réservation est déjà payée'], 400);
        }

        // Créer le paiement
        $paiement = Paiement::create([
            'id_reservation' => $request->id_reservation,
            'montant' => $request->montant,
            'mode_paiement' => $request->mode_paiement,
            'date_paiement' => now(),
            'statut' => 'paye',
            'reference_transaction' => 'TRX_' . time() . '_' . uniqid()
        ]);

        // Mettre à jour le statut de la réservation
        $reservation->statut = 'confirmee';
        $reservation->save();

        return response()->json([
            'message' => 'Paiement effectué avec succès',
            'paiement' => $paiement
        ], 201);
    }

    // 🔹 3. Voir stations avec disponibilité du carburant
    public function voirStations(Request $request)
    {
        $query = Station::with(['stocks' => function($q) {
            $q->where('quantite', '>', 0);
        }, 'gerant.user']);

        // Filtrer par type de carburant si demandé
        if ($request->has('type_carburant')) {
            $type = $request->type_carburant;
            $query->whereHas('stocks', function($q) use ($type) {
                $q->where('type_carburant', $type)->where('quantite', '>', 0);
            });
        }

        // Filtrer par prix ? (à implémenter selon ta logique)
        // if ($request->has('prix_max')) { ... }

        $stations = $query->get();

        // Ajouter l'information de disponibilité
        foreach ($stations as $station) {
            $station->disponible = $station->stocks->sum('quantite') > 0;
            $station->essence_disponible = $station->stocks->where('type_carburant', 'essence')->sum('quantite') > 0;
            $station->gasoil_disponible = $station->stocks->where('type_carburant', 'gasoil')->sum('quantite') > 0;
        }

        return response()->json($stations);
    }

   // 🔹 4. Signaler un problème (destiné au gérant de la station)
public function signalerProbleme(Request $request)
{
    $request->validate([
        'id_consommateur' => 'required|exists:consommateurs,id_consommateur',
        'id_station' => 'required|exists:stations,id_station',  // ← obligatoire maintenant
        'message' => 'required|string|min:5'
    ]);

    // 🔸 Récupérer la station et son gérant
    $station = Station::with('gerant.user')->findOrFail($request->id_station);
    
    if (!$station->gerant || !$station->gerant->user) {
        return response()->json([
            'message' => 'Station non associée à un gérant'
        ], 400);
    }

    // 🔸 Le destinataire est le gérant de la station
    $destinataire = $station->gerant->user;

    // 🔸 Créer l'alerte pour le gérant
    $alerte = Alerte::create([
        'type' => 'probleme_consommateur',
        'message' => $request->message,
        'date_creation' => now(),
        'statut' => 'non_lue',
        'id_destinataire' => $destinataire->id_utilisateur,  // ← gérant, pas consommateur
        'id_consommateur' => $request->id_consommateur,     // ← qui a signalé
        'id_station' => $request->id_station                // ← quelle station
    ]);

    // Optionnel : notifier le gérant (push notification, SMS, email)
    // Notification::send($destinataire, new NouveauSignalement($alerte));

    return response()->json([
        'message' => 'Problème signalé au gérant de la station avec succès',
        'alerte' => $alerte
    ], 201);
}

    // 🔹 5. Voir mes réservations
    public function mesReservations($id_consommateur)
    {
        $reservations = Reservation::with(['station', 'paiement'])
            ->where('id_consommateur', $id_consommateur)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reservations);
    }

    // 🔹 6. Annuler une réservation
    public function annulerReservation($id_reservation)
    {
        $reservation = Reservation::find($id_reservation);

        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        if ($reservation->statut === 'annulee') {
            return response()->json(['message' => 'Réservation déjà annulée'], 400);
        }

        $reservation->statut = 'annulee';
        $reservation->save();

        return response()->json([
            'message' => 'Réservation annulée avec succès'
        ]);
    }

    // 🔹 7. Voir le profil du consommateur
    public function profil($id_consommateur)
    {
        $consommateur = Consommateur::with('user')
            ->find($id_consommateur);

        if (!$consommateur) {
            return response()->json(['message' => 'Consommateur non trouvé'], 404);
        }

        return response()->json($consommateur);
    }
}