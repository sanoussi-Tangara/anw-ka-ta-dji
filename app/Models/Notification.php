<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Modèle représentant une notification envoyée à un utilisateur
class Notification extends Model
{
    use HasFactory; // Permet de générer des données de test avec des factories

    // Nom de la table dans la base de données
    protected $table = 'notifications';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_notification';

    // Clé auto-incrémentée
    public $incrementing = true;

    // Type de la clé primaire
    protected $keyType = 'int';

    // Active les timestamps (created_at, updated_at)
    public $timestamps = true;

    // ======================
    // ATTRIBUTS MASS ASSIGNABLES
    // ======================

    protected $fillable = [
        'user_id',           // ID de l'utilisateur destinataire
        'type',              // Type de notification (ex: livraison, alerte, etc.)
        'data',              // Données JSON associées à la notification
        'read_at',           // Date de lecture (null = non lue)
        'notifiable_type',   // Type du modèle lié (polymorphisme)
        'notifiable_id',     // ID du modèle lié
    ];

    // ======================
    // CASTS (CONVERSION AUTOMATIQUE)
    // ======================

    protected $casts = [
        'data' => 'array',        // Convertit JSON en tableau PHP
        'read_at' => 'datetime',  // Convertit en objet DateTime
        'user_id' => 'int',
        'notifiable_id' => 'int',
    ];

    // ======================
    // RELATIONS
    // ======================

    // Une notification appartient à un utilisateur
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relation polymorphique :
    // Une notification peut être liée à plusieurs types de modèles (Livraison, Alerte, etc.)
    public function notifiable()
    {
        return $this->morphTo();
    }

    // ======================
    // SCOPES (REQUÊTES RÉUTILISABLES)
    // ======================

    // Récupérer les notifications non lues
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    // Récupérer les notifications déjà lues
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    // Filtrer par type de notification
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Filtrer les notifications d’un utilisateur spécifique
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ======================
    // MÉTHODES MÉTIER
    // ======================

    // Marquer la notification comme lue (met la date actuelle)
    public function marquerCommeLu(): void
    {
        $this->read_at = now();
        $this->save();
    }

    // Marquer la notification comme non lue
    public function marquerCommeNonLu(): void
    {
        $this->read_at = null;
        $this->save();
    }

    // ======================
    // HELPERS
    // ======================

    // Permet de récupérer une valeur spécifique dans le champ "data"
    // Exemple : $notification->deserialiserData('message')
    public function deserialiserData(string $cle): mixed
    {
        return data_get($this->data, $cle);
    }
}