<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Gerant;
use App\Models\Station;
use App\Models\Vente;

class Pompiste extends Model
{
    protected $primaryKey = 'id_pompiste';

    protected $fillable = [
        'id_utilisateur',
        'id_gerant',
        'id_station'
    ];

    // 🔹 Relation utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // 🔹 Alias frontend
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // 🔹 Relation gérant
    public function gerant()
    {
        return $this->belongsTo(Gerant::class, 'id_gerant', 'id_gerant');
    }

    // 🔹 Relation station (CORRIGÉE + sécurisée)
    public function station()
    {
        return $this->belongsTo(Station::class, 'id_station', 'id_station');
    }

    // 🔹 Ventes
    public function ventes()
    {
        return $this->hasMany(Vente::class, 'id_pompiste', 'id_pompiste');
    }

    // =========================
    // ACCESSORS SÉCURISÉS
    // =========================

    public function getNomAttribute()
    {
        return $this->user?->nom ?? '';
    }

    public function getPrenomAttribute()
    {
        return $this->user?->prenom ?? '';
    }

    public function getEmailAttribute()
    {
        return $this->user?->email ?? '';
    }

    public function getTelephoneAttribute()
    {
        return $this->user?->telephone ?? '';
    }
}