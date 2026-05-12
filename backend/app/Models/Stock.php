<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $table = 'stocks';
    protected $primaryKey = 'id_stock';

    protected $fillable = [
        'type_carburant',
        'quantite',
        'seuil_alerte',
        'date_mise_a_jour',
        'id_depot',
        'id_station'
    ];

    protected $casts = [
        'date_mise_a_jour' => 'datetime',
        'quantite' => 'decimal:2',
        'seuil_alerte' => 'decimal:2'
    ];

    // ========== RELATIONS ==========

    // Dépôt (si stock de dépôt)
    public function depot()
    {
        return $this->belongsTo(Depot::class, 'id_depot', 'id_depot');
    }

    // Station (si stock de station)
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

    // Vérifier si le stock est bas
    public function getEstBasAttribute()
    {
        return $this->quantite <= $this->seuil_alerte;
    }

    // Niveau de stock (pour affichage)
    public function getNiveauAttribute()
    {
        if ($this->quantite <= 0) return 'rupture';
        if ($this->quantite <= $this->seuil_alerte) return 'faible';
        if ($this->quantite <= $this->seuil_alerte * 2) return 'moyen';
        return 'eleve';
    }

    // Couleur selon le niveau
    public function getCouleurAttribute()
    {
        return match($this->niveau) {
            'rupture' => 'rouge',
            'faible' => 'orange',
            'moyen' => 'jaune',
            'eleve' => 'vert',
            default => 'gris'
        };
    }

    // Icône selon le niveau
    public function getIconeAttribute()
    {
        return match($this->niveau) {
            'rupture' => '❌',
            'faible' => '⚠️',
            'moyen' => '📊',
            'eleve' => '✅',
            default => '❓'
        };
    }

    // Lieu du stock (dépôt ou station)
    public function getLieuAttribute()
    {
        if ($this->id_depot) {
            return $this->depot->nom ?? 'Dépôt inconnu';
        }
        if ($this->id_station) {
            return $this->station->nom ?? 'Station inconnue';
        }
        return 'Lieu non défini';
    }

    // Type de lieu ('depot' ou 'station')
    public function getTypeLieuAttribute()
    {
        if ($this->id_depot) return 'depot';
        if ($this->id_station) return 'station';
        return null;
    }

    // ========== MÉTHODES ==========

    // Mettre à jour la quantité
    public function updateQuantite($nouvelleQuantite)
    {
        $this->quantite = $nouvelleQuantite;
        $this->date_mise_a_jour = now();
        $this->save();
        
        if ($this->est_bas) {
            $this->declencherAlerte();
        }
        
        return $this;
    }

    // Ajouter du stock
    public function ajouter($quantite)
    {
        return $this->updateQuantite($this->quantite + $quantite);
    }

    // Retirer du stock
    public function retirer($quantite)
    {
        if ($this->quantite < $quantite) {
            throw new \Exception("Stock insuffisant. Disponible: {$this->quantite}, demandé: {$quantite}");
        }
        return $this->updateQuantite($this->quantite - $quantite);
    }

    // Vérifier si une quantité est disponible
    public function estDisponible($quantite)
    {
        return $this->quantite >= $quantite;
    }

    // Déclencher une alerte si stock bas
    private function declencherAlerte()
    {
        $destinataireId = null;
        
        if ($this->id_station && $this->station && $this->station->gerant) {
            $destinataireId = $this->station->gerant->user->id_utilisateur ?? null;
        } elseif ($this->id_depot && $this->depot && $this->depot->responsable) {
            $destinataireId = $this->depot->responsable->user->id_utilisateur ?? null;
        }
        
        if ($destinataireId) {
            Alerte::create([
                'type' => 'stock_faible',
                'message' => "Stock faible : {$this->type_carburant_texte} à {$this->lieu}",
                'date_creation' => now(),
                'statut' => 'non_lue',
                'id_destinataire' => $destinataireId
            ]);
        }
    }

    // ========== MÉTHODES STATIQUES ==========

    // Récupérer le stock d'une station
    public static function getStationStock($id_station, $type_carburant = null)
    {
        $query = self::where('id_station', $id_station);
        
        if ($type_carburant) {
            $query->where('type_carburant', $type_carburant);
        }
        
        return $query->get();
    }

    // Récupérer le stock d'un dépôt
    public static function getDepotStock($id_depot, $type_carburant = null)
    {
        $query = self::where('id_depot', $id_depot);
        
        if ($type_carburant) {
            $query->where('type_carburant', $type_carburant);
        }
        
        return $query->get();
    }

    // Initialiser le stock pour une nouvelle station
    public static function initialiserStationStock($id_station)
    {
        self::create([
            'type_carburant' => 'essence',
            'quantite' => 0,
            'seuil_alerte' => 500,
            'date_mise_a_jour' => now(),
            'id_station' => $id_station
        ]);
        
        self::create([
            'type_carburant' => 'gasoil',
            'quantite' => 0,
            'seuil_alerte' => 500,
            'date_mise_a_jour' => now(),
            'id_station' => $id_station
        ]);
    }

    // Initialiser le stock pour un nouveau dépôt
    public static function initialiserDepotStock($id_depot)
    {
        self::create([
            'type_carburant' => 'essence',
            'quantite' => 0,
            'seuil_alerte' => 2000,
            'date_mise_a_jour' => now(),
            'id_depot' => $id_depot
        ]);
        
        self::create([
            'type_carburant' => 'gasoil',
            'quantite' => 0,
            'seuil_alerte' => 2000,
            'date_mise_a_jour' => now(),
            'id_depot' => $id_depot
        ]);
    }
}