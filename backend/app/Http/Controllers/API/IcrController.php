<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Icr;
use App\Models\User;
use App\Models\Gerant;
use App\Models\Chauffeur;
use App\Models\Bon;
use App\Models\Mission;
use App\Models\Camion;
use App\Models\Certificat;
use App\Models\Livraison;
use App\Models\Station;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class IcrController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES GÉRANTS
    // ==============================================

    public function voirGerants()
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $gerants = Gerant::with('user')->where('id_icr', $icr->id_icr)->get();
        return response()->json(['gerants' => $gerants]);
    }

    public function creerGerant(Request $request)
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|unique:users,telephone'
        ]);

        DB::beginTransaction();
        try {
            $userGerant = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password ?? 'default123'),
                'telephone' => $request->telephone,
                'role' => 'gerant'
            ]);

            $gerant = Gerant::create([
                'id_utilisateur' => $userGerant->id_utilisateur,
                'id_icr' => $icr->id_icr
            ]);

            DB::commit();
            return response()->json([
                'message' => 'Gérant créé avec succès', 
                'gerant' => $gerant->load('user')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function modifierGerant(Request $request, $id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur'
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        return response()->json(['message' => 'Gérant modifié avec succès', 'gerant' => $gerant->fresh('user')]);
    }

    public function desactiverGerant($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;
        $user->statut = false;
        $user->save();
        return response()->json(['message' => 'Gérant désactivé']);
    }

    public function activerGerant($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;
        $user->statut = true;
        $user->save();
        return response()->json(['message' => 'Gérant activé']);
    }

    public function detailGerant($id_gerant)
    {
        $gerant = Gerant::with('user')->findOrFail($id_gerant);
        return response()->json($gerant);
    }

    // ==============================================
    // 🔹 GESTION DES CHAUFFEURS
    // ==============================================

    public function voirChauffeurs()
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $chauffeurs = Chauffeur::with('user')->where('id_icr', $icr->id_icr)->get();
        return response()->json(['chauffeurs' => $chauffeurs]);
    }

    public function creerChauffeur(Request $request)
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|unique:users,telephone',
            'permis' => 'required|string|max:50'
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password ?? 'default123'),
                'telephone' => $request->telephone,
                'role' => 'chauffeur',
                'permis' => $request->permis
            ]);

            $chauffeur = Chauffeur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'id_icr' => $icr->id_icr,
                'permis' => $request->permis
            ]);

            DB::commit();
            return response()->json(['message' => 'Chauffeur créé avec succès', 'chauffeur' => $chauffeur->load('user')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function modifierChauffeur(Request $request, $id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        $user = $chauffeur->user;

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur',
            'permis' => 'sometimes|string|max:50'
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        if ($request->has('permis')) {
            $chauffeur->permis = $request->permis;
            $chauffeur->save();
        }

        return response()->json(['message' => 'Chauffeur modifié avec succès', 'chauffeur' => $chauffeur->fresh('user')]);
    }

    public function desactiverChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        $user = $chauffeur->user;
        $user->statut = false;
        $user->save();
        return response()->json(['message' => 'Chauffeur désactivé']);
    }

    public function activerChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        $user = $chauffeur->user;
        $user->statut = true;
        $user->save();
        return response()->json(['message' => 'Chauffeur activé']);
    }

    public function detailChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::with('user')->findOrFail($id_chauffeur);
        return response()->json($chauffeur);
    }

    // ==============================================
    // 🔹 GESTION DES STATIONS
    // ==============================================

    public function voirStations()
    {
        $stations = Station::with('gerant.user')->get();
        return response()->json(['stations' => $stations]);
    }

    public function creerStation(Request $request)
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $request->validate([
            'nom' => 'required|string|max:100',
            'adresse' => 'required|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'id_gerant' => 'required|exists:gerants,id_gerant'
        ]);

        try {
            $station = Station::create([
                'id_icr' => $icr->id_icr,
                'nom' => $request->nom,
                'adresse' => $request->adresse,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'id_gerant' => $request->id_gerant
            ]);

            return response()->json([
                'message' => 'Station créée avec succès',
                'station' => $station
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function modifierStation(Request $request, $id_station)
    {
        $station = Station::findOrFail($id_station);

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'adresse' => 'sometimes|string',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'id_gerant' => 'sometimes|exists:gerants,id_gerant'
        ]);

        if ($request->has('nom')) $station->nom = $request->nom;
        if ($request->has('adresse')) $station->adresse = $request->adresse;
        if ($request->has('latitude')) $station->latitude = $request->latitude;
        if ($request->has('longitude')) $station->longitude = $request->longitude;
        if ($request->has('id_gerant')) $station->id_gerant = $request->id_gerant;
        $station->save();

        return response()->json([
            'message' => 'Station modifiée avec succès',
            'station' => $station
        ]);
    }

    public function desactiverStation($id_station)
    {
        $station = Station::findOrFail($id_station);
        $station->statut = 'inactive';
        $station->save();
        return response()->json(['message' => 'Station désactivée']);
    }

    public function activerStation($id_station)
    {
        $station = Station::findOrFail($id_station);
        $station->statut = 'active';
        $station->save();
        return response()->json(['message' => 'Station activée']);
    }

    public function detailStation($id_station)
    {
        $station = Station::with('gerant.user')->findOrFail($id_station);
        return response()->json($station);
    }

    // ==============================================
    // 🔹 GESTION DES CAMIONS
    // ==============================================

    public function voirCamions()
{
    $user = auth()->user();
    $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
    
    if (!$icr) {
        return response()->json(['message' => 'ICR non trouvé', 'camions' => []], 404);
    }
    
    $camions = Camion::where('id_icr', $icr->id_icr)->get();
    return response()->json(['camions' => $camions]);
}


public function creerCamion(Request $request)
{
    $user = auth()->user();
    $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
    
    if (!$icr) {
        return response()->json(['message' => 'ICR non trouvé'], 404);
    }
    
    $request->validate([
        'immatriculation' => 'required|string|max:20|unique:camions',
        'capacite' => 'required|numeric|min:0',
        'type_carburant' => 'required|in:essence,gasoil',
        'id_chauffeur' => 'required|exists:chauffeurs,id_chauffeur'
    ]);

    $camion = Camion::create([
        'id_icr' => $icr->id_icr,  // ← VÉRIFIE QUE CETTE LIGNE EXISTE
        'immatriculation' => $request->immatriculation,
        'capacite' => $request->capacite,
        'type_carburant' => $request->type_carburant,
        'statut' => 'disponible',
        'id_chauffeur' => $request->id_chauffeur
    ]);

    return response()->json(['message' => 'Camion créé avec succès', 'camion' => $camion], 201);
}
    public function desactiverCamion($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);
        $camion->statut = 'hors_service';
        $camion->save();
        return response()->json(['message' => 'Camion désactivé']);
    }

    public function activerCamion($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);
        $camion->statut = 'disponible';
        $camion->save();
        return response()->json(['message' => 'Camion activé']);
    }

    public function detailCamion($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);
        return response()->json($camion);
    }

    // ==============================================
    // 🔹 GESTION DES BONS
    // ==============================================

    public function bonsRecus()
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $bons = Bon::where('id_icr', $icr->id_icr)
            ->with(['fournisseur.user', 'depot'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['bons' => $bons]);
    }

    public function detailBon($id_bon)
    {
        $bon = Bon::with(['fournisseur.user', 'depot', 'icr.user'])->findOrFail($id_bon);
        return response()->json($bon);
    }

    // ==============================================
    // 🔹 GESTION DES MISSIONS
    // ==============================================
