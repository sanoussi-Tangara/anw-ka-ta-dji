<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // 🔹 Configuration de la table
    protected $table = 'users';
    protected $primaryKey = 'id_utilisateur';
    protected $keyType = 'int';
    public $incrementing = true;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'telephone',
        'role',
        'matricule',
        'zone',
        'permis',
        'nom_societe',
        'nif',
        'prix_essence',      // Ajout pour la fixation des prix
        'prix_gasoil',       // Ajout pour la fixation des prix
        'prix_updated_at'    // Ajout pour la fixation des prix
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'prix_essence' => 'decimal:2',
        'prix_gasoil' => 'decimal:2',
        'prix_updated_at' => 'datetime'
    ];

    // ========== RELATIONS ==========

    public function consommateur()
    {
        return $this->hasOne(Consommateur::class, 'id_utilisateur', 'id_utilisateur');
    }

    // Correction : Manager (singulier) et Manager (classe)
    public function manager()
    {
        return $this->hasOne(Manager::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function fournisseur()
    {
        return $this->hasOne(Fournisseur::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function icr()
    {
        return $this->hasOne(Icr::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function gerant()
    {
        return $this->hasOne(Gerant::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function chauffeur()
    {
        return $this->hasOne(Chauffeur::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function pompiste()
    {
        return $this->hasOne(Pompiste::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function responsableDepot()
    {
        return $this->hasOne(ResponsableDepot::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function administrateur()
    {
        return $this->hasOne(Administrateur::class, 'id_utilisateur', 'id_utilisateur');
    }

    // ========== MÉTHODES UTILITAIRES ==========

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     */
    public function isRole($role)
    {
        return $this->role === $role;
    }

    /**
     * Vérifier si l'utilisateur est un fournisseur
     */
    public function isFournisseur()
    {
        return $this->role === 'fournisseur';
    }

    /**
     * Vérifier si l'utilisateur est un manager
     */
    public function isManager()
    {
        return $this->role === 'manager';
    }

    /**
     * Vérifier si l'utilisateur est un ICR
     */
    public function isIcr()
    {
        return $this->role === 'icr';
    }

    /**
     * Vérifier si l'utilisateur est un gérant
     */
    public function isGerant()
    {
        return $this->role === 'gerant';
    }

    /**
     * Vérifier si l'utilisateur est un chauffeur
     */
    public function isChauffeur()
    {
        return $this->role === 'chauffeur';
    }

    /**
     * Vérifier si l'utilisateur est un pompiste
     */
    public function isPompiste()
    {
        return $this->role === 'pompiste';
    }

    /**
     * Vérifier si l'utilisateur est un consommateur
     */
    public function isConsommateur()
    {
        return $this->role === 'consommateur';
    }

    /**
     * Vérifier si l'utilisateur est un responsable de dépôt
     */
    public function isResponsableDepot()
    {
        return $this->role === 'responsable_depot';
    }

    /**
     * Vérifier si l'utilisateur est un administrateur
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Vérifier si le compte est actif
     */
    public function isActive()
    {
        return $this->statut === true;
    }
}