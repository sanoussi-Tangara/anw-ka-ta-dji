<?php

namespace App\Http\Controllers;

use App\Models\Manager;
use App\Models\Fournisseur;
use App\Models\Icr;
use App\Models\Depot;
use App\Models\Bon;
use App\Models\PrixCarburant;
use App\Models\DepotResponsable;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ManagerController extends Controller
{
    /**
     * Constructeur - Vérifier que l'utilisateur est un manager
     */
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:manager');
    }

    // ==================== GESTION DES FOURNISSEURS ====================
    
    public function createFournisseur(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_societe' => 'required|string|max:100|unique:fournisseurs,nom_societe',
            'adresse' => 'nullable|string|max:200',
            'nif' => 'nullable|string|max:50|unique:fournisseurs,nif',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'telephone' => 'nullable|string|max:20',
            'contact_nom' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $user = User::create([
                'id_utilisateur' => (string) \Illuminate\Support\Str::uuid(),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'fournisseur',
                'telephone' => $request->telephone,
                'nom' => $request->contact_nom
            ]);
            
            $fournisseur = Fournisseur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'nom_societe' => $request->nom_societe,
                'adresse' => $request->adresse,
                'nif' => $request->nif,
                'statut' => 'actif'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $fournisseur->load('utilisateur'),
                'message' => 'Fournisseur créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function updateFournisseur(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom_societe' => 'sometimes|string|max:100',
            'adresse' => 'nullable|string|max:200',
            'nif' => 'sometimes|string|max:50',
            'telephone' => 'nullable|string|max:20',
            'contact_nom' => 'nullable|string|max:100',
            'statut' => 'sometimes|in:actif,inactif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $fournisseur = Fournisseur::findOrFail($id);
            $fournisseur->update($request->only(['nom_societe', 'adresse', 'nif', 'statut']));
            
            if ($request->has('telephone') || $request->has('contact_nom')) {
                $fournisseur->utilisateur()->update([
                    'telephone' => $request->telephone,
                    'nom' => $request->contact_nom
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $fournisseur->load('utilisateur'),
                'message' => 'Fournisseur modifié avec succès'
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function disableFournisseur($id)
    {
        try {
            $fournisseur = Fournisseur::findOrFail($id);
            $fournisseur->update(['statut' => 'inactif']);
            $fournisseur->utilisateur()->update(['active' => false]);
            
            return response()->json([
                'success' => true,
                'message' => 'Fournisseur désactivé avec succès'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la désactivation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function listFournisseurs(Request $request)
    {
        try {
            $query = Fournisseur::with('utilisateur');
            
            if ($request->has('statut')) {
                $query->where('statut', $request->statut);
            }
            if ($request->has('search')) {
                $query->where('nom_societe', 'LIKE', "%{$request->search}%");
            }
            
            $fournisseurs = $query->orderBy('created_at', 'desc')
                                 ->paginate($request->get('per_page', 15));
            
            return response()->json([
                'success' => true,
                'data' => $fournisseurs,
                'message' => 'Liste des fournisseurs récupérée'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== GESTION DES ICR ====================
    
    public function createICR(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:icr,email|unique:users,email',
            'telephone' => 'required|string|max:20',
            'matricule' => 'required|string|max:50|unique:icr,matricule',
            'password' => 'required|string|min:8'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $user = User::create([
                'id_utilisateur' => (string) \Illuminate\Support\Str::uuid(),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'icr',
                'telephone' => $request->telephone,
                'nom' => $request->nom,
                'prenom' => $request->prenom
            ]);
            
            $icr = Icr::create([
                'id_utilisateur' => $user->id_utilisateur,
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'telephone' => $request->telephone,
                'matricule' => $request->matricule,
                'statut' => 'actif'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $icr,
                'message' => 'ICR créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function listICR(Request $request)
    {
        try {
            $query = Icr::query();
            
            if ($request->has('statut')) {
                $query->where('statut', $request->statut);
            }
            if ($request->has('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('nom', 'LIKE', "%{$request->search}%")
                      ->orWhere('prenom', 'LIKE', "%{$request->search}%")
                      ->orWhere('matricule', 'LIKE', "%{$request->search}%");
                });
            }
            
            $icrs = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('per_page', 15));
            
            return response()->json([
                'success' => true,
                'data' => $icrs,
                'message' => 'Liste des ICR récupérée'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function disableICR($id)
    {
        try {
            $icr = Icr::findOrFail($id);
            $icr->update(['statut' => 'inactif']);
            $icr->utilisateur()->update(['active' => false]);
            
            return response()->json([
                'success' => true,
                'message' => 'ICR désactivé avec succès'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de désactivation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== GESTION DES RESPONSABLES DE DÉPÔT ====================
    
    public function createResponsableDepot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|max:20',
            'id_depot' => 'required|exists:depots,id_depot',
            'password' => 'required|string|min:8'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $user = User::create([
                'id_utilisateur' => (string) \Illuminate\Support\Str::uuid(),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'responsable_depot',
                'telephone' => $request->telephone,
                'nom' => $request->nom,
                'prenom' => $request->prenom
            ]);
            
            $responsable = DepotResponsable::create([
                'id_utilisateur' => $user->id_utilisateur,
                'id_depot' => $request->id_depot,
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'telephone' => $request->telephone,
                'statut' => 'actif'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $responsable->load('depot'),
                'message' => 'Responsable de dépôt créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function listResponsablesDepot(Request $request)
    {
        try {
            $query = DepotResponsable::with('depot');
            
            if ($request->has('id_depot')) {
                $query->where('id_depot', $request->id_depot);
            }
            
            $responsables = $query->orderBy('created_at', 'desc')
                                 ->paginate($request->get('per_page', 15));
            
            return response()->json([
                'success' => true,
                'data' => $responsables,
                'message' => 'Liste des responsables récupérée'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== TABLEAU DE BORD ====================
    
    public function dashboard(Request $request)
    {
        try {
            $stats = [
                'totaux' => [
                    'fournisseurs_actifs' => Fournisseur::where('statut', 'actif')->count(),
                    'icr_actifs' => Icr::where('statut', 'actif')->count(),
                    'depots' => Depot::count(),
                    'bons_mois' => Bon::whereMonth('date_creation', Carbon::now()->month)->count(),
                    'bons_en_cours' => Bon::where('statut', 'en_cours')->count(),
                    'livraisons_terminees' => Bon::where('statut', 'termine')->count(),
                ],
                'stocks' => $this->getStocksDepots(),
                'livraisons_recentes' => $this->getRecentLivraisons(),
                'alertes' => $this->getAlertes()
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Tableau de bord récupéré'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur chargement tableau de bord',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function stocksDepots()
    {
        try {
            $stocks = Depot::all()->map(function($depot) {
                return [
                    'depot' => $depot->nom_depot,
                    'ville' => $depot->ville,
                    'stock_essence' => $depot->stock_essence ?? 0,
                    'stock_gasoil' => $depot->stock_gasoil ?? 0,
                    'statut_stock' => $this->getStockStatus($depot)
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $stocks,
                'message' => 'Stocks en temps réel'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération stocks',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function suiviLivraisons(Request $request)
    {
        try {
            $livraisons = Bon::with(['fournisseur', 'depot', 'icr'])
                ->whereIn('statut', ['en_cours', 'signe'])
                ->whereDate('date_creation', '>=', Carbon::now()->subDays(7))
                ->get()
                ->map(function($bon) {
                    return [
                        'id_bon' => $bon->id_bon,
                        'code_verification' => $bon->code_verification,
                        'fournisseur' => $bon->fournisseur->nom_societe,
                        'depot' => $bon->depot->nom_depot,
                        'position' => [
                            'lat' => $bon->depot->latitude ?? 12.6392,
                            'lng' => $bon->depot->longitude ?? -8.0029
                        ],
                        'statut' => $bon->statut,
                        'type_carburant' => $bon->type_carburant,
                        'quantite' => $bon->quantite_commandee,
                        'progression' => $this->getProgression($bon)
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $livraisons,
                'centre_carte' => ['lat' => 12.6392, 'lng' => -8.0029],
                'zoom' => 12,
                'message' => 'Livraisons à suivre'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur suivi livraisons',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== STATISTIQUES ====================
    
    public function statistiques(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'periode' => 'required|in:jour,semaine,mois,annee',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            $dateDebut = $request->date_debut ?? Carbon::now()->startOfMonth();
            $dateFin = $request->date_fin ?? Carbon::now();
            
            $stats = [
                'periode' => ['debut' => $dateDebut, 'fin' => $dateFin],
                'livraisons' => [
                    'total' => Bon::whereBetween('date_creation', [$dateDebut, $dateFin])->count(),
                    'quantite_totale' => Bon::whereBetween('date_creation', [$dateDebut, $dateFin])
                        ->where('statut', 'termine')
                        ->sum('quantite_chargee')
                ],
                'evolution' => $this->getEvolution($dateDebut, $dateFin, $request->periode)
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistiques générées'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur génération statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function fixerPrixCarburant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type_carburant' => 'required|in:essence,gasoil',
            'prix_litre' => 'required|numeric|min:0',
            'date_application' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Erreur de validation'
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            PrixCarburant::where('type_carburant', $request->type_carburant)
                ->where('actif', true)
                ->update(['actif' => false]);
            
            $prix = PrixCarburant::create([
                'type_carburant' => $request->type_carburant,
                'prix_litre' => $request->prix_litre,
                'date_application' => $request->date_application,
                'fixe_par' => auth()->user()->id_utilisateur,
                'actif' => true
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'data' => $prix,
                'message' => "Prix fixé à {$request->prix_litre} FCFA/L"
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur fixation prix',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function historiquePrix(Request $request)
    {
        try {
            $prix = PrixCarburant::with('fixateur')
                ->orderBy('date_application', 'desc')
                ->paginate($request->get('per_page', 20));
            
            return response()->json([
                'success' => true,
                'data' => $prix,
                'message' => 'Historique des prix'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération historique',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function getAlertes()
    {
        $alertes = [];
        
        $depotsCritiques = Depot::where('stock_essence', '<', 5000)
            ->orWhere('stock_gasoil', '<', 5000)
            ->get();
            
        foreach ($depotsCritiques as $depot) {
            $alertes[] = [
                'type' => 'stock_critique',
                'severite' => 'haute',
                'message' => "Stock critique au dépôt {$depot->nom_depot}",
                'date' => Carbon::now()
            ];
        }
        
        return $alertes;
    }
    
    public function historiqueOperations(Request $request)
    {
        try {
            $operations = DB::table('audit_logs')
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 50));
            
            return response()->json([
                'success' => true,
                'data' => $operations,
                'message' => 'Historique des opérations'
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération historique',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    // ==================== MÉTHODES PRIVÉES ====================
    
    private function getStocksDepots()
    {
        return Depot::all()->map(function($depot) {
            return [
                'nom' => $depot->nom_depot,
                'essence' => $depot->stock_essence ?? 0,
                'gasoil' => $depot->stock_gasoil ?? 0
            ];
        });
    }
    
    private function getRecentLivraisons()
    {
        return Bon::with('depot')
            ->whereDate('created_at', '>=', Carbon::now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }
    
    private function getStockStatus($depot)
    {
        $seuilAlerte = 5000;
        $stockTotal = ($depot->stock_essence ?? 0) + ($depot->stock_gasoil ?? 0);
        
        if ($stockTotal <= $seuilAlerte) return 'alerte';
        return 'normal';
    }
    
    private function getProgression($bon)
    {
        if ($bon->fin_chargement) return 100;
        if ($bon->debut_chargement) return 50;
        if ($bon->statut === 'signe') return 25;
        if ($bon->statut === 'cree') return 10;
        return 0;
    }
    
    private function getEvolution($dateDebut, $dateFin, $periode)
    {
        $evolution = [];
        $current = clone $dateDebut;
        
        while ($current <= $dateFin) {
            $debutPeriode = clone $current;
            $finPeriode = $periode === 'jour' ? clone $current->endOfDay() : 
                         ($periode === 'semaine' ? clone $current->endOfWeek() :
                         ($periode === 'mois' ? clone $current->endOfMonth() : clone $current->endOfYear()));
            
            $evolution[] = [
                'periode' => $debutPeriode->format('Y-m-d'),
                'total' => Bon::whereBetween('date_creation', [$debutPeriode, $finPeriode])->count()
            ];
            
            if ($periode === 'jour') $current->addDay();
            elseif ($periode === 'semaine') $current->addWeek();
            elseif ($periode === 'mois') $current->addMonth();
            else $current->addYear();
        }
        
        return $evolution;
    }
}