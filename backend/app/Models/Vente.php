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
        'type_carburant',
        'quantite',
        'montant',
        'date_vente',
        'periode',
        'id_pompiste',
        'id_station'
    ];

    protected $casts = [
        'date_vente' => 'datetime',
        'quantite' => 'decimal:2',
        'montant' => 'decimal:2'
    ];

    // ========== RELATIONS ==========

    // Pompiste qui a effectué la vente
    public function pompiste()
    {
        return $this->belongsTo(Pompiste::class, 'id_pompiste', 'id_pompiste');
    }

    // Station où la vente a eu lieu
    public function station()
    {
        return $this->belongsTo(Station::class, 'id_station', 'id_station');
    }

    // ========== ACCESSOIRS ==========

    // Type de carburant en texte lisible
    public function getTypeCarburantTexteAttribute()
    {
        return $this->type_carburant === 'essence' ? 'Essence' : 'Gasoil';
    }

    // Prix unitaire calculé
    public function getPrixUnitaireAttribute()
    {
        if ($this->quantite > 0) {
            return $this->montant / $this->quantite;
        }
        return 0;
    }

    // Période en texte lisible
    public function getPeriodeTexteAttribute()
    {
        return match($this->periode) {
            '6h-12h' => 'Matin (6h - 12h)',
            '12h-18h' => 'Après-midi (12h - 18h)',
            '18h-00h' => 'Soir (18h - 00h)',
            '00h-6h' => 'Nuit (00h - 6h)',
            default => $this->periode ?? 'Non définie'
        };
    }

    // Icône du type de carburant
    public function getTypeCarburantIconeAttribute()
    {
        return $this->type_carburant === 'essence' ? '⛽' : '🛢️';
    }

    // ========== MÉTHODES ==========

    // Calculer automatiquement le montant (si besoin)
    public static function calculerMontant($type_carburant, $quantite)
    {
        $prix = $type_carburant === 'essence' ? 750 : 700;
        return $quantite * $prix;
    }

    // Créer une vente avec calcul automatique du montant
    public static function creerVente($id_pompiste, $id_station, $type_carburant, $quantite, $mode_paiement = null)
    {
        $montant = self::calculerMontant($type_carburant, $quantite);
        
        // Déterminer la période
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
            'date_vente' => now(),
            'periode' => $periode
        ]);
    }

    // Mettre à jour le stock après vente
    public function mettreAJourStock()
    {
        $stock = Stock::where('id_station', $this->id_station)
            ->where('type_carburant', $this->type_carburant)
            ->first();
        
        if ($stock) {
            $stock->quantite -= $this->quantite;
            $stock->date_mise_a_jour = now();
            $stock->save();
            
            // Vérifier l'alerte stock faible
            if ($stock->quantite <= $stock->seuil_alerte) {
                $this->declencherAlerteStockFaible($stock->quantite);
            }
        }
    }

    // Déclencher une alerte de stock faible
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

    // Vérifier si la vente est dans une période spécifique
    public function estDansPeriode($periode)
    {
        return $this->periode === $periode;
    }
}