<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    use HasFactory;

    protected $table = 'stations';
    protected $primaryKey = 'id_station';

    protected $fillable = [
        'nom',
        'adresse',
        'latitude',
        'longitude',
        'id_icr',
        'id_gerant'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8'
    ];

    // ========== RELATIONS ==========

    // Gérant de la station
    public function gerant()
    {
        return $this->belongsTo(Gerant::class, 'id_gerant', 'id_gerant');
    }

    // Stocks de la station
    public function stocks()
    {
        return $this->hasMany(Stock::class, 'id_station', 'id_station');
    }

    // Livraisons reçues
    public function livraisons()
    {
        return $this->hasMany(Livraison::class, 'id_station', 'id_station');
    }

    // Ventes effectuées
    public function ventes()
    {
        return $this->hasMany(Vente::class, 'id_station', 'id_station');
    }

    // Réservations des consommateurs
    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'id_station', 'id_station');
    }

    // ========== ACCESSOIRS ==========

    // Récupérer le stock d'essence
    public function getStockEssenceAttribute()
    {
        $stock = $this->stocks->where('type_carburant', 'essence')->first();
        return $stock ? $stock->quantite : 0;
    }

    // Récupérer le stock de gasoil
    public function getStockGasoilAttribute()
    {
        $stock = $this->stocks->where('type_carburant', 'gasoil')->first();
        return $stock ? $stock->quantite : 0;
    }

    // Vérifier si la station a du carburant
    public function getEstDisponibleAttribute()
    {
        return $this->stock_essence > 0 || $this->stock_gasoil > 0;
    }

    // Couleur pour la carte (vert = dispo, rouge = rupture)
    public function getCouleurAttribute()
    {
        return $this->est_disponible ? 'vert' : 'rouge';
    }

    // Statut textuel
    public function getStatutTexteAttribute()
    {
        if ($this->stock_essence > 0 && $this->stock_gasoil > 0) {
            return 'Essence et Gasoil disponibles';
        }
        if ($this->stock_essence > 0) {
            return 'Essence disponible seulement';
        }
        if ($this->stock_gasoil > 0) {
            return 'Gasoil disponible seulement';
        }
        return 'Rupture de stock';
    }

    // Prix de l'essence
    public function getPrixEssenceAttribute()
    {
        return 750;
    }

    // Prix du gasoil
    public function getPrixGasoilAttribute()
    {
        return 700;
    }

    // Nom du gérant (accès direct)
    public function getNomGerantAttribute()
    {
        return $this->gerant->nom_complet ?? 'Non assigné';
    }

    // ========== MÉTHODES ==========

    // Vérifier si un type de carburant est disponible
    public function estDisponibleType($type_carburant)
    {
        if ($type_carburant === 'essence') {
            return $this->stock_essence > 0;
        }
        if ($type_carburant === 'gasoil') {
            return $this->stock_gasoil > 0;
        }
        return false;
    }

    // Récupérer la quantité disponible d'un type
    public function getQuantiteDisponible($type_carburant)
    {
        if ($type_carburant === 'essence') {
            return $this->stock_essence;
        }
        return $this->stock_gasoil;
    }

    // Mettre à jour le stock après vente
    public function updateStock($type_carburant, $quantite)
    {
        $stock = $this->stocks()->where('type_carburant', $type_carburant)->first();
        
        if ($stock) {
            $stock->quantite -= $quantite;
            $stock->date_mise_a_jour = now();
            $stock->save();
            
            if ($stock->quantite <= $stock->seuil_alerte) {
                $this->declencherAlerteStockFaible($type_carburant, $stock->quantite);
            }
            
            return true;
        }
        
        return false;
    }

    // Déclencher une alerte de stock faible
    private function declencherAlerteStockFaible($type_carburant, $quantite)
    {
        if ($this->gerant && $this->gerant->user) {
            Alerte::create([
                'type' => 'stock_faible',
                'message' => "Stock faible à {$this->nom} : plus que {$quantite} litres de {$type_carburant}",
                'date_creation' => now(),
                'statut' => 'non_lue',
                'id_destinataire' => $this->gerant->user->id_utilisateur
            ]);
        }
    }

    // Total des ventes sur une période
    public function totalVentes($dateDebut = null, $dateFin = null)
    {
        $query = $this->ventes();
        
        if ($dateDebut) {
            $query->whereDate('date_vente', '>=', $dateDebut);
        }
        if ($dateFin) {
            $query->whereDate('date_vente', '<=', $dateFin);
        }
        
        return $query->sum('montant');
    }
}