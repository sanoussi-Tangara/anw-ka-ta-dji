<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Bon;
use Illuminate\Http\Request;

class BonController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Lister les bons (avec filtres)
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Bon::with(['fournisseur.user', 'icr.user', 'depot']);

        // Filtrer par rôle
        if ($user->isFournisseur()) {
            $query->where('id_fournisseur', $user->fournisseur->id_fournisseur);
        } elseif ($user->isIcr()) {
            $query->where('id_icr', $user->icr->id_icr);
        } elseif ($user->isResponsableDepot()) {
            $depot = $user->responsableDepot->depot;
            if ($depot) {
                $query->where('id_depot', $depot->id_depot);
            }
        }

        // Filtres supplémentaires
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('type_carburant')) {
            $query->where('type_carburant', $request->type_carburant);
        }

        if ($request->has('date_debut')) {
            $query->whereDate('date_creation', '>=', $request->date_debut);
        }

        if ($request->has('date_fin')) {
            $query->whereDate('date_creation', '<=', $request->date_fin);
        }

        $bons = $query->orderBy('date_creation', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'bons' => $bons,
            'total' => $bons->total(),
            'filtres' => $request->all()
        ]);
    }

    /**
     * Voir le détail d'un bon
     */
    public function show($id)
    {
        $bon = Bon::with(['fournisseur.user', 'icr.user', 'depot'])
            ->findOrFail($id);

        // Vérifier les droits d'accès
        $user = auth()->user();

        if ($user->isFournisseur()) {
            if ($bon->id_fournisseur !== $user->fournisseur->id_fournisseur) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
        } elseif ($user->isIcr()) {
            if ($bon->id_icr !== $user->icr->id_icr) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
        } elseif ($user->isResponsableDepot()) {
            $depot = $user->responsableDepot->depot;
            if (!$depot || $bon->id_depot !== $depot->id_depot) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
        } elseif (!$user->isManager() && !$user->isAdmin()) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Calcul de la progression
        $progression = match($bon->statut) {
            'termine' => 100,
            'en_cours' => 75,
            'signe' => 50,
            'cree' => 25,
            'annule' => 0,
            default => 10
        };

        return response()->json([
            'bon' => $bon,
            'progression' => $progression,
            'peut_etre_annule' => in_array($bon->statut, ['cree', 'signe']),
            'peut_etre_signe' => $bon->statut === 'cree' && $user->isFournisseur(),
            'peut_etre_transmis' => $bon->statut === 'signe' && $user->isFournisseur()
        ]);
    }

    /**
     * Statistiques des bons pour l'utilisateur connecté
     */
    public function statistiques()
    {
        $user = auth()->user();
        $query = Bon::query();

        if ($user->isFournisseur()) {
            $query->where('id_fournisseur', $user->fournisseur->id_fournisseur);
        } elseif ($user->isIcr()) {
            $query->where('id_icr', $user->icr->id_icr);
        } elseif ($user->isResponsableDepot()) {
            $depot = $user->responsableDepot->depot;
            if ($depot) {
                $query->where('id_depot', $depot->id_depot);
            }
        }

        $stats = [
            'total' => (clone $query)->count(),
            'cree' => (clone $query)->where('statut', 'cree')->count(),
            'signe' => (clone $query)->where('statut', 'signe')->count(),
            'en_cours' => (clone $query)->where('statut', 'en_cours')->count(),
            'termine' => (clone $query)->where('statut', 'termine')->count(),
            'annule' => (clone $query)->where('statut', 'annule')->count(),
            'quantite_totale_commandee' => (clone $query)->sum('quantite_commandee'),
            'quantite_totale_chargee' => (clone $query)->whereNotNull('quantite_chargee')->sum('quantite_chargee')
        ];

        return response()->json($stats);
    }

    /**
     * Exporter les bons en CSV
     */
    public function export(Request $request)
    {
        $user = auth()->user();
        $query = Bon::with(['fournisseur.user', 'icr.user', 'depot']);

        if ($user->isFournisseur()) {
            $query->where('id_fournisseur', $user->fournisseur->id_fournisseur);
        } elseif ($user->isIcr()) {
            $query->where('id_icr', $user->icr->id_icr);
        } elseif ($user->isResponsableDepot()) {
            $depot = $user->responsableDepot->depot;
            if ($depot) {
                $query->where('id_depot', $depot->id_depot);
            }
        }

        $bons = $query->orderBy('date_creation', 'desc')->get();

        $csvData = [];
        $csvData[] = ['ID', 'Code', 'Type', 'Quantité commandée', 'Quantité chargée', 'Statut', 'Date création', 'Date disponibilité'];

        foreach ($bons as $bon) {
            $csvData[] = [
                $bon->id_bon,
                $bon->code_verification,
                $bon->type_carburant === 'essence' ? 'Essence' : 'Gasoil',
                $bon->quantite_commandee,
                $bon->quantite_chargee ?? '-',
                $bon->statut,
                $bon->date_creation->format('d/m/Y H:i'),
                $bon->date_disponibilite->format('d/m/Y H:i')
            ];
        }

        $filename = 'bons_' . date('Y-m-d_His') . '.csv';
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
}