public function organiserMission(Request $request)
{
    $user = auth()->user();
    $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
    
    if (!$icr) {
        return response()->json(['message' => 'ICR non trouvé'], 404);
    }
    
    $request->validate([
        'id_bon' => 'required|exists:bons,id_bon',
        'id_chauffeur' => 'required|exists:chauffeurs,id_chauffeur',
        'id_camion' => 'required|exists:camions,id_camion',
        'livraisons' => 'required|array|min:1',
        'livraisons.*.id_station' => 'required|exists:stations,id_station',
        'livraisons.*.quantite_prevue' => 'required|numeric|min:1',
        'livraisons.*.code_validation' => 'required|string|size:4'
    ]);

    DB::beginTransaction();
    try {
        // 1. Créer la mission
        $mission = Mission::create([
            'id_bon' => $request->id_bon,
            'id_icr' => $icr->id_icr,
            'id_chauffeur' => $request->id_chauffeur,
            'id_camion' => $request->id_camion,
            'statut' => 'planifiee'
        ]);

        // 2. Créer les livraisons et envoyer les notifications
        foreach ($request->livraisons as $livraison) {
            $station = Station::find($livraison['id_station']);
            
            $liv = Livraison::create([
                'id_mission' => $mission->id_mission,
                'id_station' => $livraison['id_station'],
                'quantite_prevue' => $livraison['quantite_prevue'],
                'code_validation' => $livraison['code_validation'],
                'statut' => 'en_attente',
                'id_gerant' => $station ? $station->id_gerant : null
            ]);
            
            // ✅ ENVOYER UNE NOTIFICATION AU GÉRANT DE LA STATION
            if ($station && $station->id_gerant) {
                $gerant = \App\Models\Gerant::find($station->id_gerant);
                if ($gerant && $gerant->user) {
                    \App\Models\Notification::create([
                        'type' => 'livraison',
                        'titre' => '📦 Nouvelle livraison en attente',
                        'message' => "Une livraison de {$livraison['quantite_prevue']}L est prévue pour votre station {$station->nom}. Code: {$livraison['code_validation']}",
                        'id_destinataire' => $gerant->user->id_utilisateur,
                        'lu' => false,
                        'lien' => '/gerant/livraisons',
                        'created_at' => now()
                    ]);
                }
            }
        }

        DB::commit();
        
        // 3. Retourner l'ID mission
        return response()->json([
            'success' => true,
            'message' => 'Mission organisée avec succès',
            'id_mission' => $mission->id_mission,
            'mission' => $mission
        ], 201);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}
    public function voirMissions()
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $missions = Mission::where('id_icr', $icr->id_icr)
            ->with(['bon', 'chauffeur.user', 'camion', 'livraisons.station'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['missions' => $missions]);
    }

    public function detailMission($id_mission)
    {
        $mission = Mission::with([
            'bon.fournisseur.user',
            'bon.depot',
            'chauffeur.user',
            'camion',
            'livraisons.station',
            'certificat'
        ])->findOrFail($id_mission);
        return response()->json($mission);
    }

    public function annulerMission($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);
        if ($mission->statut !== 'planifiee') {
            return response()->json(['message' => 'Mission non annulable'], 400);
        }
        $mission->statut = 'annulee';
        $mission->save();
        return response()->json(['message' => 'Mission annulée']);
    }

    // ==============================================
    // 🔹 SUIVI GPS
    // ==============================================

    public function suivreGps($id_mission)
    {
        $mission = Mission::with('camion')->findOrFail($id_mission);
        return response()->json([
            'mission' => $mission->id_mission,
            'camion' => $mission->camion->immatriculation,
            'position' => [
                'latitude' => 12.6392,
                'longitude' => -8.0029,
                'derniere_mise_a_jour' => now()
            ]
        ]);
    }

    public function positionCamion($id_camion)
    {
        $camion = Camion::findOrFail($id_camion);
        return response()->json([
            'camion' => $camion->immatriculation,
            'position' => [
                'latitude' => 12.6392,
                'longitude' => -8.0029,
                'derniere_mise_a_jour' => now()
            ]
        ]);
    }

    // ==============================================
    // 🔹 PROFIL ET DASHBOARD
    // ==============================================

    public function profil()
    {
        $user = auth()->user();
        $icr = Icr::with(['user', 'gerants', 'chauffeurs', 'missions'])
            ->where('id_utilisateur', $user->id_utilisateur)
            ->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        return response()->json($icr);
    }

    public function updateProfil(Request $request)
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur'
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'icr' => $icr->fresh('user')
        ]);
    }

    public function dashboard()
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $stats = [
            'nb_gerants' => Gerant::where('id_icr', $icr->id_icr)->count(),
            'nb_chauffeurs' => Chauffeur::where('id_icr', $icr->id_icr)->count(),
            'nb_stations' => Station::count(),
            'nb_camions' => Camion::where('id_icr', $icr->id_icr)->count(),
            'nb_missions_en_cours' => Mission::where('id_icr', $icr->id_icr)->where('statut', 'en_cours')->count(),
            'nb_bons_en_attente' => Bon::where('id_icr', $icr->id_icr)->where('statut', 'signe')->count()
        ];
        return response()->json(['statistiques' => $stats]);
    }

    // ==============================================
    // 🔹 STATISTIQUES ET RAPPORTS
    // ==============================================

    public function statistiques()
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $stats = [
            'total_gerants' => Gerant::where('id_icr', $icr->id_icr)->count(),
            'total_chauffeurs' => Chauffeur::where('id_icr', $icr->id_icr)->count(),
            'total_stations' => Station::count(),
            'total_camions' => Camion::where('id_icr', $icr->id_icr)->count(),
            'missions_planifiees' => Mission::where('id_icr', $icr->id_icr)->where('statut', 'planifiee')->count(),
            'missions_en_cours' => Mission::where('id_icr', $icr->id_icr)->where('statut', 'en_cours')->count(),
            'missions_terminees' => Mission::where('id_icr', $icr->id_icr)->where('statut', 'terminee')->count(),
            'bons_recus' => Bon::where('id_icr', $icr->id_icr)->where('statut', 'signe')->count()
        ];
        return response()->json($stats);
    }

    public function rapportMensuel(Request $request)
    {
        $user = auth()->user();
        $icr = Icr::where('id_utilisateur', $user->id_utilisateur)->first();
        
        if (!$icr) {
            return response()->json(['message' => 'ICR non trouvé'], 404);
        }
        
        $mois = $request->get('mois', date('m'));
        $annee = $request->get('annee', date('Y'));

        $missions = Mission::where('id_icr', $icr->id_icr)
            ->whereYear('created_at', $annee)
            ->whereMonth('created_at', $mois)
            ->get();

        $rapport = [
            'mois' => $mois,
            'annee' => $annee,
            'total_missions' => $missions->count(),
            'missions_terminees' => $missions->where('statut', 'terminee')->count(),
            'quantite_totale' => $missions->sum('bon.quantite_chargee') ?? 0
        ];

        return response()->json($rapport);
    }

    // ==============================================
    // 🔹 CHARGEMENT ET CERTIFICAT
    // ==============================================

    public function enregistrerChargement(Request $request)
    {
        $request->validate([
            'id_mission' => 'required|exists:missions,id_mission',
            'quantite_chargee' => 'required|numeric|min:0',
            'photo_compteur' => 'nullable|string'
        ]);

        $mission = Mission::with('bon')->findOrFail($request->id_mission);
        
        $mission->bon->quantite_chargee = $request->quantite_chargee;
        if ($request->has('photo_compteur')) {
            $mission->bon->photo_compteur = $request->photo_compteur;
        }
        $mission->bon->save();

        $certificat = Certificat::create([
            'id_mission' => $mission->id_mission,
            'date_generation' => now(),
            'statut' => 'genere'
        ]);

        return response()->json([
            'message' => 'Chargement enregistré, certificat généré',
            'certificat' => $certificat
        ]);
    }
