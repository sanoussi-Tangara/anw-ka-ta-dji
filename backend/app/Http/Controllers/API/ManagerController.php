<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Fournisseur;
use App\Models\Icr;
use App\Models\ResponsableDepot;
use App\Models\Depot;
use App\Models\Bon;
use App\Models\Stock;
use App\Models\Alerte;
use App\Models\Station;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ManagerController extends Controller
{
    // public function __construct()
    // {
    //     $this->middleware('auth:sanctum');
    //     $this->middleware('role:manager');
    // }

    // ==============================================
    // 🔹 GESTION DES FOURNISSEURS
    // ==============================================

    public function creerFournisseur(Request $request)
    {
        $request->validate([
            'nom_societe' => 'required|string|max:100',
            'adresse' => 'nullable|string|max:200',
            'nif' => 'nullable|string|max:50',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'telephone' => 'nullable|string|max:20'
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'nom' => $request->nom_societe,
                'prenom' => '',
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'telephone' => $request->telephone,
                'role' => 'fournisseur'
            ]);

            $fournisseur = Fournisseur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'nom_societe' => $request->nom_societe,
                'adresse' => $request->adresse,
                'nif' => $request->nif
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Fournisseur créé avec succès',
                'fournisseur' => $fournisseur->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function modifierFournisseur(Request $request, $id_fournisseur)
    {
        $fournisseur = Fournisseur::findOrFail($id_fournisseur);
        $user = $fournisseur->user;

        $request->validate([
            'nom_societe' => 'sometimes|string|max:100',
            'adresse' => 'nullable|string|max:200',
            'nif' => 'nullable|string|max:50',
            'telephone' => 'nullable|string|max:20'
        ]);

        DB::beginTransaction();

        try {
            if ($request->has('nom_societe')) {
                $fournisseur->nom_societe = $request->nom_societe;
            }
            if ($request->has('adresse')) {
                $fournisseur->adresse = $request->adresse;
            }
            if ($request->has('nif')) {
                $fournisseur->nif = $request->nif;
            }
            $fournisseur->save();

            if ($request->has('telephone')) {
                $user->telephone = $request->telephone;
                $user->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Fournisseur modifié avec succès',
                'fournisseur' => $fournisseur->fresh('user')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la modification'], 500);
        }
    }

    public function listerFournisseurs()
    {
        $fournisseurs = Fournisseur::with('user')->get();
        return response()->json(['fournisseurs' => $fournisseurs]);
    }

    public function desactiverFournisseur($id_fournisseur)
    {
        try {
            $fournisseur = Fournisseur::findOrFail($id_fournisseur);
            $user = $fournisseur->user;
            $user->statut = false;
            $user->save();

            return response()->json(['message' => 'Fournisseur désactivé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la désactivation'], 500);
        }
    }

    public function activerFournisseur($id_fournisseur)
    {
        try {
            $fournisseur = Fournisseur::findOrFail($id_fournisseur);
            $user = $fournisseur->user;
            $user->statut = true;
            $user->save();

            return response()->json(['message' => 'Fournisseur activé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'activation'], 500);
        }
    }

    // ==============================================
    // 🔹 GESTION DES ICR
    // ==============================================

    public function creerIcr(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'matricule' => 'required|string|max:50|unique:icr,matricule',
            'zone' => 'nullable|string|max:100'
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'telephone' => $request->telephone,
                'role' => 'icr'
            ]);

            $icr = Icr::create([
                'id_utilisateur' => $user->id_utilisateur,
                'matricule' => $request->matricule,
                'zone' => $request->zone
            ]);

            DB::commit();

            return response()->json([
                'message' => 'ICR créé avec succès',
                'icr' => $icr->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function modifierIcr(Request $request, $id_icr)
    {
        $icr = Icr::findOrFail($id_icr);
        $user = $icr->user;

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'nullable|string|max:20',
            'zone' => 'nullable|string|max:100'
        ]);

        DB::beginTransaction();

        try {
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

            if ($request->has('zone')) {
                $icr->zone = $request->zone;
                $icr->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'ICR modifié avec succès',
                'icr' => $icr->fresh('user')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la modification'], 500);
        }
    }

    public function listerIcr()
    {
        $icrs = Icr::with('user')->get();
        return response()->json(['icrs' => $icrs]);
    }

    public function desactiverIcr($id_icr)
    {
        try {
            $icr = Icr::findOrFail($id_icr);
            $user = $icr->user;
            $user->statut = false;
            $user->save();

            return response()->json(['message' => 'ICR désactivé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la désactivation'], 500);
        }
    }

    public function activerIcr($id_icr)
    {
        try {
            $icr = Icr::findOrFail($id_icr);
            $user = $icr->user;
            $user->statut = true;
            $user->save();

            return response()->json(['message' => 'ICR activé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'activation'], 500);
        }
    }

    // ==============================================
    // 🔹 GESTION DES RESPONSABLES DE DÉPÔT
    // ==============================================

    public function creerResponsableDepot(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|max:20',
            'password' => 'required|string|min:6'
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'telephone' => $request->telephone,
                'role' => 'responsable_depot'
            ]);

            $responsable = ResponsableDepot::create([
                'id_utilisateur' => $user->id_utilisateur
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Responsable de dépôt créé avec succès',
                'responsable' => $responsable->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    public function modifierResponsableDepot(Request $request, $id_responsable)
    {
        $responsable = ResponsableDepot::findOrFail($id_responsable);
        $user = $responsable->user;

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'nullable|string|max:20'
        ]);

        DB::beginTransaction();

        try {
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

            DB::commit();

            return response()->json([
                'message' => 'Responsable de dépôt modifié avec succès',
                'responsable' => $responsable->fresh('user')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la modification'], 500);
        }
    }

    public function listerResponsablesDepot()
    {
        $responsables = ResponsableDepot::with('user')->get();
        return response()->json(['responsables' => $responsables]);
    }

    public function desactiverResponsableDepot($id_responsable)
    {
        try {
            $responsable = ResponsableDepot::findOrFail($id_responsable);
            $user = $responsable->user;
            $user->statut = false;
            $user->save();

            return response()->json(['message' => 'Responsable de dépôt désactivé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la désactivation'], 500);
        }
    }

    public function activerResponsableDepot($id_responsable)
    {
        try {
            $responsable = ResponsableDepot::findOrFail($id_responsable);
            $user = $responsable->user;
            $user->statut = true;
            $user->save();

            return response()->json(['message' => 'Responsable de dépôt activé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'activation'], 500);
        }
    }

    // ==============================================
    // 🔹 TABLEAU DE BORD
    // ==============================================

    public function dashboard()
    {
        try {
            $stats = [
                'fournisseurs' => Fournisseur::count(),
                'icr' => Icr::count(),
                'responsables_depot' => ResponsableDepot::count(),
                'depots' => Depot::count(),
                'stations' => Station::count(),
                'bons_en_cours' => Bon::where('statut', 'en_cours')->count(),
                'alertes_non_lues' => Alerte::where('statut', 'non_lue')->count()
            ];

            $stockEssence = Stock::where('type_carburant', 'essence')->sum('quantite');
            $stockGasoil = Stock::where('type_carburant', 'gasoil')->sum('quantite');

            return response()->json([
                'statistiques' => $stats,
                'stocks' => [
                    'essence' => $stockEssence,
                    'gasoil' => $stockGasoil
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du chargement du tableau de bord'], 500);
        }
    }

    // ==============================================
    // 🔹 STOCKS
    // ==============================================

    public function stocksDepots()
    {
        try {
            $depots = Depot::with('stocks')->get();
            return response()->json(['stocks' => $depots]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des stocks'], 500);
        }
    }

    public function stocksStations()
    {
        try {
            $stations = Station::with('stocks')->get();
            return response()->json(['stocks' => $stations]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des stocks'], 500);
        }
    }

    // ==============================================
    // 🔹 SUIVI DES LIVRAISONS
    // ==============================================

    public function suiviLivraisons()
    {
        try {
            $bons = Bon::with(['fournisseur.user', 'depot', 'icr.user'])
                ->whereIn('statut', ['signe', 'en_cours'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json(['livraisons' => $bons]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du suivi des livraisons'], 500);
        }
    }

    // ==============================================
    // 🔹 ALERTES
    // ==============================================

    public function alertes()
    {
        try {
            $alertes = Alerte::with('destinataire')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json(['alertes' => $alertes]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des alertes'], 500);
        }
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    public function statistiques(Request $request)
    {
        $request->validate([
            'periode' => 'required|in:jour,semaine,mois,annee',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut'
        ]);

        try {
            $dateDebut = $request->date_debut ? Carbon::parse($request->date_debut) : Carbon::now()->startOfMonth();
            $dateFin = $request->date_fin ? Carbon::parse($request->date_fin) : Carbon::now();

            $bons = Bon::whereBetween('created_at', [$dateDebut, $dateFin]);

            $stats = [
                'periode' => [
                    'debut' => $dateDebut->format('Y-m-d'),
                    'fin' => $dateFin->format('Y-m-d')
                ],
                'total_bons' => $bons->count(),
                'bons_termines' => (clone $bons)->where('statut', 'termine')->count(),
                'quantite_totale' => (clone $bons)->where('statut', 'termine')->sum('quantite_chargee')
            ];

            return response()->json($stats);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la génération des statistiques'], 500);
        }
    }

    // ==============================================
    // 🔹 FIXER LE PRIX DU CARBURANT
    // ==============================================

    public function fixerPrix(Request $request)
    {
        $request->validate([
            'prix_essence' => 'required|numeric|min:0',
            'prix_gasoil' => 'required|numeric|min:0'
        ]);

        try {
            $manager = auth()->user();
            $manager->prix_essence = $request->prix_essence;
            $manager->prix_gasoil = $request->prix_gasoil;
            $manager->prix_updated_at = now();
            $manager->save();

            return response()->json([
                'message' => 'Prix fixés avec succès',
                'prix' => [
                    'essence' => $manager->prix_essence,
                    'gasoil' => $manager->prix_gasoil,
                    'mis_a_jour_le' => $manager->prix_updated_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la fixation des prix'], 500);
        }
    }

    public function getPrix()
    {
        try {
            $manager = User::where('role', 'manager')
                ->whereNotNull('prix_essence')
                ->orderBy('prix_updated_at', 'desc')
                ->first();

            return response()->json([
                'essence' => $manager->prix_essence ?? 750,
                'gasoil' => $manager->prix_gasoil ?? 700,
                'mis_a_jour_le' => $manager->prix_updated_at ?? null
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des prix'], 500);
        }
    }

    public function historiquePrix()
    {
        try {
            $historique = User::where('role', 'manager')
                ->whereNotNull('prix_essence')
                ->orderBy('prix_updated_at', 'desc')
                ->get(['prix_essence', 'prix_gasoil', 'prix_updated_at']);

            return response()->json(['historique' => $historique]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération de l\'historique'], 500);
        }
    }
}