<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Certificat;
use App\Models\Mission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificatController extends Controller
{
    // ==============================================
    // 🔹 RÉCUPÉRATION DES CERTIFICATS
    // ==============================================

    // 1. Lister tous les certificats
    public function index()
    {
        $certificats = Certificat::with(['mission.bon', 'mission.chauffeur.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'certificats' => $certificats,
            'count' => $certificats->count()
        ]);
    }

    // 2. Voir le détail d'un certificat
    public function show($id_certificat)
    {
        $certificat = Certificat::with([
            'mission.bon.fournisseur.user',
            'mission.bon.depot',
            'mission.chauffeur.user',
            'mission.icr.user',
            'mission.livraisons.station'
        ])->findOrFail($id_certificat);

        return response()->json([
            'certificat' => $certificat
        ]);
    }

    // 3. Récupérer le certificat d'une mission
    public function getByMission($id_mission)
    {
        $mission = Mission::with([
            'bon.fournisseur.user',
            'bon.depot',
            'chauffeur.user',
            'icr.user',
            'camion',
            'livraisons.station.gerant.user'
        ])->findOrFail($id_mission);
        
        $certificat = Certificat::where('id_mission', $id_mission)->first();

        // Calculer le total des quantités
        $total_quantite_prevue = $mission->livraisons->sum('quantite_prevue');
        $total_quantite_livree = $mission->livraisons->sum('quantite_livree');

        // Retourner toutes les informations
        return response()->json([
            'certificat' => $certificat,
            'mission' => [
                'id_mission' => $mission->id_mission,
                'statut' => $mission->statut,
                'date_debut' => $mission->date_debut,
                'date_fin' => $mission->date_fin,
                'date_depart' => $mission->date_depart,
                'date_arrivee_reelle' => $mission->date_arrivee_reelle,
            ],
            'bon' => [
                'id_bon' => $mission->bon->id_bon,
                'code_verification' => $mission->bon->code_verification,
                'type_carburant' => $mission->bon->type_carburant,
                'quantite_commandee' => $mission->bon->quantite_commandee,
                'quantite_chargee' => $mission->bon->quantite_chargee,
                'date_disponibilite' => $mission->bon->date_disponibilite,
                'statut' => $mission->bon->statut,
                'fournisseur' => $mission->bon->fournisseur ? [
                    'nom_societe' => $mission->bon->fournisseur->nom_societe,
                    'adresse' => $mission->bon->fournisseur->adresse,
                    'telephone' => $mission->bon->fournisseur->telephone,
                ] : null,
                'depot' => $mission->bon->depot ? [
                    'nom' => $mission->bon->depot->nom,
                    'localisation' => $mission->bon->depot->localisation,
                ] : null,
            ],
            'icr' => [
                'id_icr' => $mission->icr->id_icr,
                'nom' => $mission->icr->user->nom ?? '',
                'prenom' => $mission->icr->user->prenom ?? '',
                'email' => $mission->icr->user->email ?? '',
                'telephone' => $mission->icr->user->telephone ?? '',
                'matricule' => $mission->icr->matricule ?? '',
            ],
            'chauffeur' => [
                'id_chauffeur' => $mission->chauffeur->id_chauffeur,
                'nom' => $mission->chauffeur->user->nom ?? '',
                'prenom' => $mission->chauffeur->user->prenom ?? '',
                'email' => $mission->chauffeur->user->email ?? '',
                'telephone' => $mission->chauffeur->user->telephone ?? '',
                'permis' => $mission->chauffeur->permis,
            ],
            'camion' => [
                'id_camion' => $mission->camion->id_camion,
                'immatriculation' => $mission->camion->immatriculation,
                'capacite' => $mission->camion->capacite,
                'type_carburant' => $mission->camion->type_carburant,
                'statut' => $mission->camion->statut,
            ],
            'livraisons' => $mission->livraisons->map(function($livraison) {
                return [
                    'id_livraison' => $livraison->id_livraison,
                    'quantite_prevue' => $livraison->quantite_prevue,
                    'quantite_livree' => $livraison->quantite_livree,
                    'code_validation' => $livraison->code_validation,
                    'date_livraison' => $livraison->date_livraison,
                    'statut' => $livraison->statut,
                    'signature_gerant' => $livraison->signature_gerant,
                    'signature_chauffeur' => $livraison->signature_chauffeur,
                    'photo_compteur' => $livraison->photo_compteur,
                    'station' => [
                        'id_station' => $livraison->station->id_station,
                        'nom' => $livraison->station->nom,
                        'adresse' => $livraison->station->adresse,
                        'latitude' => $livraison->station->latitude,
                        'longitude' => $livraison->station->longitude,
                        'gerant' => $livraison->station->gerant ? [
                            'nom' => $livraison->station->gerant->user->nom ?? '',
                            'prenom' => $livraison->station->gerant->user->prenom ?? '',
                            'telephone' => $livraison->station->gerant->user->telephone ?? '',
                        ] : null,
                    ],
                ];
            }),
            'totaux' => [
                'quantite_totale_commandee' => $mission->bon->quantite_commandee,
                'quantite_totale_prevue' => $total_quantite_prevue,
                'quantite_totale_livree' => $total_quantite_livree,
                'nombre_livraisons' => $mission->livraisons->count(),
                'livraisons_effectuees' => $mission->livraisons->where('statut', 'validee')->count(),
            ],
            'signatures' => [
                'signature_icr' => $certificat ? $certificat->signature_icr : null,
                'signature_chauffeur' => $certificat ? $certificat->signature_chauffeur : null,
                'icr_signe' => $certificat && !empty($certificat->signature_icr),
                'chauffeur_signe' => $certificat && !empty($certificat->signature_chauffeur),
                'certificat_complet' => $certificat && !empty($certificat->signature_icr) && !empty($certificat->signature_chauffeur),
            ]
        ]);
    }

    // 4. Récupérer les certificats non signés
    public function nonSignes()
    {
        $certificats = Certificat::whereNull('signature_icr')
            ->orWhereNull('signature_chauffeur')
            ->with(['mission.bon', 'mission.chauffeur.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'certificats' => $certificats,
            'count' => $certificats->count()
        ]);
    }

    // 5. Récupérer les certificats complètement signés
    public function completementSignes()
    {
        $certificats = Certificat::whereNotNull('signature_icr')
            ->whereNotNull('signature_chauffeur')
            ->with(['mission.bon', 'mission.chauffeur.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'certificats' => $certificats,
            'count' => $certificats->count()
        ]);
    }

    // ==============================================
    // 🔹 SIGNATURES
    // ==============================================

    // 6. Signer le certificat (ICR ou Chauffeur)
    public function signer(Request $request, $id_certificat)
    {
        $request->validate([
            'signature' => 'required|string',
            'signataire' => 'required|in:icr,chauffeur'
        ]);

        $certificat = Certificat::findOrFail($id_certificat);

        if ($request->signataire === 'icr') {
            if ($certificat->signature_icr) {
                return response()->json(['message' => 'Le certificat est déjà signé par l\'ICR'], 400);
            }
            $certificat->signature_icr = $request->signature;
            $certificat->save();
            $message = 'Certificat signé par l\'ICR';
        } else {
            if ($certificat->signature_chauffeur) {
                return response()->json(['message' => 'Le certificat est déjà signé par le chauffeur'], 400);
            }
            
            // Vérifier que l'ICR a déjà signé
            if (empty($certificat->signature_icr)) {
                return response()->json(['message' => 'L\'ICR doit d\'abord signer le certificat'], 400);
            }
            
            $certificat->signature_chauffeur = $request->signature;
            $certificat->save();
            $message = 'Certificat signé par le chauffeur';
        }

        return response()->json([
            'message' => $message,
            'certificat' => $certificat
        ]);
    }

    // 7. Vérifier si le certificat est complètement signé
    public function checkSignature($id_certificat)
    {
        $certificat = Certificat::findOrFail($id_certificat);

        return response()->json([
            'est_completement_signe' => !empty($certificat->signature_icr) && !empty($certificat->signature_chauffeur),
            'signature_icr' => !empty($certificat->signature_icr),
            'signature_chauffeur' => !empty($certificat->signature_chauffeur)
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES PDF - CORRIGÉ
    // ==============================================

    // 8. Télécharger le PDF du certificat - VERSION CORRIGÉE
  // app/Http/Controllers/API/CertificatController.php

public function downloadPdf($id_certificat)
{
    try {
        // ✅ Vérifier l'authentification
        if (!auth()->check()) {
            return response()->json([
                'message' => 'Non authentifié. Veuillez vous connecter.'
            ], 401);
        }

        // ✅ Récupérer le certificat
        $certificat = Certificat::with([
            'mission.bon.fournisseur',
            'mission.bon.depot',
            'mission.chauffeur.user',
            'mission.icr.user',
            'mission.camion',
            'mission.livraisons.station'
        ])->find($id_certificat);

        if (!$certificat) {
            return response()->json([
                'message' => 'Certificat non trouvé'
            ], 404);
        }

        // ✅ Vérifier que les signatures existent
        if (empty($certificat->signature_icr) || empty($certificat->signature_chauffeur)) {
            return response()->json([
                'message' => 'Le certificat n\'est pas encore complètement signé'
            ], 400);
        }

        $mission = $certificat->mission;
        
        // ✅ Préparer les données
        $data = [
            'certificat' => $certificat,
            'mission' => $mission,
            'bon' => $mission->bon ?? null,
            'chauffeur' => $mission->chauffeur ?? null,
            'icr' => $mission->icr ?? null,
            'camion' => $mission->camion ?? null,
            'livraisons' => $mission->livraisons ?? [],
            'date_generation' => now()
        ];

        // ✅ Vérifier que DomPDF est installé
        if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
            return response()->json([
                'message' => 'DomPDF n\'est pas installé. Exécutez: composer require barryvdh/laravel-dompdf'
            ], 500);
        }

        // ✅ Générer le PDF
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.certificat', $data);
        
        // ✅ Retourner le PDF
        return $pdf->download("certificat_{$id_certificat}.pdf");

    } catch (\Exception $e) {
        \Log::error('Erreur téléchargement PDF: ' . $e->getMessage());
        \Log::error('Trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'message' => 'Erreur: ' . $e->getMessage()
        ], 500);
    }
}

    // 9. Générer le PDF du certificat (version simplifiée)
    public function genererPdf($id_certificat)
    {
        try {
            $certificat = Certificat::with([
                'mission.bon.fournisseur.user',
                'mission.bon.depot',
                'mission.chauffeur.user',
                'mission.icr.user',
                'mission.livraisons.station'
            ])->findOrFail($id_certificat);

            // Vérifier que le certificat est complètement signé
            if (empty($certificat->signature_icr) || empty($certificat->signature_chauffeur)) {
                return response()->json([
                    'message' => 'Le certificat doit être complètement signé avant de générer le PDF'
                ], 400);
            }

            $mission = $certificat->mission;
            
            $data = [
                'certificat' => $certificat,
                'mission' => $mission,
                'bon' => $mission->bon,
                'chauffeur' => $mission->chauffeur,
                'icr' => $mission->icr,
                'camion' => $mission->camion,
                'livraisons' => $mission->livraisons ?? [],
                'date_generation' => now()
            ];

            // Générer le PDF et le sauvegarder
            $pdf = Pdf::loadView('pdf.certificat', $data);
            $filename = 'certificats/certificat_' . $id_certificat . '.pdf';
            Storage::put($filename, $pdf->output());
            
            // Mettre à jour le chemin du PDF dans la base de données
            $certificat->contenu_pdf = $filename;
            $certificat->save();

            return response()->json([
                'message' => 'PDF généré avec succès',
                'certificat' => $certificat
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur génération PDF: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    // 10. Voir le PDF (dans le navigateur)
    public function viewPdf($id_certificat)
    {
        try {
            $certificat = Certificat::findOrFail($id_certificat);

            if (!$certificat->contenu_pdf || !Storage::exists($certificat->contenu_pdf)) {
                return response()->json([
                    'message' => 'PDF non disponible'
                ], 404);
            }

            return response()->file(Storage::path($certificat->contenu_pdf));

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==============================================
    // 🔹 STATISTIQUES
    // ==============================================

    // 11. Statistiques des certificats
    public function statistiques()
    {
        $total = Certificat::count();
        $nonSignes = Certificat::whereNull('signature_icr')
            ->orWhereNull('signature_chauffeur')
            ->count();
        $completementSignes = Certificat::whereNotNull('signature_icr')
            ->whereNotNull('signature_chauffeur')
            ->count();
        $avecPdf = Certificat::whereNotNull('contenu_pdf')->count();

        return response()->json([
            'total' => $total,
            'non_signes' => $nonSignes,
            'completement_signes' => $completementSignes,
            'avec_pdf' => $avecPdf,
            'taux_signature' => $total > 0 ? round(($completementSignes / $total) * 100, 2) : 0
        ]);
    }

    // 12. Dashboard des certificats
    public function dashboard()
    {
        $stats = [
            'total' => Certificat::count(),
            'non_signes' => Certificat::whereNull('signature_icr')->orWhereNull('signature_chauffeur')->count(),
            'signes_icr' => Certificat::whereNotNull('signature_icr')->count(),
            'signes_chauffeur' => Certificat::whereNotNull('signature_chauffeur')->count(),
            'completement_signes' => Certificat::whereNotNull('signature_icr')->whereNotNull('signature_chauffeur')->count(),
            'avec_pdf' => Certificat::whereNotNull('contenu_pdf')->count()
        ];

        $derniersCertificats = Certificat::with(['mission.bon', 'mission.chauffeur.user'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'statistiques' => $stats,
            'derniers_certificats' => $derniersCertificats
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES CERTIFICATS
    // ==============================================

    // 13. Créer un certificat pour une mission
    public function creerPourMission(Request $request)
    {
        $request->validate([
            'id_mission' => 'required|exists:missions,id_mission|unique:certificats,id_mission'
        ]);

        $certificat = Certificat::create([
            'id_mission' => $request->id_mission,
            'date_generation' => now(),
            'signature_icr' => null,
            'signature_chauffeur' => null
        ]);

        return response()->json([
            'message' => 'Certificat créé avec succès',
            'certificat' => $certificat
        ], 201);
    }

    // 14. Supprimer un certificat
    public function destroy($id_certificat)
    {
        try {
            $certificat = Certificat::findOrFail($id_certificat);

            // Supprimer le fichier PDF s'il existe
            if ($certificat->contenu_pdf && Storage::exists($certificat->contenu_pdf)) {
                Storage::delete($certificat->contenu_pdf);
            }

            $certificat->delete();

            return response()->json([
                'message' => 'Certificat supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==============================================
    // 🔹 SIGNATURES PAR MISSION
    // ==============================================

    // Signer par ICR (crée le certificat si nécessaire)
    public function signerParIcr(Request $request)
    {
        try {
            $request->validate([
                'id_mission' => 'required|exists:missions,id_mission',
                'signature_icr' => 'required|string'
            ]);

            $certificat = Certificat::where('id_mission', $request->id_mission)->first();
            
            if (!$certificat) {
                $certificat = Certificat::create([
                    'id_mission' => $request->id_mission,
                    'date_generation' => now(),
                    'signature_icr' => $request->signature_icr,
                    'signature_chauffeur' => null
                ]);
            } else {
                $certificat->signature_icr = $request->signature_icr;
                $certificat->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Signature ICR enregistrée',
                'certificat' => $certificat,
                'attend_signature_chauffeur' => true
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    // Signer par Chauffeur (met à jour le certificat existant)
    public function signerParChauffeur(Request $request)
    {
        try {
            $request->validate([
                'id_mission' => 'required|exists:missions,id_mission',
                'signature_chauffeur' => 'required|string'
            ]);

            $certificat = Certificat::where('id_mission', $request->id_mission)->first();
            
            if (!$certificat) {
                return response()->json([
                    'message' => 'L\'ICR doit d\'abord signer le certificat'
                ], 400);
            }

            if (empty($certificat->signature_icr)) {
                return response()->json([
                    'message' => 'L\'ICR doit signer avant le chauffeur'
                ], 400);
            }

            $certificat->signature_chauffeur = $request->signature_chauffeur;
            $certificat->save();

            return response()->json([
                'success' => true,
                'message' => 'Certificat complètement signé !',
                'certificat' => $certificat,
                'completement_signe' => true
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    // Vérifier le statut de signature d'une mission
    public function getStatutSignature($id_mission)
    {
        try {
            $certificat = Certificat::where('id_mission', $id_mission)->first();
            
            if (!$certificat) {
                return response()->json(['statut' => 'non_cree']);
            }
            
            return response()->json([
                'signature_icr' => !empty($certificat->signature_icr),
                'signature_chauffeur' => !empty($certificat->signature_chauffeur),
                'statut' => ($certificat->signature_icr && $certificat->signature_chauffeur) ? 'complet' : 'en_attente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    
}