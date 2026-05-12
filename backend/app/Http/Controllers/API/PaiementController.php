<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Consommateur;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES PAIEMENTS
    // ==============================================

    // 1. Lister tous les paiements
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

    // 2. Voir le détail d'un paiement
    public function show($id_paiement)
    {
        $paiement = Paiement::with([
            'reservation.consommateur.user',
            'reservation.station'
        ])->findOrFail($id_paiement);

        return response()->json([
            'paiement' => $paiement
        ]);
    }

    // 3. Paiements par réservation
    public function getByReservation($id_reservation)
    {
        $reservation = Reservation::findOrFail($id_reservation);
        
        $paiements = Paiement::where('id_reservation', $id_reservation)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'reservation' => $reservation->id_reservation,
            'paiements' => $paiements,
            'count' => $paiements->count()
        ]);
    }

    // 4. Paiements par consommateur
    public function getByConsommateur($id_consommateur)
    {
        $consommateur = Consommateur::findOrFail($id_consommateur);
        
        $paiements = Paiement::whereHas('reservation', function($q) use ($id_consommateur) {
            $q->where('id_consommateur', $id_consommateur);
        })->with(['reservation.station'])->orderBy('created_at', 'desc')->get();

        return response()->json([
            'consommateur' => $consommateur->user->nom_complet ?? $id_consommateur,
            'paiements' => $paiements,
            'count' => $paiements->count(),
            'total_depense' => $paiements->sum('montant')
        ]);
    }

    // 5. Paiements par mode de paiement
    public function getByMode($mode)
    {
        if (!in_array($mode, ['orange_money', 'mobicash', 'wave', 'carte'])) {
            return response()->json(['message' => 'Mode de paiement invalide'], 400);
        }

        $paiements = Paiement::where('mode_paiement', $mode)
            ->with(['reservation.consommateur.user', 'reservation.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'mode_paiement' => $mode,
            'paiements' => $paiements,
            'count' => $paiements->count(),
            'montant_total' => $paiements->sum('montant')
        ]);
    }

    // 6. Paiements par statut
    public function getByStatut($statut)
    {
        if (!in_array($statut, ['en_attente', 'paye', 'echoue'])) {
            return response()->json(['message' => 'Statut invalide'], 400);
        }

        $paiements = Paiement::where('statut', $statut)
            ->with(['reservation.consommateur.user', 'reservation.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'statut' => $statut,
            'paiements' => $paiements,
            'count' => $paiements->count()
        ]);
    }

    // 7. Paiements par date
    public function getByDate(Request $request)
    {
        $request->validate([
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut'
        ]);

        $query = Paiement::whereDate('date_paiement', '>=', $request->date_debut);
        
        if ($request->has('date_fin')) {
            $query->whereDate('date_paiement', '<=', $request->date_fin);
        } else {
            $query->whereDate('date_paiement', '<=', $request->date_debut);
        }

        $paiements = $query->with(['reservation.consommateur.user', 'reservation.station'])
            ->orderBy('date_paiement', 'desc')
            ->get();

        return response()->json([
            'periode' => [
                'debut' => $request->date_debut,
                'fin' => $request->date_fin ?? $request->date_debut
            ],
            'paiements' => $paiements,
            'count' => $paiements->count(),
            'montant_total' => $paiements->sum('montant')
        ]);
    }

    // ==============================================
    // 🔹 CRÉATION ET GESTION DES PAIEMENTS
    // ==============================================

    // 8. Créer un paiement pour une réservation
    public function store(Request $request)
    {
        $request->validate([
            'id_reservation' => 'required|exists:reservations,id_reservation',
            'mode_paiement' => 'required|in:orange_money,mobicash,wave,carte',
            'reference_transaction' => 'nullable|string|max:100'
        ]);

        $reservation = Reservation::findOrFail($request->id_reservation);

        // Vérifier que la réservation n'a pas déjà un paiement
        if ($reservation->paiement) {
            return response()->json([
                'message' => 'Cette réservation a déjà un paiement'
            ], 400);
        }

        // Vérifier que la réservation peut être payée
        if ($reservation->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Cette réservation ne peut pas être payée'
            ], 400);
        }

        $paiement = Paiement::create([
            'id_reservation' => $request->id_reservation,
            'montant' => $reservation->montant,
            'mode_paiement' => $request->mode_paiement,
            'date_paiement' => now(),
            'statut' => 'paye',
            'reference_transaction' => $request->reference_transaction ?? 'TRX_' . time() . '_' . uniqid()
        ]);

        // Mettre à jour le statut de la réservation
        $reservation->confirmerPaiement();

        return response()->json([
            'message' => 'Paiement effectué avec succès',
            'paiement' => $paiement->load('reservation'),
            'code_retrait' => $reservation->code_retrait
        ], 201);
    }

    // 9. Créer un paiement avec simulation (pour développement)
    public function storeSimulation(Request $request)
    {
        $request->validate([
            'id_reservation' => 'required|exists:reservations,id_reservation',
            'mode_paiement' => 'required|in:orange_money,mobicash,wave,carte',
            'simuler_succes' => 'boolean'
        ]);

        $reservation = Reservation::findOrFail($request->id_reservation);

        if ($reservation->paiement) {
            return response()->json([
                'message' => 'Cette réservation a déjà un paiement'
            ], 400);
        }

        $succes = $request->simuler_succes ?? true;

        if (!$succes) {
            // Paiement échoué
            $paiement = Paiement::create([
                'id_reservation' => $request->id_reservation,
                'montant' => $reservation->montant,
                'mode_paiement' => $request->mode_paiement,
                'date_paiement' => now(),
                'statut' => 'echoue',
                'reference_transaction' => 'FAIL_' . time() . '_' . uniqid()
            ]);

            return response()->json([
                'message' => 'Paiement échoué',
                'paiement' => $paiement
            ], 400);
        }

        // Paiement réussi
        $paiement = Paiement::create([
            'id_reservation' => $request->id_reservation,
            'montant' => $reservation->montant,
            'mode_paiement' => $request->mode_paiement,
            'date_paiement' => now(),
            'statut' => 'paye',
            'reference_transaction' => 'SIM_' . time() . '_' . uniqid()
        ]);

        $reservation->confirmerPaiement();

        return response()->json([
            'message' => 'Paiement effectué avec succès (simulation)',
            'paiement' => $paiement,
            'code_retrait' => $reservation->code_retrait
        ], 201);
    }

    // 10. Marquer un paiement comme échoué
    public function marquerEchoue($id_paiement)
    {
        $paiement = Paiement::findOrFail($id_paiement);

        if ($paiement->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Ce paiement ne peut pas être marqué comme échoué'
            ], 400);
        }

        $paiement->marquerEchoue();

        return response()->json([
            'message' => 'Paiement marqué comme échoué',
            'paiement' => $paiement
        ]);
    }

    // 11. Rembourser un paiement
    public function rembourser($id_paiement)
    {
        $paiement = Paiement::findOrFail($id_paiement);

        if ($paiement->statut !== 'paye') {
            return response()->json([
                'message' => 'Seul un paiement payé peut être remboursé'
            ], 400);
        }

        // Logique de remboursement à implémenter selon l'API de paiement
        // $this->processRemboursement($paiement);

        $paiement->statut = 'rembourse';
        $paiement->save();

        // Annuler la réservation liée
        $reservation = $paiement->reservation;
        $reservation->annuler();

        return response()->json([
            'message' => 'Paiement remboursé',
            'paiement' => $paiement,
            'reservation' => $reservation
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 12. Statistiques des paiements
    public function statistiques()
    {
        $stats = [
            'total' => Paiement::count(),
            'total_montant' => Paiement::sum('montant'),
            'payes' => [
                'count' => Paiement::where('statut', 'paye')->count(),
                'montant' => Paiement::where('statut', 'paye')->sum('montant')
            ],
            'en_attente' => [
                'count' => Paiement::where('statut', 'en_attente')->count(),
                'montant' => Paiement::where('statut', 'en_attente')->sum('montant')
            ],
            'echoues' => [
                'count' => Paiement::where('statut', 'echoue')->count(),
                'montant' => Paiement::where('statut', 'echoue')->sum('montant')
            ]
        ];

        // Par mode de paiement
        $modes = ['orange_money', 'mobicash', 'wave', 'carte'];
        foreach ($modes as $mode) {
            $stats['par_mode'][$mode] = [
                'count' => Paiement::where('mode_paiement', $mode)->count(),
                'montant' => Paiement::where('mode_paiement', $mode)->sum('montant')
            ];
        }

        return response()->json($stats);
    }

    // 13. Dashboard des paiements
    public function dashboard()
    {
        // Paiements du jour
        $aujourdHui = Paiement::whereDate('date_paiement', today())->get();
        
        // Paiements de la semaine
        $semaine = Paiement::whereBetween('date_paiement', [now()->startOfWeek(), now()->endOfWeek()])->get();
        
        // Paiements du mois
        $mois = Paiement::whereMonth('date_paiement', now()->month)->get();

        $derniersPaiements = Paiement::with(['reservation.consommateur.user', 'reservation.station'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'aujourd_hui' => [
                'count' => $aujourdHui->count(),
                'montant' => $aujourdHui->sum('montant')
            ],
            'semaine' => [
                'count' => $semaine->count(),
                'montant' => $semaine->sum('montant')
            ],
            'mois' => [
                'count' => $mois->count(),
                'montant' => $mois->sum('montant')
            ],
            'derniers_paiements' => $derniersPaiements
        ]);
    }

    // 14. Chiffre d'affaires par période
    public function caParPeriode(Request $request)
    {
        $request->validate([
            'periode' => 'required|in:jour,semaine,mois,annee'
        ]);

        $query = Paiement::where('statut', 'paye');
        
        switch ($request->periode) {
            case 'jour':
                $query->whereDate('date_paiement', today());
                $groupBy = 'heure';
                break;
            case 'semaine':
                $query->whereBetween('date_paiement', [now()->startOfWeek(), now()->endOfWeek()]);
                $groupBy = 'date';
                break;
            case 'mois':
                $query->whereMonth('date_paiement', now()->month);
                $groupBy = 'date';
                break;
            case 'annee':
                $query->whereYear('date_paiement', now()->year);
                $groupBy = 'mois';
                break;
        }

        $montantTotal = $query->sum('montant');
        $nombreTotal = $query->count();

        return response()->json([
            'periode' => $request->periode,
            'montant_total' => $montantTotal,
            'nombre_total' => $nombreTotal
        ]);
    }
}