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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class IcrController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES GÉRANTS
    // ==============================================

    // 1. Créer un gérant
    public function creerGerant(Request $request)
    {
        $request->validate([
            'id_icr' => 'required|exists:icr,id_icr',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|unique:users,telephone',
            'id_station' => 'required|exists:stations,id_station'
        ]);

        DB::beginTransaction();

        try {
            // Créer l'utilisateur
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password ?? 'default123'),
                'telephone' => $request->telephone,
                'role' => 'gerant'
            ]);

            // Créer le gérant
            $gerant = Gerant::create([
                'id_utilisateur' => $user->id_utilisateur,
                'id_icr' => $request->id_icr
            ]);

            // Associer la station
            $station = Station::find($request->id_station);
            $station->id_gerant = $gerant->id_gerant;
            $station->save();

            DB::commit();

            return response()->json([
                'message' => 'Gérant créé avec succès',
                'gerant' => $gerant->load('user', 'station')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    // 2. Modifier un gérant
    public function modifierGerant(Request $request, $id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur',
            'id_station' => 'sometimes|exists:stations,id_station'
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        if ($request->has('id_station')) {
            $station = Station::find($request->id_station);
            $station->id_gerant = $gerant->id_gerant;
            $station->save();
        }

        return response()->json([
            'message' => 'Gérant modifié avec succès',
            'gerant' => $gerant->fresh('user', 'station')
        ]);
    }

    // 3. Désactiver un gérant
    public function desactiverGerant($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;
        $user->statut = false;
        $user->save();

        return response()->json(['message' => 'Gérant désactivé']);
    }

    // 4. Activer un gérant
    public function activerGerant($id_gerant)
    {
        $gerant = Gerant::findOrFail($id_gerant);
        $user = $gerant->user;
        $user->statut = true;
        $user->save();

        return response()->json(['message' => 'Gérant activé']);
    }

    // 5. Voir tous les gérants
    public function voirGerants($id_icr)
    {
        $icr = Icr::with(['gerants.user', 'gerants.station'])->findOrFail($id_icr);
        return response()->json(['gerants' => $icr->gerants]);
    }

    // ==============================================
    // 🔹 GESTION DES CHAUFFEURS
    // ==============================================

    // 6. Créer un chauffeur
    public function creerChauffeur(Request $request)
    {
        $request->validate([
            'id_icr' => 'required|exists:icr,id_icr',
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
                'id_icr' => $request->id_icr,
                'permis' => $request->permis
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Chauffeur créé avec succès',
                'chauffeur' => $chauffeur->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création'], 500);
        }
    }

    // 7. Modifier un chauffeur
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

        return response()->json([
            'message' => 'Chauffeur modifié avec succès',
            'chauffeur' => $chauffeur->fresh('user')
        ]);
    }

    // 8. Désactiver un chauffeur
    public function desactiverChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        $user = $chauffeur->user;
        $user->statut = false;
        $user->save();

        return response()->json(['message' => 'Chauffeur désactivé']);
    }

    // 9. Activer un chauffeur
    public function activerChauffeur($id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        $user = $chauffeur->user;
        $user->statut = true;
        $user->save();

        return response()->json(['message' => 'Chauffeur activé']);
    }

    // 10. Voir tous les chauffeurs
    public function voirChauffeurs($id_icr)
    {
        $icr = Icr::with('chauffeurs.user')->findOrFail($id_icr);
        return response()->json(['chauffeurs' => $icr->chauffeurs]);
    }

    // ==============================================
    // 🔹 GESTION DES BONS
    // ==============================================

    // 11. Voir les bons reçus
    public function bonsRecus($id_icr)
    {
        $bons = Bon::where('id_icr', $id_icr)
            ->with(['fournisseur.user', 'depot'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['bons' => $bons]);
    }

    // 12. Voir le détail d'un bon
    public function detailBon($id_bon)
    {
        $bon = Bon::with(['fournisseur.user', 'depot', 'icr.user'])->findOrFail($id_bon);
        return response()->json($bon);
    }

    // ==============================================
    // 🔹 GESTION DES MISSIONS
    // ==============================================

    // 13. Organiser une mission
    public function organiserMission(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon',
            'id_icr' => 'required|exists:icr,id_icr',
            'id_chauffeur' => 'required|exists:chauffeurs,id_chauffeur',
            'id_camion' => 'required|exists:camions,id_camion',
            'livraisons' => 'required|array|min:1',
            'livraisons.*.id_station' => 'required|exists:stations,id_station',
            'livraisons.*.quantite_prevue' => 'required|numeric|min:1',
            'livraisons.*.code_validation' => 'required|string|size:4'
        ]);

        DB::beginTransaction();

        try {
            // Créer la mission
            $mission = Mission::create([
                'id_bon' => $request->id_bon,
                'id_icr' => $request->id_icr,
                'id_chauffeur' => $request->id_chauffeur,
                'id_camion' => $request->id_camion,
                'statut' => 'planifiee'
            ]);

            // Créer les livraisons
            foreach ($request->livraisons as $livraison) {
                Livraison::create([
                    'id_mission' => $mission->id_mission,
                    'id_station' => $livraison['id_station'],
                    'quantite_prevue' => $livraison['quantite_prevue'],
                    'code_validation' => $livraison['code_validation'],
                    'statut' => 'en_attente'
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Mission organisée avec succès',
                'mission' => $mission->load('livraisons')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'organisation'], 500);
        }
    }

    // 14. Voir toutes les missions
    public function voirMissions($id_icr)
    {
        $missions = Mission::where('id_icr', $id_icr)
            ->with(['bon', 'chauffeur.user', 'camion', 'livraisons.station'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['missions' => $missions]);
    }

    // 15. Voir le détail d'une mission
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

    // 16. Annuler une mission
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
    // 🔹 CHARGEMENT ET CERTIFICAT
    // ==============================================

    // 17. Enregistrer le chargement (jauge départ)
    public function enregistrerChargement(Request $request)
    {
        $request->validate([
            'id_mission' => 'required|exists:missions,id_mission',
            'quantite_chargee' => 'required|numeric|min:0',
            'photo_compteur' => 'nullable|string'
        ]);

        $mission = Mission::with('bon')->findOrFail($request->id_mission);
        
        // Mettre à jour le bon
        $mission->bon->quantite_chargee = $request->quantite_chargee;
        if ($request->has('photo_compteur')) {
            $mission->bon->photo_compteur = $request->photo_compteur;
        }
        $mission->bon->save();

        // Générer le certificat
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

    // 18. Signer le certificat
    public function signerCertificat(Request $request)
    {
        $request->validate([
            'id_certificat' => 'required|exists:certificats,id_certificat',
            'signature_icr' => 'required|string',
            'signature_chauffeur' => 'required|string'
        ]);

        $certificat = Certificat::findOrFail($request->id_certificat);
        $certificat->signature_icr = $request->signature_icr;
        $certificat->signature_chauffeur = $request->signature_chauffeur;
        $certificat->statut = 'signe';
        $certificat->save();

        // Mettre à jour la mission
        $mission = $certificat->mission;
        $mission->date_debut = now();
        $mission->statut = 'en_cours';
        $mission->save();

        return response()->json([
            'message' => 'Certificat signé, mission en cours',
            'certificat' => $certificat
        ]);
    }

    // 19. Générer le PDF du certificat
    public function genererPdfCertificat($id_certificat)
    {
        $certificat = Certificat::with(['mission.bon', 'mission.chauffeur.user', 'mission.livraisons.station'])
            ->findOrFail($id_certificat);

        // Logique de génération PDF à implémenter
        // $pdf = PDF::loadView('certificats.show', compact('certificat'));
        // $path = storage_path('app/certificats/certificat_' . $certificat->id_certificat . '.pdf');
        // $pdf->save($path);
        
        // $certificat->contenu_pdf = $path;
        // $certificat->save();

        return response()->json([
            'message' => 'PDF généré',
            'certificat' => $certificat
        ]);
    }

    // ==============================================
    // 🔹 SUIVI GPS
    // ==============================================

    // 20. Suivre la géolocalisation d'un camion
    public function suivreGps($id_mission)
    {
        $mission = Mission::with('camion')->findOrFail($id_mission);
        
        // Logique d'intégration GPS
        // $position = GpsService::getPosition($mission->camion->immatriculation);
        
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

    // ==============================================
    // 🔹 PROFIL
    // ==============================================

    // 21. Voir le profil
    public function profil($id_icr)
    {
        $icr = Icr::with(['user', 'gerants', 'chauffeurs', 'missions'])->findOrFail($id_icr);
        return response()->json($icr);
    }

    // 22. Tableau de bord ICR
    public function dashboard($id_icr)
    {
        $icr = Icr::with(['missions' => function($q) {
            $q->where('statut', 'en_cours');
        }, 'bons' => function($q) {
            $q->whereNotIn('statut', ['termine', 'annule']);
        }])->findOrFail($id_icr);

        return response()->json([
            'icr' => [
                'id' => $icr->id_icr,
                'nom' => $icr->nom_complet
            ],
            'statistiques' => [
                'nb_gerants' => $icr->gerants->count(),
                'nb_chauffeurs' => $icr->chauffeurs->count(),
                'nb_missions_en_cours' => $icr->missionsEnCours,
                'nb_bons_en_attente' => $icr->bons->count()
            ]
        ]);
    }
}