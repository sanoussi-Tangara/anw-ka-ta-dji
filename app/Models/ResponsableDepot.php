<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Modèle représentant un responsable de dépôt
class ResponsableDepot extends Model
{
    use HasFactory; // Permet d'utiliser les factories pour les tests et seeders

    // Nom de la table dans la base de données
    protected $table = 'responsables_depot';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_responsable';

    // La clé primaire est auto-incrémentée
    public $incrementing = true;

    // Type de la clé primaire
    protected $keyType = 'int';

    // Active les colonnes created_at et updated_at
    public $timestamps = true;

    // ======================
    // ATTRIBUTS MASS ASSIGNABLES
    // ======================

    protected $fillable = [
        'id_utilisateur', // Lien vers l'utilisateur système
        'id_depot',       // Lien vers le dépôt géré
        'nom',            // Nom du responsable
        'prenom',         // Prénom du responsable
        'email',          // Email de contact
        'telephone',      // Numéro de téléphone
        'role',           // Rôle dans le dépôt (ex: manager, superviseur)
    ];

    // ======================
    // CASTS (CONVERSION DES TYPES)
    // ======================

    protected $casts = [
        'id_utilisateur' => 'integer',
        'id_depot' => 'integer',
        'nom' => 'string',
        'prenom' => 'string',
        'email' => 'string',
        'telephone' => 'string',
        'role' => 'string',
    ];

    // ======================
    // RELATIONS
    // ======================

    // Un responsable de dépôt est lié à un utilisateur (compte système)
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
        // Si ta clé primaire User est "id", adapte ici :
        // return $this->belongsTo(User::class, 'id_utilisateur');
    }

    // Un responsable appartient à un dépôt
    public function depot()
    {
        return $this->belongsTo(Depot::class, 'id_depot', 'id_depot');
    }

    // ======================
    // NOTE MÉTIER
    // ======================

    /*
     * Actuellement : un responsable est lié à un seul dépôt (belongsTo)
     *
     * Si un responsable peut gérer plusieurs dépôts :
     * - il faut changer la relation en hasMany ou belongsToMany
     * - et adapter la structure de la base (table pivot si nécessaire)
     */
}