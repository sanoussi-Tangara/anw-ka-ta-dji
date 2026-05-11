<?php

namespace App\Http\Controllers;

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
    // 🔹 AUTHENTIFICATION
    // ==============================================

    // 1. Inscription
    public function register(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'telephone' => 'required|string|unique:users,telephone'
        ]);

        // Créer l'utilisateur
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'telephone' => $request->telephone,
            'role' => 'consommateur'
        ]);

        // Créer le consommateur lié
        $consommateur = Consommateur::create([
            'id_utilisateur' => $user->id_utilisateur
        ]);

        // Générer le token d'authentification
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie',
            'consommateur' => $consommateur->load('user'),
            'token' => $token
        ], 201);
    }

    // 2. Connexion
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $request->email)
            ->where('role', 'consommateur')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        $consommateur = Consommateur::where('id_utilisateur', $user->id_utilisateur)->first();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'consommateur' => $consommateur->load('user'),
            'token' => $token
        ]);
    }

    // 3. Déconnexion
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    // 4. Récupérer le profil du consommateur connecté
    public function me(Request $request)
    {
        $user = $request->user();
        $consommateur = Consommateur::where('id_utilisateur', $user->id_utilisateur)
            ->with('user')
            ->first();

        return response()->json([
            'consommateur' => $consommateur
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES STATIONS
    // ==============================================

    // 5. Voir les stations avec disponibilité
    public function voirStations(Request $request)
    {
        $query = Station::with(['stocks' => function($q) {
            $q->where('quantite', '>', 0);
        }, 'gerant.user']);

        // Filtrer par type de carburant
        if ($request->has('type_carburant')) {
            $type = $request->type_carburant;
            $query->whereHas('stocks', function($q) use ($type) {
                $q->where('type_carburant', $type)->where('quantite', '>', 0);
            });
        }

        // Filtrer par recherche (nom de station)
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%');
        }

        $stations = $query->get();

        // Ajouter les informations de disponibilité
        foreach ($stations as $station) {
            $stockEssence = $station->stocks->where('type_carburant', 'essence')->sum('quantite');
            $stockGasoil = $station->stocks->where('type_carburant', 'gasoil')->sum('quantite');

            $station->prix_essence = 750; // À configurer
            $station->prix_gasoil = 700;  // À configurer
            $station->disponible = ($stockEssence > 0 || $stockGasoil > 0);
            $station->couleur = ($stockEssence > 0 || $stockGasoil > 0) ? 'vert' : 'rouge';
            $station->essence_disponible = $stockEssence > 0;
            $station->gasoil_disponible = $stockGasoil > 0;
            $station->stock_essence = $stockEssence;
            $station->stock_gasoil = $stockGasoil;
        }

        return response()->json([
            'stations' => $stations,
            'count' => $stations->count()
        ]);
    }

    // 6. Voir le détail d'une station
    public function detailStation($id_station)
    {
        $station = Station::with(['stocks', 'gerant.user'])
            ->findOrFail($id_station);

        $stockEssence = $station->stocks->where('type_carburant', 'essence')->first();
        $stockGasoil = $station->stocks->where('type_carburant', 'gasoil')->first();

        $station->prix_essence = 750;
        $station->prix_gasoil = 700;
        $station->stock_essence = $stockEssence ? $stockEssence->quantite : 0;
        $station->stock_gasoil = $stockGasoil ? $stockGasoil->quantite : 0;

        return response()->json([
            'station' => $station
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES RÉSERVATIONS
    // ==============================================

    // 7. Réserver du carburant
    public function reserver(Request $request)
    {
        $request->validate([
            'id_consommateur' => 'required|exists:consommateurs,id_consommateur',
            'id_station' => 'required|exists:stations,id_station',
            'quantite' => 'required|numeric|min:1',
            'type_carburant' => 'required|in:essence,gasoil'
        ]);

        // Vérifier le stock
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if (!$stock || $stock->quantite < $request->quantite) {
            return response()->json([
                'message' => 'Stock insuffisant dans cette station',
                'stock_disponible' => $stock ? $stock->quantite : 0
            ], 400);
        }

        // Calculer le montant
        $prix = $request->type_carburant === 'essence' ? 750 : 700;
        $montant = $prix * $request->quantite;

        // Générer un code de retrait unique
        $codeRetrait = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Créer la réservation
        $reservation = Reservation::create([
            'id_consommateur' => $request->id_consommateur,
            'id_station' => $request->id_station,
            'type_carburant' => $request->type_carburant,
            'quantite' => $request->quantite,
            'montant' => $montant,
            'date_reservation' => now(),
            'date_retrait' => $request->date_retrait ?? now()->addDay(),
            'statut' => 'en_attente',
            'code_retrait' => $codeRetrait
        ]);

        return response()->json([
            'message' => 'Réservation effectuée avec succès',
            'reservation' => $reservation,
            'code_retrait' => $codeRetrait
        ], 201);
    }

    // 8. Payer une réservation
    public function payer(Request $request)
    {
        $request->validate([
            'id_reservation' => 'required|exists:reservations,id_reservation',
            'mode_paiement' => 'required|in:orange_money,mobicash,wave,carte'
        ]);

        $reservation = Reservation::with('station')->findOrFail($request->id_reservation);

        if ($reservation->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Cette réservation ne peut plus être payée'
            ], 400);
        }

        if ($reservation->paiement) {
            return response()->json([
                'message' => 'Cette réservation est déjà payée'
            ], 400);
        }

        // Créer le paiement
        $paiement = Paiement::create([
            'id_reservation' => $reservation->id_reservation,
            'montant' => $reservation->montant,
            'mode_paiement' => $request->mode_paiement,
            'date_paiement' => now(),
            'statut' => 'paye',
            'reference_transaction' => 'TRX_' . time() . '_' . uniqid()
        ]);

        // Mettre à jour la réservation
        $reservation->statut = 'confirmee';
        $reservation->save();

        return response()->json([
            'message' => 'Paiement effectué avec succès',
            'paiement' => $paiement,
            'code_retrait' => $reservation->code_retrait
        ]);
    }

    // 9. Voir mes réservations
    public function mesReservations($id_consommateur)
    {
        $reservations = Reservation::with(['station', 'paiement'])
            ->where('id_consommateur', $id_consommateur)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'reservations' => $reservations,
            'count' => $reservations->count()
        ]);
    }

    // 10. Annuler une réservation
    public function annulerReservation($id_reservation)
    {
        $reservation = Reservation::findOrFail($id_reservation);

        if ($reservation->statut === 'annulee') {
            return response()->json([
                'message' => 'Cette réservation est déjà annulée'
            ], 400);
        }

        if ($reservation->statut === 'terminee') {
            return response()->json([
                'message' => 'Une réservation terminée ne peut pas être annulée'
            ], 400);
        }

        $reservation->statut = 'annulee';
        $reservation->save();

        return response()->json([
            'message' => 'Réservation annulée avec succès'
        ]);
    }

    // 11. Voir le détail d'une réservation
    public function detailReservation($id_reservation)
    {
        $reservation = Reservation::with(['station', 'paiement', 'consommateur.user'])
            ->findOrFail($id_reservation);

        return response()->json([
            'reservation' => $reservation
        ]);
    }

    // ==============================================
    // 🔹 SIGNALEMENTS
    // ==============================================

    // 12. Signaler un problème (au gérant)
    public function signalerProbleme(Request $request)
    {
        $request->validate([
            'id_consommateur' => 'required|exists:consommateurs,id_consommateur',
            'id_station' => 'required|exists:stations,id_station',
            'message' => 'required|string|min:5'
        ]);

        $station = Station::with('gerant.user')->findOrFail($request->id_station);

        if (!$station->gerant || !$station->gerant->user) {
            return response()->json([
                'message' => 'Station non associée à un gérant'
            ], 400);
        }

        $destinataire = $station->gerant->user;

        $alerte = Alerte::create([
            'type' => 'probleme_consommateur',
            'message' => $request->message,
            'date_creation' => now(),
            'statut' => 'non_lue',
            'id_destinataire' => $destinataire->id_utilisateur,
            'id_consommateur' => $request->id_consommateur,
            'id_station' => $request->id_station
        ]);

        return response()->json([
            'message' => 'Problème signalé au gérant avec succès',
            'alerte' => $alerte
        ], 201);
    }

    // ==============================================
    // 🔹 PROFIL
    // ==============================================

    // 13. Voir le profil
    public function profil($id_consommateur)
    {
        $consommateur = Consommateur::with('user')
            ->findOrFail($id_consommateur);

        return response()->json([
            'consommateur' => $consommateur
        ]);
    }

    // 14. Modifier le profil
    public function updateProfil(Request $request, $id_consommateur)
    {
        $consommateur = Consommateur::findOrFail($id_consommateur);
        $user = $consommateur->user;

        $request->validate([
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur'
        ]);

        if ($request->has('nom')) {
            $user->nom = $request->nom;
        }
        if ($request->has('prenom')) {
            $user->prenom = $request->prenom;
        }
        if ($request->has('telephone')) {
            $user->telephone = $request->telephone;
        }
        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'consommateur' => $consommateur->fresh('user')
        ]);
    }
}