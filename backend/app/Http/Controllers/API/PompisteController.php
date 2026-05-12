<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Vente;
use App\Models\Stock;
use Illuminate\Http\Request;

class PompisteController extends Controller
{
    // 🔹 1. Saisir une vente (avec encaissement direct)
    public function saisirVente(Request $request)
    {
        $request->validate([
            'id_pompiste' => 'required|exists:pompistes,id_pompiste',
            'id_station' => 'required|exists:stations,id_station',
            'quantite' => 'required|numeric|min:0.1',
            'type_carburant' => 'required|in:essence,gasoil',
            'mode_paiement' => 'required|in:especes,orange_money,mobicash,wave'
        ]);

        // Prix unitaire (à configurer)
        $prix = $request->type_carburant === 'essence' ? 750 : 700;
        $montant = $request->quantite * $prix;

        // Créer la vente
        $vente = Vente::create([
            'id_pompiste' => $request->id_pompiste,
            'id_station' => $request->id_station,
            'type_carburant' => $request->type_carburant,
            'quantite' => $request->quantite,
            'montant_total' => $montant,
            'mode_paiement' => $request->mode_paiement,
            'date_vente' => now()
        ]);

        // Mettre à jour le stock
        $stock = Stock::where('id_station', $request->id_station)
            ->where('type_carburant', $request->type_carburant)
            ->first();

        if ($stock) {
            $stock->quantite -= $request->quantite;
            $stock->date_mise_a_jour = now();
            $stock->save();
        }

        return response()->json([
            'message' => 'Vente enregistrée avec succès',
            'vente' => $vente
        ], 201);
    }

    // 🔹 2. Voir le stock de la station
    public function voirStock(Request $request)
    {
        $request->validate([
            'id_station' => 'required|exists:stations,id_station'
        ]);

        $stocks = Stock::where('id_station', $request->id_station)->get();

        return response()->json([
            'stocks' => $stocks
        ]);
    }

    // 🔹 3. Clôture de caisse
    public function clotureCaisse(Request $request)
    {
        $request->validate([
            'id_pompiste' => 'required|exists:pompistes,id_pompiste',
            'date' => 'nullable|date'
        ]);

        $date = $request->date ?? date('Y-m-d');

        $ventes = Vente::where('id_pompiste', $request->id_pompiste)
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
            'id_pompiste' => $request->id_pompiste,
            'nombre_ventes' => $nombreVentes,
            'total_ventes' => $totalVentes,
            'detail_par_mode' => $parMode
        ]);
    }

    // 🔹 4. Historique des ventes du pompiste
    public function historiqueVentes(Request $request)
    {
        $request->validate([
            'id_pompiste' => 'required|exists:pompistes,id_pompiste'
        ]);

        $ventes = Vente::where('id_pompiste', $request->id_pompiste)
            ->orderBy('date_vente', 'desc')
            ->get();

        return response()->json([
            'ventes' => $ventes
        ]);
    }
}