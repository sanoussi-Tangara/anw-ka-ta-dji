<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Manager extends Model
{
    use HasFactory;

    protected $table = 'managers';
    protected $primaryKey = 'id_manager';

    protected $fillable = [
        'id_utilisateur',
        'niveau_acces'
    ];

    protected $casts = [
        'id_utilisateur' => 'integer',
        'id_manager' => 'integer'
    ];

    // ==============================================
    // 🔹 RELATIONS
    // ==============================================

    /**
     * Relation avec l'utilisateur (héritage)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // ==============================================
    // 🔹 ACCESSOIRS
    // ==============================================

    /**
     * Raccourci pour accéder au nom de l'utilisateur
     */
    public function getNomAttribute()
    {
        return $this->user?->nom;
    }

    /**
     * Raccourci pour accéder au prénom de l'utilisateur
     */
    public function getPrenomAttribute()
    {
        return $this->user?->prenom;
    }

    /**
     * Raccourci pour accéder à l'email de l'utilisateur
     */
    public function getEmailAttribute()
    {
        return $this->user?->email;
    }

    /**
     * Raccourci pour accéder au téléphone de l'utilisateur
     */
    public function getTelephoneAttribute()
    {
        return $this->user?->telephone;
    }

    /**
     * Nom complet du manager
     */
    public function getNomCompletAttribute()
    {
        $prenom = $this->prenom;
        $nom = $this->nom;
        if ($prenom && $nom) {
            return $prenom . ' ' . $nom;
        }
        return $nom ?? 'Manager';
    }

    /**
     * Niveau d'accès en texte lisible
     */
    public function getNiveauAccesTexteAttribute()
    {
        return match($this->niveau_acces) {
            'national' => 'National',
            'regional' => 'Régional',
            'local' => 'Local',
            default => $this->niveau_acces ?? 'Non défini'
        };
    }

    // ==============================================
    // 🔹 MÉTHODES UTILITAIRES
    // ==============================================

    /**
     * Vérifier si le manager a un niveau d'accès national
     */
    public function hasNationalAccess(): bool
    {
        return $this->niveau_acces === 'national';
    }

    /**
     * Vérifier si le manager a un niveau d'accès régional
     */
    public function hasRegionalAccess(): bool
    {
        return $this->niveau_acces === 'regional';
    }

    /**
     * Vérifier si le manager a un niveau d'accès local
     */
    public function hasLocalAccess(): bool
    {
        return $this->niveau_acces === 'local';
    }

    /**
     * Vérifier si le manager peut accéder à une fonctionnalité
     */
    public function canAccess($fonctionnalite): bool
    {
        if ($this->niveau_acces === 'national') {
            return true;
        }
        // À étendre selon les besoins
        return false;
    }
}