<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Vente;
use App\Models\Pompiste;
use App\Models\Station;
use App\Models\Stock;
use App\Models\Alerte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VenteController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES VENTES
    // ==============================================

    // 1. Lister toutes les ventes
    public function index()
    {
        $ventes = Vente::with(['pompiste.user', 'station'])
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'ventes' => $ventes,
            'count' => $ventes->count()
        ]);
    }

    // 2. Voir le détail d'une vente
    public function show($id_vente)
    {
        $vente = Vente::with(['pompiste.user', 'station'])->findOrFail($id_vente);

        // Ajouter les informations calculées
        $vente->prix_unitaire = $vente->prix_unitaire;
        $vente->type_carburant_texte = $vente->type_carburant_texte;
        $vente->type_carburant_icone = $vente->type_carburant_icone;
        $vente->periode_texte = $vente->periode_texte;

        return response()->json([
            'vente' => $vente
        ]);
    }

    // 3. Ventes par pompiste
    public function getByPompiste($id_pompiste)
    {
        $pompiste = Pompiste::findOrFail($id_pompiste);
        
        $ventes = Vente::where('id_pompiste', $id_pompiste)
            ->with(['station'])
            ->orderBy('date_vente', 'desc')
            ->get();

        $total = $ventes->sum('montant');
        $moyenne = $ventes->avg('montant');

        return response()->json([
            'pompiste' => $pompiste->user->nom_complet ?? $id_pompiste,
            'ventes' => $ventes,
            'count' => $ventes->count(),
            'total' => $total,
            'moyenne' => round($moyenne, 2)
        ]);
    }

    // 4. Ventes par station
    public function getByStation($id_station)
    {
        $station = Station::findOrFail($id_station);
        
        $ventes = Vente::where('id_station', $id_station)
            ->with(['pompiste.user'])
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'station' => $station->nom,
            'ventes' => $ventes,
            'count' => $ventes->count(),
            'montant_total' => $ventes->sum('montant')
        ]);
    }

    // 5. Ventes par type de carburant
    public function getByType($type_carburant)
    {
        if (!in_array($type_carburant, ['essence', 'gasoil'])) {
            return response()->json(['message' => 'Type invalide'], 400);
        }

        $ventes = Vente::where('type_carburant', $type_carburant)
            ->with(['pompiste.user', 'station'])
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'type_carburant' => $type_carburant,
            'ventes' => $ventes,
            'count' => $ventes->count(),
            'montant_total' => $ventes->sum('montant'),
            'quantite_total' => $ventes->sum('quantite')
        ]);
    }

    // 6. Ventes par période
    public function getByPeriode($periode)
    {
        if (!in_array($periode, ['6h-12h', '12h-18h', '18h-00h', '00h-6h', null])) {
            return response()->json(['message' => 'Période invalide'], 400);
        }

        $ventes = Vente::where('periode', $periode)
            ->with(['pompiste.user', 'station'])
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'periode' => $periode,
            'ventes' => $ventes,
            'count' => $ventes->count()
        ]);
    }

    // 7. Ventes par date
    public function getByDate(Request $request)
    {
        $request->validate([
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut'
        ]);

        $query = Vente::whereDate('date_vente', '>=', $request->date_debut);
        
        if ($request->has('date_fin')) {
            $query->whereDate('date_vente', '<=', $request->date_fin);
        }

        $ventes = $query->with(['pompiste.user', 'station'])
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'periode' => [
                'debut' => $request->date_debut,
                'fin' => $request->date_fin ?? $request->date_debut
            ],
            'ventes' => $ventes,
            'count' => $ventes->count(),
            'montant_total' => $ventes->sum('montant'),
            'quantite_total' => $ventes->sum('quantite')
        ]);
    }

    // 8. Ventes du jour
    public function ventesAujourdHui()
    {
        $ventes = Vente::whereDate('date_vente', today())
            ->with(['pompiste.user', 'station'])
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'date' => today()->format('Y-m-d'),
            'ventes' => $ventes,
            'count' => $ventes->count(),
            'montant_total' => $ventes->sum('montant'),
            'quantite_total' => $ventes->sum('quantite')
        ]);
    }

    // ==============================================
    // 🔹 CRÉATION ET GESTION DES VENTES
    // ==============================================

    // 9. Créer une vente
    public function store(Request $request)
    {
        $request->validate([
            'id_pompiste' => 'required|exists:pompistes,id_pompiste',
            'id_station' => 'required|exists:stations,id_station',
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite' => 'required|numeric|min:0.1'
        ]);

        // Vérifier le stock
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if (!$stock || $stock->quantite < $request->quantite) {
            return response()->json([
                'message' => 'Stock insuffisant',
                'stock_disponible' => $stock ? $stock->quantite : 0
            ], 400);
        }

        // Créer la vente
        $vente = Vente::creerVente(
            $request->id_pompiste,
            $request->id_station,
            $request->type_carburant,
            $request->quantite
        );

        // Mettre à jour le stock
        $vente->mettreAJourStock();

        return response()->json([
            'message' => 'Vente enregistrée avec succès',
            'vente' => $vente->load(['pompiste.user', 'station'])
        ], 201);
    }

    // 10. Créer une vente avec mode de paiement
    public function storeWithPayment(Request $request)
    {
        $request->validate([
            'id_pompiste' => 'required|exists:pompistes,id_pompiste',
            'id_station' => 'required|exists:stations,id_station',
            'type_carburant' => 'required|in:essence,gasoil',
            'quantite' => 'required|numeric|min:0.1',
            'mode_paiement' => 'required|in:especes,orange_money,mobicash,wave'
        ]);

        // Vérifier le stock
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if (!$stock || $stock->quantite < $request->quantite) {
            return response()->json([
                'message' => 'Stock insuffisant',
                'stock_disponible' => $stock ? $stock->quantite : 0
            ], 400);
        }

        // Calculer le montant
        $prix = $request->type_carburant === 'essence' ? 750 : 700;
        $montant = $request->quantite * $prix;

        // Déterminer la période
        $heure = now()->hour;
        $periode = match(true) {
            $heure >= 6 && $heure < 12 => '6h-12h',
            $heure >= 12 && $heure < 18 => '12h-18h',
            $heure >= 18 && $heure < 24 => '18h-00h',
            default => '00h-6h'
        };

        // Créer la vente
        $vente = Vente::create([
            'id_pompiste' => $request->id_pompiste,
            'id_station' => $request->id_station,
            'type_carburant' => $request->type_carburant,
            'quantite' => $request->quantite,
            'montant' => $montant,
            'date_vente' => now(),
            'periode' => $periode
        ]);

        // Mettre à jour le stock
        $stock->quantite -= $request->quantite;
        $stock->date_mise_a_jour = now();
        $stock->save();

        // Vérifier alerte stock faible
        if ($stock->quantite <= $stock->seuil_alerte) {
            $this->declencherAlerteStock($stock, $vente);
        }

        return response()->json([
            'message' => 'Vente enregistrée avec succès',
            'vente' => $vente->load(['pompiste.user', 'station'])
        ], 201);
    }

    // 11. Créer plusieurs ventes (batch)
    public function storeBatch(Request $request)
    {
        $request->validate([
            'ventes' => 'required|array',
            'ventes.*.id_pompiste' => 'required|exists:pompistes,id_pompiste',
            'ventes.*.id_station' => 'required|exists:stations,id_station',
            'ventes.*.type_carburant' => 'required|in:essence,gasoil',
            'ventes.*.quantite' => 'required|numeric|min:0.1'
        ]);

        $results = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($request->ventes as $data) {
                // Vérifier le stock
                $stock = Stock::where('id_station', $data['id_station'])
                    ->where('type_carburant', $data['type_carburant'])
                    ->first();

                if (!$stock || $stock->quantite < $data['quantite']) {
                    $errors[] = [
                        'vente' => $data,
                        'message' => 'Stock insuffisant'
                    ];
                    continue;
                }

                // Créer la vente
                $vente = Vente::creerVente(
                    $data['id_pompiste'],
                    $data['id_station'],
                    $data['type_carburant'],
                    $data['quantite']
                );

                $vente->mettreAJourStock();
                $results[] = $vente;
            }

            DB::commit();

            return response()->json([
                'message' => count($errors) > 0 ? 'Ventes partiellement enregistrées' : 'Toutes les ventes enregistrées',
                'results' => $results,
                'errors' => $errors,
                'success_count' => count($results),
                'error_count' => count($errors)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'enregistrement'], 500);
        }
    }

    // 12. Annuler une vente
    public function annuler($id_vente)
    {
        $vente = Vente::findOrFail($id_vente);

        // Restaurer le stock
        $stock = Stock::where('id_station', $vente->id_station)
            ->where('type_carburant', $vente->type_carburant)
            ->first();

        if ($stock) {
            $stock->quantite += $vente->quantite;
            $stock->date_mise_a_jour = now();
            $stock->save();
        }

        $vente->delete();

        return response()->json([
            'message' => 'Vente annulée avec succès',
            'stock_restaure' => $stock ? $stock->quantite : null
        ]);
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 13. Statistiques globales des ventes
    public function statistiques()
    {
        $stats = [
            'total_ventes' => Vente::count(),
            'montant_total' => Vente::sum('montant'),
            'quantite_total' => Vente::sum('quantite'),
            'moyenne_vente' => round(Vente::avg('montant'), 2),
            'par_type' => [
                'essence' => [
                    'ventes' => Vente::where('type_carburant', 'essence')->count(),
                    'montant' => Vente::where('type_carburant', 'essence')->sum('montant'),
                    'quantite' => Vente::where('type_carburant', 'essence')->sum('quantite')
                ],
                'gasoil' => [
                    'ventes' => Vente::where('type_carburant', 'gasoil')->count(),
                    'montant' => Vente::where('type_carburant', 'gasoil')->sum('montant'),
                    'quantite' => Vente::where('type_carburant', 'gasoil')->sum('quantite')
                ]
            ]
        ];

        return response()->json($stats);
    }

    // 14. Dashboard des ventes
    public function dashboard()
    {
        // Ventes du jour
        $ventesAujourdHui = Vente::whereDate('date_vente', today())->get();
        
        // Ventes de la semaine
        $ventesSemaine = Vente::whereBetween('date_vente', [now()->startOfWeek(), now()->endOfWeek()])->get();
        
        // Ventes du mois
        $ventesMois = Vente::whereMonth('date_vente', now()->month)->get();

        // Top stations
        $topStations = Vente::select('id_station', DB::raw('sum(montant) as total'))
            ->groupBy('id_station')
            ->with('station')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        // Top pompistes
        $topPompistes = Vente::select('id_pompiste', DB::raw('sum(montant) as total'))
            ->groupBy('id_pompiste')
            ->with('pompiste.user')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'aujourd_hui' => [
                'ventes' => $ventesAujourdHui->count(),
                'montant' => $ventesAujourdHui->sum('montant'),
                'quantite' => $ventesAujourdHui->sum('quantite')
            ],
            'semaine' => [
                'ventes' => $ventesSemaine->count(),
                'montant' => $ventesSemaine->sum('montant'),
                'quantite' => $ventesSemaine->sum('quantite')
            ],
            'mois' => [
                'ventes' => $ventesMois->count(),
                'montant' => $ventesMois->sum('montant'),
                'quantite' => $ventesMois->sum('quantite')
            ],
            'top_stations' => $topStations,
            'top_pompistes' => $topPompistes
        ]);
    }

    // 15. Chiffre d'affaires par période
    public function caParPeriode(Request $request)
    {
        $request->validate([
            'periode' => 'required|in:jour,semaine,mois,annee'
        ]);

        $query = Vente::query();
        
        switch ($request->periode) {
            case 'jour':
                $query->whereDate('date_vente', today());
                break;
            case 'semaine':
                $query->whereBetween('date_vente', [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'mois':
                $query->whereMonth('date_vente', now()->month);
                break;
            case 'annee':
                $query->whereYear('date_vente', now()->year);
                break;
        }

        $montantTotal = $query->sum('montant');
        $quantiteTotal = $query->sum('quantite');
        $nombreVentes = $query->count();

        return response()->json([
            'periode' => $request->periode,
            'montant_total' => $montantTotal,
            'quantite_total' => $quantiteTotal,
            'nombre_ventes' => $nombreVentes,
            'prix_moyen' => $nombreVentes > 0 ? round($montantTotal / $nombreVentes, 2) : 0
        ]);
    }

    // ==============================================
    // 🔹 EXPORTATION
    // ==============================================

    // 16. Exporter les ventes (CSV)
    public function export(Request $request)
    {
        $query = Vente::with(['pompiste.user', 'station']);

        if ($request->has('date_debut')) {
            $query->whereDate('date_vente', '>=', $request->date_debut);
        }
        if ($request->has('date_fin')) {
            $query->whereDate('date_vente', '<=', $request->date_fin);
        }

        $ventes = $query->get();

        $csvData = [];
        $csvData[] = ['ID', 'Date', 'Station', 'Pompiste', 'Type', 'Quantité (L)', 'Montant (FCFA)', 'Période'];

        foreach ($ventes as $vente) {
            $csvData[] = [
                $vente->id_vente,
                $vente->date_vente->format('d/m/Y H:i'),
                $vente->station->nom,
                $vente->pompiste->user->nom_complet,
                $vente->type_carburant_texte,
                $vente->quantite,
                $vente->montant,
                $vente->periode_texte
            ];
        }

        // Génération du CSV
        $filename = 'ventes_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'w+');
        
        foreach ($csvData as $row) {
            fputcsv($handle, $row);
        }
        
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    // ==============================================
    // 🔹 FONCTIONS PRIVÉES
    // ==============================================

    private function declencherAlerteStock($stock, $vente)
    {
        $station = $vente->station;
        $gerant = $station->gerant ?? null;
        
        if ($gerant && $gerant->user) {
            Alerte::create([
                'type' => 'stock_faible',
                'message' => "Stock faible à {$station->nom} : plus que {$stock->quantite} litres de {$stock->type_carburant}",
                'date_creation' => now(),
                'statut' => 'non_lue',
                'id_destinataire' => $gerant->user->id_utilisateur
            ]);
        }
    }
}