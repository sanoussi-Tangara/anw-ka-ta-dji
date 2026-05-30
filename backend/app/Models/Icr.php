<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Icr extends Model
{
    use HasFactory;

    protected $table = 'icr';
    protected $primaryKey = 'id_icr';

    // app/Models/Icr.php

protected $fillable = [
    'id_utilisateur',
    'matricule',
    'zone',
    'nom_entreprise' 
];

    // ========== RELATIONS ==========

    // Lien avec l'utilisateur (héritage)
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // Gérants créés par cet ICR
    public function gerants()
    {
        return $this->hasMany(Gerant::class, 'id_icr', 'id_icr');
    }

    // Chauffeurs créés par cet ICR
    public function chauffeurs()
    {
        return $this->hasMany(Chauffeur::class, 'id_icr', 'id_icr');
    }

    // Bons reçus
    public function bons()
    {
        return $this->hasMany(Bon::class, 'id_icr', 'id_icr');
    }

    // Missions organisées
    public function missions()
    {
        return $this->hasMany(Mission::class, 'id_icr', 'id_icr');
    }

    // Certificats signés
    public function certificats()
    {
        return $this->hasMany(Certificat::class, 'id_icr', 'id_icr');
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

    // Nombre de missions en cours
    public function getMissionsEnCoursAttribute()
    {
        return $this->missions()->where('statut', 'en_cours')->count();
    }

    // Nombre de missions terminées
    public function getMissionsTermineesAttribute()
    {
        return $this->missions()->where('statut', 'terminee')->count();
    }

    // ========== MÉTHODES ==========

    // Vérifier si l'ICR a des missions en cours
    public function aDesMissionsEnCours()
    {
        return $this->missionsEnCours > 0;
    }
}