public function signerCertificat(Request $request)
{
    $request->validate([
        'id_certificat' => 'required|exists:certificats,id_certificat',
        'signature' => 'required|string',
        'signataire' => 'required|in:icr,chauffeur'
    ]);

    $certificat = Certificat::findOrFail($request->id_certificat);
    
    if ($request->signataire === 'icr') {
        $certificat->signature_icr = $request->signature;
    } else {
        $certificat->signature_chauffeur = $request->signature;
    }
    
    $certificat->save();

    // Vérifier si les deux signatures sont présentes
    if ($certificat->signature_icr && $certificat->signature_chauffeur) {
        $certificat->statut = 'signe';
        $certificat->save();
        
        // Démarrer la mission
        $mission = $certificat->mission;
        $mission->date_depart = now();
        $mission->statut = 'en_cours';
        $mission->save();
    }

    return response()->json([
        'message' => 'Signature enregistrée',
        'certificat' => $certificat
    ]);
}
    public function voirCertificat($id_mission)
    {
        $certificat = Certificat::with(['mission.bon', 'mission.chauffeur.user', 'mission.livraisons.station'])
            ->where('id_mission', $id_mission)
            ->firstOrFail();
        return response()->json($certificat);
    }

    public function genererPdfCertificat($id_certificat)
    {
        $certificat = Certificat::with(['mission.bon', 'mission.chauffeur.user', 'mission.livraisons.station'])
            ->findOrFail($id_certificat);

        return response()->json([
            'message' => 'PDF généré',
            'certificat' => $certificat
        ]);
    }

    // ==============================================
    // 🔹 MISSIONS (DEMARRER/TERMINER)
    // ==============================================

    public function demarrerMission($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);
        
        if ($mission->statut !== 'planifiee') {
            return response()->json(['message' => 'Mission non démarrable'], 400);
        }

        $mission->statut = 'en_cours';
        $mission->date_depart = now();
        $mission->save();

        return response()->json([
            'message' => 'Mission démarrée',
            'mission' => $mission
        ]);
    }

    public function terminerMission($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);
        
        if ($mission->statut !== 'en_cours') {
            return response()->json(['message' => 'Mission non terminable'], 400);
        }

        $mission->statut = 'terminee';
        $mission->date_arrivee_reelle = now();
        $mission->save();

        $mission->bon->statut = 'termine';
        $mission->bon->save();

        return response()->json([
            'message' => 'Mission terminée',
            'mission' => $mission
        ]);
    }
}