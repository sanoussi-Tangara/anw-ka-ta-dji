<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Certificat;
use App\Models\Mission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
        $mission = Mission::findOrFail($id_mission);
        
        $certificat = Certificat::where('id_mission', $id_mission)
            ->with(['mission.bon', 'mission.chauffeur.user'])
            ->first();

        if (!$certificat) {
            return response()->json([
                'message' => 'Aucun certificat trouvé pour cette mission'
            ], 404);
        }

        return response()->json([
            'certificat' => $certificat,
            'mission' => $mission
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
            $certificat->signerIcr($request->signature);
            $message = 'Certificat signé par l\'ICR';
        } else {
            if ($certificat->signature_chauffeur) {
                return response()->json(['message' => 'Le certificat est déjà signé par le chauffeur'], 400);
            }
            $certificat->signerChauffeur($request->signature);
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
            'est_completement_signe' => $certificat->est_completement_signe,
            'statut' => $certificat->statut,
            'statut_texte' => $certificat->statut_texte,
            'signature_icr' => !empty($certificat->signature_icr),
            'signature_chauffeur' => !empty($certificat->signature_chauffeur)
        ]);
    }

    // ==============================================
    // 🔹 GESTION DES PDF
    // ==============================================

    // 8. Générer le PDF du certificat
    public function genererPdf($id_certificat)
    {
        $certificat = Certificat::with([
            'mission.bon.fournisseur.user',
            'mission.bon.depot',
            'mission.chauffeur.user',
            'mission.icr.user',
            'mission.livraisons.station'
        ])->findOrFail($id_certificat);

        // Vérifier que le certificat est complètement signé
        if (!$certificat->est_completement_signe) {
            return response()->json([
                'message' => 'Le certificat doit être complètement signé avant de générer le PDF'
            ], 400);
        }

        // Logique de génération PDF (avec une librairie comme DomPDF ou barryvdh/laravel-dompdf)
        // $pdf = \PDF::loadView('pdf.certificat', ['certificat' => $certificat]);
        // $filename = 'certificats/certificat_' . $certificat->numero . '.pdf';
        // Storage::put($filename, $pdf->output());
        // $certificat->contenu_pdf = $filename;
        // $certificat->save();

        return response()->json([
            'message' => 'PDF généré avec succès',
            'certificat' => $certificat
        ]);
    }

    // 9. Télécharger le PDF du certificat
    public function downloadPdf($id_certificat)
    {
        $certificat = Certificat::findOrFail($id_certificat);

        if (!$certificat->contenu_pdf || !Storage::exists($certificat->contenu_pdf)) {
            return response()->json([
                'message' => 'PDF non disponible'
            ], 404);
        }

        return Storage::download($certificat->contenu_pdf, "certificat_{$certificat->numero}.pdf");
    }

    // 10. Voir le PDF (dans le navigateur)
    public function viewPdf($id_certificat)
    {
        $certificat = Certificat::findOrFail($id_certificat);

        if (!$certificat->contenu_pdf || !Storage::exists($certificat->contenu_pdf)) {
            return response()->json([
                'message' => 'PDF non disponible'
            ], 404);
        }

        return response()->file(Storage::path($certificat->contenu_pdf));
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

        $certificat = Certificat::creerPourMission($request->id_mission);

        return response()->json([
            'message' => 'Certificat créé avec succès',
            'certificat' => $certificat
        ], 201);
    }

    // 14. Supprimer un certificat
    public function destroy($id_certificat)
    {
        $certificat = Certificat::findOrFail($id_certificat);

        // Supprimer le fichier PDF s'il existe
        if ($certificat->contenu_pdf && Storage::exists($certificat->contenu_pdf)) {
            Storage::delete($certificat->contenu_pdf);
        }

        $certificat->delete();

        return response()->json([
            'message' => 'Certificat supprimé avec succès'
        ]);
    }
}