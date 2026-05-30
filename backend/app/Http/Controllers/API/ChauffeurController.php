<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Chauffeur;
use App\Models\User;
use App\Models\Mission;
use App\Models\Livraison;
use App\Models\Alerte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ChauffeurController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES COMPTES (PAR ICR)
    // ==============================================

    // 1. Créer un chauffeur (par ICR)
    public function creer(Request $request)
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
            // Créer l'utilisateur
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password ?? 'default123'),
                'telephone' => $request->telephone,
                'role' => 'chauffeur',
                'permis' => $request->permis
            ]);

            // Créer le chauffeur
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

    // 2. Voir le profil du chauffeur
    public function profil($id_chauffeur)
    {
        $chauffeur = Chauffeur::with(['user', 'icr.user', 'camion'])->findOrFail($id_chauffeur);
        return response()->json($chauffeur);
    }

    // ==============================================
    // 🔹 GESTION DES MISSIONS
    // ==============================================

    // 3. Voir les missions du chauffeur
    public function voirMissions($id_chauffeur)
    {
        $missions = Mission::where('id_chauffeur', $id_chauffeur)
            ->with(['bon', 'livraisons.station', 'certificat'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['missions' => $missions]);
    }

    // 4. Voir la mission en cours
public function missionEnCours($id_chauffeur)
{
    $chauffeur = Chauffeur::findOrFail($id_chauffeur);
    
    $mission = Mission::where('id_chauffeur', $chauffeur->id_chauffeur)
        ->whereIn('statut', ['planifiee', 'en_cours'])
        ->with([
            'bon.depot',
            'bon.fournisseur',
            'camion',
            'livraisons.station',
            'certificat'  // ← Important pour le certificat
        ])
        ->first();
    
    if (!$mission) {
        return response()->json([
            'has_mission' => false,
            'mission' => null
        ], 200);
    }

    // Log pour debug
    \Log::info('Certificat trouvé: ' . ($mission->certificat ? 'oui' : 'non'));
    if ($mission->certificat) {
        \Log::info('Signature ICR: ' . ($mission->certificat->signature_icr ? 'oui' : 'non'));
        \Log::info('Signature Chauffeur: ' . ($mission->certificat->signature_chauffeur ? 'oui' : 'non'));
    }

    return response()->json([
        'has_mission' => true,
        'mission' => [
            'id_mission' => $mission->id_mission,
            'statut' => $mission->statut,
            'date_debut' => $mission->date_debut,
            'date_depart' => $mission->date_depart,
            'bon' => [
                'id_bon' => $mission->bon->id_bon,
                'code_verification' => $mission->bon->code_verification,
                'type_carburant' => $mission->bon->type_carburant,
                'quantite_commandee' => $mission->bon->quantite_commandee,
                'quantite_chargee' => $mission->bon->quantite_chargee,
                'depot' => $mission->bon->depot ? [
                    'nom' => $mission->bon->depot->nom,
                    'localisation' => $mission->bon->depot->localisation
                ] : null
            ],
            'camion' => [
                'id_camion' => $mission->camion->id_camion,
                'immatriculation' => $mission->camion->immatriculation,
                'capacite' => $mission->camion->capacite,
                'type_carburant' => $mission->camion->type_carburant
            ],
            'livraisons' => $mission->livraisons->map(function($livraison) {
                return [
                    'id_livraison' => $livraison->id_livraison,
                    'quantite_prevue' => $livraison->quantite_prevue,
                    'quantite_livree' => $livraison->quantite_livree,
                    'code_validation' => $livraison->code_validation,
                    'statut' => $livraison->statut,
                    'date_livraison' => $livraison->date_livraison,
                    'station' => [
                        'id_station' => $livraison->station->id_station,
                        'nom' => $livraison->station->nom,
                        'adresse' => $livraison->station->adresse,
                        'latitude' => $livraison->station->latitude,
                        'longitude' => $livraison->station->longitude
                    ]
                ];
            }),
            'certificat' => $mission->certificat ? [
                'id_certificat' => $mission->certificat->id_certificat,
                'signature_icr' => $mission->certificat->signature_icr,
                'signature_chauffeur' => $mission->certificat->signature_chauffeur,
                'est_signe_icr' => !empty($mission->certificat->signature_icr),
                'est_signe_chauffeur' => !empty($mission->certificat->signature_chauffeur),
                'est_complet' => !empty($mission->certificat->signature_icr) && !empty($mission->certificat->signature_chauffeur)
            ] : null  // ← S'assurer que c'est null si pas de certificat
        ]
    ]);
}

    // 5. Démarrer la mission (activer GPS)
    public function demarrerMission($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);

        if ($mission->statut !== 'planifiee') {
            return response()->json(['message' => 'Mission non démarrable'], 400);
        }

        $mission->statut = 'en_cours';
        $mission->date_debut = now();
        $mission->save();

        return response()->json([
            'message' => 'Mission démarrée',
            'mission' => $mission
        ]);
    }

    // 6. Terminer la mission
    public function terminerMission($id_mission)
    {
        $mission = Mission::findOrFail($id_mission);

        if ($mission->statut !== 'en_cours') {
            return response()->json(['message' => 'Mission non terminable'], 400);
        }

        // Vérifier que toutes les livraisons sont validées
        $livraisonsNonValidees = $mission->livraisons()
            ->where('statut', '!=', 'validee')
            ->count();

        if ($livraisonsNonValidees > 0) {
            return response()->json([
                'message' => 'Toutes les livraisons doivent être validées',
                'livraisons_restantes' => $livraisonsNonValidees
            ], 400);
        }

        $mission->statut = 'terminee';
        $mission->date_fin = now();
        $mission->save();

        return response()->json([
            'message' => 'Mission terminée avec succès',
            'mission' => $mission
        ]);
    }

    // ==============================================
    // 🔹 SIGNATURE DU CERTIFICAT
    // ==============================================

    // 7. Signer le certificat de transport
  public function signerCertificat(Request $request)
{
    $request->validate([
        'id_mission' => 'required|exists:missions,id_mission',
        'signature' => 'required|string'
    ]);

    $mission = Mission::findOrFail($request->id_mission);
    $certificat = $mission->certificat;

    if (!$certificat) {
        return response()->json(['message' => 'Aucun certificat trouvé'], 404);
    }

    $certificat->signature_chauffeur = $request->signature;
    $certificat->save();

    return response()->json([
        'message' => 'Certificat signé avec succès',
        'certificat' => $certificat
    ]);
}

    // ==============================================
    // 🔹 GESTION DES LIVRAISONS
    // ==============================================

    // 8. Valider une livraison avec le gérant
    public function validerLivraison(Request $request)
    {
        $request->validate([
            'id_livraison' => 'required|exists:livraisons,id_livraison',
            'code_validation' => 'required|string|size:4',
            'quantite_livree' => 'required|numeric|min:0',
            'signature_gerant' => 'required|string',
            'signature_chauffeur' => 'required|string',
            'photo_compteur' => 'nullable|string'
        ]);

        $livraison = Livraison::findOrFail($request->id_livraison);

        // Vérifier le code
        if ($livraison->code_validation !== $request->code_validation) {
            return response()->json(['message' => 'Code de validation incorrect'], 400);
        }

        // Vérifier que la livraison n'est pas déjà validée
        if ($livraison->statut === 'validee') {
            return response()->json(['message' => 'Livraison déjà validée'], 400);
        }

        // Enregistrer la livraison
        $livraison->quantite_livree = $request->quantite_livree;
        $livraison->date_livraison = now();
        $livraison->signature_gerant = $request->signature_gerant;
        $livraison->signature_chauffeur = $request->signature_chauffeur;
        $livraison->statut = 'validee';

        if ($request->has('photo_compteur')) {
            $livraison->photo_compteur = $request->photo_compteur;
        }

        $livraison->save();

        // Mettre à jour le stock de la station
        $stock = \App\Models\Stock::where('id_station', $livraison->id_station)
            ->where('type_carburant', $livraison->mission->bon->type_carburant)
            ->first();

        if ($stock) {
            $stock->quantite += $request->quantite_livree;
            $stock->date_mise_a_jour = now();
            $stock->save();
        }

        return response()->json([
            'message' => 'Livraison validée avec succès',
            'livraison' => $livraison
        ]);
    }

    // 9. Voir les livraisons à effectuer
    public function livraisonsAEffectuer($id_chauffeur)
    {
        $mission = Mission::where('id_chauffeur', $id_chauffeur)
            ->where('statut', 'en_cours')
            ->first();

        if (!$mission) {
            return response()->json(['message' => 'Aucune mission en cours'], 404);
        }

        $livraisons = Livraison::where('id_mission', $mission->id_mission)
            ->where('statut', 'en_attente')
            ->with('station')
            ->get();

        return response()->json([
            'mission' => $mission->id_mission,
            'livraisons' => $livraisons
        ]);
    }

    // 10. Voir l'historique des livraisons
    public function historiqueLivraisons($id_chauffeur)
    {
        $livraisons = Livraison::whereHas('mission', function($q) use ($id_chauffeur) {
                $q->where('id_chauffeur', $id_chauffeur);
            })
            ->with(['station', 'mission'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['livraisons' => $livraisons]);
    }

    // ==============================================
    // 🔹 SIGNALEMENT D'INCIDENTS
    // ==============================================

    // 11. Signaler un incident
    public function signalerIncident(Request $request)
    {
        $request->validate([
            'id_chauffeur' => 'required|exists:chauffeurs,id_chauffeur',
            'type' => 'required|in:panne,retard,accident,autre',
            'message' => 'required|string|min:5',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        $chauffeur = Chauffeur::findOrFail($request->id_chauffeur);
        $mission = $chauffeur->mission_en_cours;

        // Créer une alerte pour l'ICR
        $alerte = Alerte::create([
            'type' => 'incident_chauffeur',
            'message' => "Incident ({$request->type}): {$request->message}",
            'date_creation' => now(),
            'statut' => 'non_lue',
            'id_destinataire' => $chauffeur->icr->user->id_utilisateur,
            'id_chauffeur' => $request->id_chauffeur,
            'id_mission' => $mission ? $mission->id_mission : null
        ]);

        // Si c'est une panne, marquer le camion comme en panne
        if ($request->type === 'panne' && $chauffeur->camion) {
            $chauffeur->camion->statut = 'en_panne';
            $chauffeur->camion->save();
        }

        return response()->json([
            'message' => 'Incident signalé à l\'ICR',
            'alerte' => $alerte
        ], 201);
    }

    // ==============================================
    // 🔹 INFORMATIONS DE MISSION
    // ==============================================

    // 12. Voir le détail de la mission (itinéraire, quantités)
    public function detailsMission($id_mission)
    {
        $mission = Mission::with([
            'bon.depot',
            'livraisons.station',
            'chauffeur.user',
            'camion'
        ])->findOrFail($id_mission);

        // Vérifier que le chauffeur est bien celui de la mission
        // (à faire avec l'authentification)

        $details = [
            'mission' => [
                'id' => $mission->id_mission,
                'statut' => $mission->statut,
                'date_debut' => $mission->date_debut,
                'date_fin' => $mission->date_fin
            ],
            'point_depart' => [
                'depot' => $mission->bon->depot->nom,
                'adresse' => $mission->bon->depot->localisation
            ],
            'camion' => [
                'immatriculation' => $mission->camion->immatriculation,
                'type_carburant' => $mission->camion->type_carburant,
                'capacite' => $mission->camion->capacite
            ],
            'carburant' => [
                'type' => $mission->bon->type_carburant,
                'quantite_totale' => $mission->bon->quantite_chargee ?? $mission->bon->quantite_commandee
            ],
            'livraisons' => $mission->livraisons->map(function($livraison) {
                return [
                    'station' => $livraison->station->nom,
                    'adresse' => $livraison->station->adresse,
                    'quantite_prevue' => $livraison->quantite_prevue,
                    'quantite_livree' => $livraison->quantite_livree,
                    'code_validation' => $livraison->code_validation,
                    'statut' => $livraison->statut,
                    'date_livraison' => $livraison->date_livraison
                ];
            })
        ];

        return response()->json($details);
    }

    // ==============================================
    // 🔹 PROFIL (suite)
    // ==============================================

    // 13. Modifier le profil
    public function updateProfil(Request $request, $id_chauffeur)
    {
        $chauffeur = Chauffeur::findOrFail($id_chauffeur);
        $user = $chauffeur->user;

        $request->validate([
            'nom' => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur'
        ]);

        if ($request->has('nom')) $user->nom = $request->nom;
        if ($request->has('prenom')) $user->prenom = $request->prenom;
        if ($request->has('telephone')) $user->telephone = $request->telephone;
        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour',
            'chauffeur' => $chauffeur->fresh('user')
        ]);
    }

    // 14. Tableau de bord chauffeur
    public function dashboard($id_chauffeur)
    {
        $chauffeur = Chauffeur::with(['user', 'camion'])->findOrFail($id_chauffeur);
        
        $missionEnCours = $chauffeur->mission_en_cours;
        $missionsTerminees = $chauffeur->missionsTerminees;
        $livraisonsEffectuees = $chauffeur->livraisons()->where('statut', 'validee')->count();

        return response()->json([
            'chauffeur' => [
                'id' => $chauffeur->id_chauffeur,
                'nom' => $chauffeur->nom_complet
            ],
            'statistiques' => [
                'mission_en_cours' => $missionEnCours ? [
                    'id' => $missionEnCours->id_mission,
                    'progression' => $missionEnCours->livraisons()->where('statut', 'validee')->count() . '/' . $missionEnCours->livraisons()->count()
                ] : null,
                'missions_terminees' => $missionsTerminees,
                'livraisons_effectuees' => $livraisonsEffectuees
            ],
            'camion' => $chauffeur->camion ? [
                'immatriculation' => $chauffeur->camion->immatriculation,
                'statut' => $chauffeur->camion->statut
            ] : null
        ]);
    }
}