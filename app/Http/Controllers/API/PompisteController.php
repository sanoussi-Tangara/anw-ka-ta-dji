<?php

namespace App\Http\Controllers;

use App\Models\Vente;
use App\Models\Encaissement;
use App\Models\Stock;
use Illuminate\Http\Request;

class PompisteController extends Controller
{
    // 🔹 1. Saisir une vente
    public function saisirVente(Request $request)
    {
        $request->validate([
            'id_pompiste' => 'required|exists:pompistes,id_pompiste',
            'quantite' => 'required|numeric',
            'prix_unitaire' => 'required|numeric',
            'type_carburant' => 'required|in:essence,gasoil'
        ]);

        $montant = $request->quantite * $request->prix_unitaire;

        //  Enregistrement vente
        $vente = Vente::create([
            'id_pompiste' => $request->id_pompiste,
            'quantite' => $request->quantite,
            'prix_unitaire' => $request->prix_unitaire,
            'montant_total' => $montant,
            'type_carburant' => $request->type_carburant,
            'date_vente' => now()
        ]);

        //  Mise à jour du stock automatiquement
        $stock = Stock::where('type_carburant', $request->type_carburant)->first();

        if ($stock) {
            $stock->quantite -= $request->quantite;
            $stock->save();
        }

        return $vente;
    }

    //  2. Encaisser argent
    public function encaisser(Request $request)
    {
        $request->validate([
            'id_vente' => 'required|exists:ventes,id_vente',
            'montant' => 'required|numeric',
            'mode_paiement' => 'required'
        ]);

        return Encaissement::create([
            'id_vente' => $request->id_vente,
            'montant' => $request->montant,
            'mode_paiement' => $request->mode_paiement,
            'date_encaissement' => now()
        ]);
    }

    //  3. Voir le stock
    public function voirStock()
    {
        return Stock::all();
    }

    //  4. Clôture de caisse
    public function clotureCaisse($id_pompiste)
    {
        $totalVentes = Vente::where('id_pompiste', $id_pompiste)
                            ->sum('montant_total');

        $totalEncaisse = Encaissement::whereIn(
            'id_vente',
            Vente::where('id_pompiste', $id_pompiste)->pluck('id_vente')
        )->sum('montant');

        return [
            'total_ventes' => $totalVentes,
            'total_encaisse' => $totalEncaisse,
            'ecart' => $totalEncaisse - $totalVentes
        ];
    }
}