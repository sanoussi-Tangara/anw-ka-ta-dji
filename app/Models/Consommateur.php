<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consommateur extends Model
{
    protected $primaryKey = 'id_consommateur';

    protected $fillable = [
        'id_utilisateur'
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'id_consommateur', 'id_consommateur');
    }

    public function alertes()
    {
        return $this->hasMany(Alerte::class, 'id_consommateur', 'id_consommateur');
    }

    // Accesseurs
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
}