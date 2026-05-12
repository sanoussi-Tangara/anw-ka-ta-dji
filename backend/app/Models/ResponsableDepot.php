<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResponsableDepot extends Model
{
    use HasFactory;

    protected $table = 'responsables_depot';
    protected $primaryKey = 'id_responsable';

    protected $fillable = [
        'id_utilisateur'
    ];

    // ========== RELATIONS ==========

    // Lien avec l'utilisateur (héritage)
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // Dépôt géré
    public function depot()
    {
        return $this->hasOne(Depot::class, 'id_responsable', 'id_responsable');
    }

    // Bons reçus (notifications)
    public function bonsRecus()
    {
        return $this->hasMany(Bon::class, 'id_depot', 'id_depot');
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
}