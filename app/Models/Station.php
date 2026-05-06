<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Modèle représentant une station-service
class Station extends Model
{
    use HasFactory; // Permet l'utilisation des factories (tests, seeders)

    // Nom de la table dans la base de données
    protected $table = 'stations';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_station';

    // La clé primaire est auto-incrémentée
    public $incrementing = true;

    // Type de la clé primaire
    protected $keyType = 'int';

    // Active les timestamps (created_at, updated_at)
    public $timestamps = true;

    // ======================
    // ATTRIBUTS MASS ASSIGNABLES
    // ======================

    protected $fillable = [
        'nom',        // Nom de la station
        'adresse',    // Adresse physique de la station
        'id_gerant',  // ID du gérant responsable de la station
    ];

    // ======================
    // CASTS (CONVERSION DES TYPES)
    // ======================

    protected $casts = [
        'id_gerant' => 'integer',
        'nom' => 'string',
        'adresse' => 'string',
    ];

    // ======================
    // RELATIONS
    // ======================

    // Une station appartient à un gérant
    public function gerant()
    {
        return $this->belongsTo(Gerant::class, 'id_gerant', 'id_gerant');
    }

    // Une station peut avoir plusieurs pompistes
    public function pompistes()
    {
        return $this->hasMany(Pompiste::class, 'station_id', 'id_station');
    }

    // Une station peut avoir plusieurs livraisons
    public function livraisons()
    {
        return $this->hasMany(Livraison::class, 'id_station', 'id_station');
    }

    // Une station peut avoir plusieurs ventes
    public function ventes()
    {
        return $this->hasMany(Vente::class, 'station_id', 'id_station');
    }

    // Une station peut contenir plusieurs cuves
    public function cuves()
    {
        return $this->hasMany(Cuve::class, 'station_id', 'id_station');
    }
}