<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chauffeur extends Model
{
    use HasFactory;

    protected $table = 'chauffeurs';
    protected $primaryKey = 'id_chauffeur';

    protected $fillable = [
        'id_utilisateur',
        'id_icr',
        'permis'
    ];

    // ========== RELATIONS ==========

    // Lien avec l'utilisateur (héritage)
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // ICR qui a créé le compte
    public function icr()
    {
        return $this->belongsTo(Icr::class, 'id_icr', 'id_icr');
    }

    // Camion du chauffeur
    public function camion()
    {
        return $this->hasOne(Camion::class, 'id_chauffeur', 'id_chauffeur');
    }

    // Missions assignées
    public function missions()
    {
        return $this->hasMany(Mission::class, 'id_chauffeur', 'id_chauffeur');
    }

    // Livraisons effectuées
    public function livraisons()
    {
        return $this->hasMany(Livraison::class, 'id_chauffeur', 'id_chauffeur');
    }

    // Certificats signés
    public function certificats()
    {
        return $this->hasMany(Certificat::class, 'id_chauffeur', 'id_chauffeur');
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

    // Mission en cours
    public function getMissionEnCoursAttribute()
    {
        return $this->missions()->where('statut', 'en_cours')->first();
    }

    public function aMissionEnCours()
    {
        return $this->mission_en_cours !== null;
    }

    // Nombre de missions terminées
    public function getMissionsTermineesAttribute()
    {
        return $this->missions()->where('statut', 'terminee')->count();
    }
}