<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Depot extends Model
{
    use HasFactory;

    protected $table = 'depots';
    protected $primaryKey = 'id_depot';

    protected $fillable = [
        'nom',
        'localisation',
        'id_responsable'
    ];

    // ========== RELATIONS ==========

    // Responsable du dépôt
    public function responsable()
    {
        return $this->belongsTo(ResponsableDepot::class, 'id_responsable', 'id_responsable');
    }

    // Stocks du dépôt
    public function stocks()
    {
        return $this->hasMany(Stock::class, 'id_depot', 'id_depot');
    }

    // Bons d'enlèvement liés à ce dépôt
    public function bons()
    {
        return $this->hasMany(Bon::class, 'id_depot', 'id_depot');
    }

    // Missions partant de ce dépôt (via les bons)
    public function missions()
    {
        return $this->hasManyThrough(
            Mission::class,
            Bon::class,
            'id_depot',      // clé étrangère sur bons
            'id_bon',        // clé étrangère sur missions
            'id_depot',      // clé locale sur depots
            'id_bon'         // clé locale sur bons
        );
    }

    // ========== ACCESSOIRS ==========

    // Nom du responsable (accès direct)
    public function getNomResponsableAttribute()
    {
        return $this->responsable->user->nom ?? 'Non assigné';
    }

    // Prénom du responsable
    public function getPrenomResponsableAttribute()
    {
        return $this->responsable->user->prenom ?? '';
    }

    // Nom complet du responsable
    public function getNomCompletResponsableAttribute()
    {
        $prenom = $this->prenom_responsable;
        $nom = $this->nom_responsable;
        if ($prenom && $nom) {
            return $prenom . ' ' . $nom;
        }
        return 'Non assigné';
    }

    // Stock total d'essence
    public function getStockEssenceAttribute()
    {
        $stock = $this->stocks->where('type_carburant', 'essence')->first();
        return $stock ? $stock->quantite : 0;
    }

    // Stock total de gasoil
    public function getStockGasoilAttribute()
    {
        $stock = $this->stocks->where('type_carburant', 'gasoil')->first();
        return $stock ? $stock->quantite : 0;
    }

    // Vérifier si le dépôt a du stock
    public function getEstDisponibleAttribute()
    {
        return $this->stock_essence > 0 || $this->stock_gasoil > 0;
    }

    // Nombre total de bons émis
    public function getNombreBonsAttribute()
    {
        return $this->bons()->count();
    }

    // Nombre de bons en cours
    public function getNombreBonsEnCoursAttribute()
    {
        return $this->bons()->where('statut', 'en_cours')->count();
    }

    // ========== MÉTHODES ==========

    // Mettre à jour le stock après un chargement
    public function updateStock($type_carburant, $quantite, $operation = 'retirer')
    {
        $stock = $this->stocks()->where('type_carburant', $type_carburant)->first();
        
        if (!$stock) {
            return false;
        }
        
        if ($operation === 'retirer') {
            if ($stock->quantite < $quantite) {
                return false;
            }
            $stock->quantite -= $quantite;
        } elseif ($operation === 'ajouter') {
            $stock->quantite += $quantite;
        }
        
        $stock->date_mise_a_jour = now();
        $stock->save();
        
        return true;
    }

    // Vérifier si une quantité est disponible
    public function estDisponible($type_carburant, $quantite)
    {
        $stock = $this->stocks()->where('type_carburant', $type_carburant)->first();
        return $stock && $stock->quantite >= $quantite;
    }

    // Récupérer la quantité disponible d'un type
    public function getQuantiteDisponible($type_carburant)
    {
        $stock = $this->stocks()->where('type_carburant', $type_carburant)->first();
        return $stock ? $stock->quantite : 0;
    }

    // Récupérer les bons par statut
    public function getBonsByStatut($statut)
    {
        return $this->bons()->where('statut', $statut)->get();
    }

    // ========== MÉTHODES STATIQUES ==========

    // Récupérer tous les dépôts avec leurs stocks
    public static function getAllWithStocks()
    {
        return self::with(['stocks', 'responsable.user'])->get();
    }

    // Récupérer les dépôts avec stock bas
    public static function getDepotsStockFaible()
    {
        return self::whereHas('stocks', function($query) {
            $query->whereRaw('quantite <= seuil_alerte');
        })->with('stocks')->get();
    }
}