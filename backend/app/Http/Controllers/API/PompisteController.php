<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Pompiste;
use App\Models\Reservation;
use App\Models\Vente;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PompisteController extends Controller
{
    // ========== PROFIL ==========
    
    public function profil(Request $request)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        
        $pompiste = Pompiste::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste) {
            return response()->json([
                'message' => 'Pompiste non trouvé',
                'debug' => [
                    'user_id' => $user->id_utilisateur,
                    'user_email' => $user->email
                ]
            ], 404);
        }
        
        $pompiste->load(['user', 'station']);
        
        if (!$pompiste->station) {
            return response()->json([
                'message' => 'Station non trouvée pour ce pompiste',
                'debug' => [
                    'pompiste_id' => $pompiste->id_pompiste,
                    'station_id' => $pompiste->id_station
                ]
            ], 404);
        }
        
        return response()->json([
            'pompiste' => $pompiste
        ]);
    }
    
    public function updateProfil(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|unique:users,telephone,' . $user->id_utilisateur
        ]);
        
        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();
        
        return response()->json(['message' => 'Profil mis à jour']);
    }
    
    // ========== VENTES ==========
    
    // Récupérer les prix fixés par le manager
    private function getPrixManager()
    {
        $manager = User::where('role', 'manager')->first();
        
        if (!$manager) {
            return ['essence' => 750, 'gasoil' => 700];
        }
        
        return [
            'essence' => $manager->prix_essence ?? 750,
            'gasoil' => $manager->prix_gasoil ?? 700,
            'derniere_mise_a_jour' => $manager->prix_updated_at
        ];
    }
    
    // Déterminer la période selon l'heure
    private function getPeriode($heure = null)
    {
        if ($heure === null) {
            $heure = now()->format('H');
        }
        
        if ($heure >= 6 && $heure < 14) {
            return '06h-14h';
        } elseif ($heure >= 14 && $heure < 22) {
            return '14h-22h';
        } else {
            return '22h-06h';
        }
    }
    
    // 1. Saisir une vente (avec authentification)
    public function saisirVente(Request $request)
    {
        $user = auth()->user();
        $pompiste = Pompiste::with('station')->where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste || !$pompiste->station) {
            return response()->json(['message' => 'Pompiste ou station non trouvé'], 404);
        }
        
        $request->validate([
            'quantite' => 'required|numeric|min:0.1',
            'type_carburant' => 'required|in:essence,gasoil',
            'mode_paiement' => 'required|in:especes,orange_money,mobicash,wave'
        ]);

        $prix = $this->getPrixManager();
        $prixUnitaire = $request->type_carburant === 'essence' ? $prix['essence'] : $prix['gasoil'];
        $montant = $request->quantite * $prixUnitaire;
        $dateVente = now();
        $periode = $this->getPeriode();

        $vente = Vente::create([
            'id_pompiste' => $pompiste->id_pompiste,
            'id_station' => $pompiste->station->id_station,
            'type_carburant' => $request->type_carburant,
            'quantite' => $request->quantite,
            'montant' => $montant,
            'montant_total' => $montant,
            'mode_paiement' => $request->mode_paiement,
            'prix_unitaire' => $prixUnitaire,
            'date_vente' => $dateVente,
            'periode' => $periode
        ]);

        $stock = Stock::where('id_station', $pompiste->station->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if ($stock) {
            $stock->quantite -= $request->quantite;
            $stock->date_mise_a_jour = now();
            $stock->save();
        }

        return response()->json([
            'message' => 'Vente enregistrée avec succès',
            'vente' => $vente,
            'prix_unitaire' => $prixUnitaire
        ], 201);
    }
    
    // 1b. Saisir une vente PUBLIC (sans authentification - pour test)
    public function saisirVentePublic(Request $request)
    {
        try {
            $request->validate([
                'pompiste_id' => 'required|exists:pompistes,id_pompiste',
                'station_id' => 'required|exists:stations,id_station',
                'type_carburant' => 'required|in:essence,gasoil',
                'quantite' => 'required|numeric|min:0.1',
                'montant' => 'required|numeric|min:0',
                'mode_paiement' => 'required|in:especes,orange_money,mobicash,wave'
            ]);

            $prix = $this->getPrixManager();
            $prixUnitaire = $request->type_carburant === 'essence' ? $prix['essence'] : $prix['gasoil'];

            $vente = Vente::create([
                'id_pompiste' => $request->pompiste_id,
                'id_station' => $request->station_id,
                'type_carburant' => $request->type_carburant,
                'quantite' => $request->quantite,
                'montant' => $request->montant,
                'montant_total' => $request->montant,
                'mode_paiement' => $request->mode_paiement,
                'prix_unitaire' => $prixUnitaire,
                'date_vente' => now(),
                'periode' => $this->getPeriode()
            ]);

            $stock = Stock::where('id_station', $request->station_id)
                ->where('type_carburant', $request->type_carburant)
                ->first();

            if ($stock) {
                $stock->quantite -= $request->quantite;
                $stock->date_mise_a_jour = now();
                $stock->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Vente enregistrée avec succès',
                'vente' => $vente,
                'prix_unitaire' => $prixUnitaire
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // 2. Récupérer les prix actuels
    public function getPrixActuels()
    {
        $prix = $this->getPrixManager();
        
        return response()->json([
            'essence' => $prix['essence'],
            'gasoil' => $prix['gasoil'],
            'derniere_mise_a_jour' => $prix['derniere_mise_a_jour']
        ]);
    }
    
    // 3. Historique des ventes
    public function historiqueVentes(Request $request)
    {
        $user = auth()->user();
        $pompiste = Pompiste::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste) {
            return response()->json(['ventes' => []]);
        }
        
        $ventes = Vente::where('id_pompiste', $pompiste->id_pompiste)
            ->orderBy('date_vente', 'desc')
            ->get();
        
        return response()->json([
            'ventes' => $ventes
        ]);
    }
    
    // 4. Ventes du jour
    public function ventesDuJour(Request $request)
    {
        $user = auth()->user();
        $pompiste = Pompiste::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste) {
            return response()->json(['ventes' => [], 'total' => 0]);
        }
        
        $ventes = Vente::where('id_pompiste', $pompiste->id_pompiste)
            ->whereDate('date_vente', today())
            ->get();
        
        return response()->json([
            'ventes' => $ventes,
            'total' => $ventes->sum('montant_total')
        ]);
    }
    
    // ========== STOCKS ==========
    
    public function voirStock(Request $request)
    {
        $user = auth()->user();
        $pompiste = Pompiste::with('station')->where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste || !$pompiste->station) {
            return response()->json([
                'stocks' => [],
                'message' => 'Aucune station associée'
            ]);
        }
        
        $stocks = Stock::where('id_station', $pompiste->station->id_station)->get();

        return response()->json([
            'stocks' => $stocks
        ]);
    }
    
    // ========== RÉSERVATIONS ==========
    
    public function voirReservations(Request $request)
    {
        $user = auth()->user();
        $pompiste = Pompiste::with('station')->where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste || !$pompiste->station) {
            return response()->json(['reservations' => []]);
        }
        
        $reservations = DB::table('reservations')
            ->leftJoin('consommateurs', 'reservations.id_consommateur', '=', 'consommateurs.id_consommateur')
            ->leftJoin('users', 'consommateurs.id_utilisateur', '=', 'users.id_utilisateur')
            ->where('reservations.id_station', $pompiste->station->id_station)
            ->whereIn('reservations.statut', ['en_attente', 'payee'])
            ->select(
                'reservations.id_reservation',
                'reservations.quantite',
                'reservations.type_carburant',
                'reservations.statut',
                'reservations.date_reservation',
                'reservations.date_retrait',
                'reservations.montant_total',
                'reservations.code_reservation',
                'users.nom as consommateur_nom',
                'users.prenom as consommateur_prenom',
                'users.telephone as consommateur_telephone',
                'users.email as consommateur_email'
            )
            ->orderBy('reservations.date_reservation', 'asc')
            ->get();
        
        $formattedReservations = $reservations->map(function($reservation) {
            return [
                'id_reservation' => $reservation->id_reservation,
                'quantite' => $reservation->quantite,
                'type_carburant' => $reservation->type_carburant,
                'statut' => $reservation->statut,
                'date_reservation' => $reservation->date_reservation,
                'date_retrait' => $reservation->date_retrait,
                'montant_total' => $reservation->montant_total,
                'code_reservation' => $reservation->code_reservation,
                'consommateur' => [
                    'nom' => $reservation->consommateur_nom,
                    'prenom' => $reservation->consommateur_prenom,
                    'telephone' => $reservation->consommateur_telephone,
                    'email' => $reservation->consommateur_email,
                ]
            ];
        });
        
        return response()->json([
            'reservations' => $formattedReservations
        ]);
    }
    
    public function marquerServie($id_reservation)
    {
        $reservation = Reservation::findOrFail($id_reservation);
        
        if ($reservation->statut !== 'payee') {
            return response()->json([
                'message' => 'Cette réservation doit être payée avant d\'être servie'
            ], 400);
        }
        
        $reservation->statut = 'servie';
        $reservation->date_retrait = now();
        $reservation->save();
        
        $pompiste = Pompiste::where('id_utilisateur', auth()->id())->first();
        
        if ($pompiste && $pompiste->station) {
            $prix = $this->getPrixManager();
            $prixUnitaire = $reservation->type_carburant === 'essence' ? $prix['essence'] : $prix['gasoil'];
            $periode = $this->getPeriode();
            
            Vente::create([
                'id_pompiste' => $pompiste->id_pompiste,
                'id_station' => $pompiste->station->id_station,
                'type_carburant' => $reservation->type_carburant,
                'quantite' => $reservation->quantite,
                'montant' => $reservation->montant_total,
                'montant_total' => $reservation->montant_total,
                'mode_paiement' => 'reservation',
                'prix_unitaire' => $prixUnitaire,
                'date_vente' => now(),
                'periode' => $periode
            ]);
            
            $stock = Stock::where('id_station', $pompiste->station->id_station)
                ->where('type_carburant', $reservation->type_carburant)
                ->first();
            
            if ($stock) {
                $stock->quantite -= $reservation->quantite;
                $stock->date_mise_a_jour = now();
                $stock->save();
            }
        }
        
        return response()->json([
            'message' => 'Réservation marquée comme servie avec succès',
            'reservation' => $reservation
        ]);
    }
    
    // ========== FIN DE JOURNÉE ==========
    
    public function clotureCaisse(Request $request)
    {
        $user = auth()->user();
        $pompiste = Pompiste::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste) {
            return response()->json(['message' => 'Pompiste non trouvé'], 404);
        }

        $date = $request->date ?? date('Y-m-d');

        $ventes = Vente::where('id_pompiste', $pompiste->id_pompiste)
            ->whereDate('date_vente', $date)
            ->get();

        $totalVentes = $ventes->sum('montant_total');
        $nombreVentes = $ventes->count();

        $parMode = [
            'especes' => $ventes->where('mode_paiement', 'especes')->sum('montant_total'),
            'orange_money' => $ventes->where('mode_paiement', 'orange_money')->sum('montant_total'),
            'mobicash' => $ventes->where('mode_paiement', 'mobicash')->sum('montant_total'),
            'wave' => $ventes->where('mode_paiement', 'wave')->sum('montant_total')
        ];

        return response()->json([
            'date' => $date,
            'id_pompiste' => $pompiste->id_pompiste,
            'nombre_ventes' => $nombreVentes,
            'total_ventes' => $totalVentes,
            'detail_par_mode' => $parMode
        ]);
    }
    
    // ========== SYNCHRONISATION HORS-LIGNE ==========
    
    public function synchroniserVentes(Request $request)
    {
        $request->validate([
            'ventes' => 'required|array',
            'ventes.*.type_carburant' => 'required|in:essence,gasoil',
            'ventes.*.quantite' => 'required|numeric|min:0.1',
            'ventes.*.mode_paiement' => 'required|in:especes,orange_money,mobicash,wave',
            'ventes.*.date_vente' => 'required|date'
        ]);
        
        $user = auth()->user();
        $pompiste = Pompiste::with('station')->where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$pompiste || !$pompiste->station) {
            return response()->json(['message' => 'Pompiste ou station non trouvé'], 404);
        }
        
        $prix = $this->getPrixManager();
        $ventesCrees = [];
        
        foreach ($request->ventes as $venteData) {
            $prixUnitaire = $venteData['type_carburant'] === 'essence' ? $prix['essence'] : $prix['gasoil'];
            $montant = $venteData['quantite'] * $prixUnitaire;
            $dateVente = new \DateTime($venteData['date_vente']);
            
            $heure = (int)$dateVente->format('H');
            if ($heure >= 6 && $heure < 14) {
                $periode = '06h-14h';
            } elseif ($heure >= 14 && $heure < 22) {
                $periode = '14h-22h';
            } else {
                $periode = '22h-06h';
            }
            
            $vente = Vente::create([
                'id_pompiste' => $pompiste->id_pompiste,
                'id_station' => $pompiste->station->id_station,
                'type_carburant' => $venteData['type_carburant'],
                'quantite' => $venteData['quantite'],
                'montant' => $montant,
                'montant_total' => $montant,
                'mode_paiement' => $venteData['mode_paiement'],
                'prix_unitaire' => $prixUnitaire,
                'date_vente' => $venteData['date_vente'],
                'periode' => $periode
            ]);
            
            $stock = Stock::where('id_station', $pompiste->station->id_station)
                ->where('type_carburant', $venteData['type_carburant'])
                ->first();
            
            if ($stock) {
                $stock->quantite -= $venteData['quantite'];
                $stock->date_mise_a_jour = now();
                $stock->save();
            }
            
            $ventesCrees[] = $vente;
        }
        
        return response()->json([
            'message' => count($ventesCrees) . ' ventes synchronisées',
            'ventes' => $ventesCrees
        ]);
    }
}