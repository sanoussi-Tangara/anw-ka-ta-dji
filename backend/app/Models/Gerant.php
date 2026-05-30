<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gerant extends Model
{
    use HasFactory;

    protected $table = 'gerants';
    protected $primaryKey = 'id_gerant';

  protected $fillable = [
    'id_utilisateur',
    'id_icr'
];

    // ========== RELATIONS ==========
    
    // Relation avec l'utilisateur (héritage)
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // Relation avec la station
    public function station()
    {
        return $this->hasOne(Station::class, 'id_gerant', 'id_gerant');
    }

    // Relation avec les pompistes
    public function pompistes()
    {
        return $this->hasMany(Pompiste::class, 'id_gerant', 'id_gerant');
    }

    // Relation avec les livraisons de sa station
    public function livraisons()
    {
        return $this->hasMany(Livraison::class, 'id_gerant', 'id_gerant');
    }

    // Relation avec les ventes via les pompistes
    public function ventes()
    {
        return $this->hasManyThrough(
            Vente::class,
            Pompiste::class,
            'id_gerant',      // clé sur pompistes
            'id_pompiste',    // clé sur ventes
            'id_gerant',      // clé locale
            'id_pompiste'     // clé locale sur pompistes
        );
    }

    // Relation avec les alertes
    public function alertes()
    {
        return $this->hasMany(Alerte::class, 'id_destinataire', 'id_utilisateur');
    }

    // ========== ACCESSOIRS ==========
    
    public function getNomAttribute()
    {
        return $this->user->nom;
    }

    public function getPrenomAttribute()
    {
        return $this->user->prenom;
    }

    public function getEmailAttribute()
    {
        return $this->user->email;
    }

    public function getTelephoneAttribute()
    {
        return $this->user->telephone;
    }

    public function getNomCompletAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    // ========== MÉTHODES MÉTIER ==========
    
    // Vérifier si le stock est bas
    public function verifierStock()
    {
        $station = $this->station;
        if (!$station) return null;

        $stocks = Stock::where('id_station', $station->id_station)->get();
        
        $result = [];
        foreach ($stocks as $stock) {
            $result[$stock->type_carburant] = [
                'quantite' => $stock->quantite,
                'seuil' => $stock->seuil_alerte,
                'est_bas' => $stock->quantite <= $stock->seuil_alerte
            ];
        }
        return $result;
    }
}