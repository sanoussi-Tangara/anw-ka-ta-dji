<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vente extends Model
{
    use HasFactory;

    protected $table = 'ventes';
    protected $primaryKey = 'id_vente';

    protected $fillable = [
        'id_pompiste',
        'id_station',
        'type_carburant',
        'quantite',
        'montant',        // ← Garde montant
        'montant_total',  // ← AJOUTE AUSSI CELUI-CI pour compatibilité
        'mode_paiement',
        'prix_unitaire',
        'date_vente',
        'periode'
    ];

    protected $casts = [
        'date_vente' => 'datetime',
        'quantite' => 'decimal:2',
        'montant' => 'decimal:2',
        'montant_total' => 'decimal:2'
    ];

    // ========== RELATIONS ==========

    public function pompiste()
    {
        return $this->belongsTo(Pompiste::class, 'id_pompiste', 'id_pompiste');
    }

    public function station()
    {
        return $this->belongsTo(Station::class, 'id_station', 'id_station');
    }

    // ========== ACCESSOIRS ==========

    public function getTypeCarburantTexteAttribute()
    {
        return $this->type_carburant === 'essence' ? 'Essence' : 'Gasoil';
    }

    public function getPrixUnitaireAttribute()
    {
        if ($this->quantite > 0) {
            $total = $this->montant_total ?? $this->montant ?? 0;
            return $total / $this->quantite;
        }
        return 0;
    }

    public function getTypeCarburantIconeAttribute()
    {
        return $this->type_carburant === 'essence' ? '⛽' : '🛢️';
    }

    // ========== MÉTHODES ==========

    public static function calculerMontant($type_carburant, $quantite)
    {
        // Récupérer les prix depuis le manager
        $manager = User::where('role', 'manager')->first();
        $prix = $type_carburant === 'essence' 
            ? ($manager->prix_essence ?? 750) 
            : ($manager->prix_gasoil ?? 700);
        return $quantite * $prix;
    }

    public static function creerVente($id_pompiste, $id_station, $type_carburant, $quantite, $mode_paiement = null)
    {
        $montant = self::calculerMontant($type_carburant, $quantite);
        
        $heure = now()->hour;
        $periode = match(true) {
            $heure >= 6 && $heure < 12 => '6h-12h',
            $heure >= 12 && $heure < 18 => '12h-18h',
            $heure >= 18 && $heure < 24 => '18h-00h',
            default => '00h-6h'
        };
        
        return self::create([
            'id_pompiste' => $id_pompiste,
            'id_station' => $id_station,
            'type_carburant' => $type_carburant,
            'quantite' => $quantite,
            'montant' => $montant,
            'montant_total' => $montant,
            'mode_paiement' => $mode_paiement,
            'date_vente' => now(),
            'periode' => $periode
        ]);
    }

    public function mettreAJourStock()
    {
        $stock = Stock::where('id_station', $this->id_station)
            ->where('type_carburant', $this->type_carburant)
            ->first();
        
        if ($stock) {
            $stock->quantite -= $this->quantite;
            $stock->date_mise_a_jour = now();
            $stock->save();
            
            if ($stock->quantite <= ($stock->seuil_alerte ?? 5000)) {
                $this->declencherAlerteStockFaible($stock->quantite);
            }
        }
    }

    private function declencherAlerteStockFaible($quantiteRestante)
    {
        $station = $this->station;
        $gerant = $station->gerant ?? null;
        
        if ($gerant && $gerant->user) {
            Alerte::create([
                'type' => 'stock_faible',
                'message' => "Stock faible à {$station->nom} : plus que {$quantiteRestante} litres de {$this->type_carburant}",
                'date_creation' => now(),
                'statut' => 'non_lue',
                'id_destinataire' => $gerant->user->id_utilisateur
            ]);
        }
    }
}