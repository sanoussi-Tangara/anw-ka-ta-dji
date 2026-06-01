<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Stock;
use App\Models\Vente;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    /**
     * Simuler un paiement (Orange Money, Mobicash, Wave, Carte, Espèces)
     */
    public function simuler(Request $request)
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

        // Vérifier que la réservation n'est pas déjà payée
        if ($reservation->statut !== 'en_attente') {
            return response()->json(['message' => 'Réservation déjà traitée'], 400);
        }

        // Vérifier et recalculer le montant si nécessaire
        if (!$reservation->montant_total || $reservation->montant_total <= 0) {
            $manager = User::where('role', 'manager')->first();
            $prix = $reservation->type_carburant === 'essence' 
                ? ($manager->prix_essence ?? 750) 
                : ($manager->prix_gasoil ?? 700);
            $reservation->montant_total = $reservation->quantite * $prix;
            $reservation->save();
        }

        // Simulation (95% succès)
        $success = rand(1, 100) <= 95;

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Paiement échoué. Veuillez réessayer.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Générer référence de transaction
            $reference = $this->genererReference($request->mode_paiement);

            // CRÉER LE PAIEMENT
            $paiement = Paiement::create([
                'id_reservation' => $reservation->id_reservation,
                'montant' => $reservation->montant_total,
                'mode_paiement' => $request->mode_paiement,
                'date_paiement' => now(),
                'statut' => 'paye',
                'reference_transaction' => $reference
            ]);

            // Mettre à jour la réservation
            $reservation->statut = 'payee';
            $reservation->save();

            // DIMINUER LE STOCK
            $stock = Stock::where('id_station', $reservation->id_station)
                ->where('type_carburant', $reservation->type_carburant)
                ->first();

            if ($stock) {
                $stock->quantite -= $reservation->quantite;
                $stock->save();
            }

            // ✅ CRÉER UNE VENTE AUTOMATIQUEMENT
           // CRÉER UNE VENTE AUTOMATIQUEMENT (sans id_pompiste)
// CRÉER UNE VENTE AUTOMATIQUEMENT
$vente = Vente::create([
    'id_station' => $reservation->id_station,
    'id_pompiste' => auth()->id(), // Ou l'ID du pompiste connecté
    'type_carburant' => $reservation->type_carburant,
    'quantite' => $reservation->quantite,
    'montant' => $reservation->montant_total,
    'montant_total' => $reservation->montant_total,
    'mode_paiement' => $request->mode_paiement,
    'prix_unitaire' => $reservation->montant_total / $reservation->quantite,
    'date_vente' => now(),
    'periode' => $this->getPeriode()
]);

            // NOTIFICATION AU CONSOMMATEUR
            $station = $reservation->station;
            Notification::create([
                'type' => 'paiement',
                'titre' => '✅ Paiement accepté',
                'message' => "Votre paiement de {$paiement->montant} FCFA a été accepté. Rendez-vous à la station {$station->nom}.",
                'id_destinataire' => $user->id_utilisateur,
                'date_envoi' => now(),
                'lu' => false
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paiement effectué avec succès',
                'paiement' => $paiement,
                'reservation' => $reservation,
                'vente' => $vente,
                'transaction_id' => $reference
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Vérifier le statut d'un paiement
     */
    public function verifier($id_reservation)
    {
        $paiement = Paiement::where('id_reservation', $id_reservation)->first();
        
        if (!$paiement) {
            return response()->json([
                'paye' => false,
                'message' => 'Aucun paiement trouvé'
            ]);
        }

        return response()->json([
            'paye' => $paiement->statut === 'paye',
            'montant' => $paiement->montant,
            'mode_paiement' => $paiement->mode_paiement,
            'date_paiement' => $paiement->date_paiement,
            'reference' => $paiement->reference_transaction
        ]);
    }

    /**
     * Lister tous les paiements (admin)
     */
    public function index()
    {
        $paiements = Paiement::with(['reservation.consommateur.user', 'reservation.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'paiements' => $paiements,
            'count' => $paiements->count()
        ]);
    }

    /**
     * Voir le détail d'un paiement
     */
    public function show($id_paiement)
    {
        $paiement = Paiement::with(['reservation.consommateur.user', 'reservation.station'])
            ->findOrFail($id_paiement);

        return response()->json(['paiement' => $paiement]);
    }

    /**
     * Paiements par réservation
     */
    public function getByReservation($id_reservation)
    {
        $paiements = Paiement::where('id_reservation', $id_reservation)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'reservation_id' => $id_reservation,
            'paiements' => $paiements,
            'count' => $paiements->count()
        ]);
    }

    /**
     * Paiements par consommateur
     */
    public function getByConsommateur($id_consommateur)
    {
        $paiements = Paiement::whereHas('reservation', function($q) use ($id_consommateur) {
            $q->where('id_consommateur', $id_consommateur);
        })->with(['reservation.station'])->orderBy('created_at', 'desc')->get();

        return response()->json([
            'paiements' => $paiements,
            'count' => $paiements->count(),
            'total_depense' => $paiements->sum('montant')
        ]);
    }

    /**
     * Statistiques des paiements
     */
    public function statistiques()
    {
        $stats = [
            'total' => Paiement::count(),
            'total_montant' => Paiement::sum('montant'),
            'payes' => [
                'count' => Paiement::where('statut', 'paye')->count(),
                'montant' => Paiement::where('statut', 'paye')->sum('montant')
            ],
            'echoues' => [
                'count' => Paiement::where('statut', 'echoue')->count(),
                'montant' => Paiement::where('statut', 'echoue')->sum('montant')
            ]
        ];

        // Par mode de paiement
        $modes = ['orange_money', 'mobicash', 'wave', 'card', 'especes'];
        foreach ($modes as $mode) {
            $stats['par_mode'][$mode] = [
                'count' => Paiement::where('mode_paiement', $mode)->count(),
                'montant' => Paiement::where('mode_paiement', $mode)->sum('montant')
            ];
        }

        return response()->json($stats);
    }

    /**
     * Générer une référence de transaction unique
     */
    private function genererReference($mode)
    {
        $prefix = match($mode) {
            'orange_money' => 'OM',
            'mobicash' => 'MC',
            'wave' => 'WV',
            'card' => 'CD',
            'especes' => 'CS',
            default => 'PM'
        };
        
        return $prefix . '_' . date('Ymd') . '_' . strtoupper(uniqid());
    }

    /**
     * Déterminer la période de la vente
     */
    private function getPeriode()
    {
        $heure = now()->hour;
        return match(true) {
            $heure >= 6 && $heure < 12 => '6h-12h',
            $heure >= 12 && $heure < 18 => '12h-18h',
            $heure >= 18 && $heure < 24 => '18h-00h',
            default => '00h-6h'
        };
    }
}