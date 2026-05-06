<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Modèle représentant une alerte dans l'application
class Alerte extends Model
{
    // Nom de la table associée dans la base de données
    protected $table = 'alertes';

    // Clé primaire personnalisée (au lieu de "id")
    protected $primaryKey = 'id_alerte';

    // Indique que les colonnes created_at et updated_at sont utilisées
    public $timestamps = true;

    // Liste des champs autorisés pour l'assignation de masse (mass assignment)
    protected $fillable = [
        'type',              // Type d'alerte (ex: info, warning, erreur)
        'message',           // Contenu du message de l'alerte
        'date_creation',     // Date de création personnalisée
        'statut',            // Statut de l'alerte
        'id_destinataire',   // ID de l'utilisateur destinataire
    ];

    // Constantes définissant les différents statuts possibles
    public const STATUT_NON_LUE = 'non_lue';   // Alerte non lue
    public const STATUT_LUE = 'lue';           // Alerte lue
    public const STATUT_TRAITE = 'traitee';    // Alerte traitée

    // Définition des types de données pour certains champs (casting automatique)
    protected $casts = [
        'date_creation' => 'datetime', // Converti en objet DateTime
        'statut' => 'string',
        'type' => 'string',
        'message' => 'string',
        'id_destinataire' => 'integer',
    ];

    // ======================
    // RELATIONS
    // ======================

    // Relation : une alerte appartient à un utilisateur (destinataire)
    public function destinataire()
    {
        // Clé étrangère : id_destinataire
        // Clé locale du modèle User : id_utilisateur
        return $this->belongsTo(User::class, 'id_destinataire', 'id_utilisateur');

        // Si la clé primaire du User est "id", utiliser :
        // return $this->belongsTo(User::class, 'id_destinataire');
    }

    // ======================
    // SCOPES (REQUÊTES RÉUTILISABLES)
    // ======================

    // Scope pour récupérer les alertes non lues
    public function scopeNonLues($query)
    {
        return $query->where('statut', self::STATUT_NON_LUE);
    }

    // Scope pour récupérer les alertes lues
    public function scopeLues($query)
    {
        return $query->where('statut', self::STATUT_LUE);
    }

    // Scope pour récupérer les alertes traitées
    public function scopeTraitees($query)
    {
        return $query->where('statut', self::STATUT_TRAITE);
    }

    // ======================
    // MÉTHODES MÉTIER
    // ======================

    // Marque l'alerte comme lue et sauvegarde en base
    public function marquerCommeLue(): void
    {
        $this->statut = self::STATUT_LUE;
        $this->save();
    }

    // Marque l'alerte comme traitée et sauvegarde en base
    public function marquerCommeTraitee(): void
    {
        $this->statut = self::STATUT_TRAITE;
        $this->save();
    }

    // Méthode statique pour créer une alerte avec logique métier intégrée
    public static function creer(string $type, string $message, int $destinataireId, ?string $dateCreation = null): self
    {
        $alerte = new self();

        // Attribution des valeurs
        $alerte->type = $type;
        $alerte->message = $message;

        // Si aucune date n'est fournie, on utilise la date actuelle
        $alerte->date_creation = $dateCreation ?? now();

        // Par défaut, une alerte est non lue à sa création
        $alerte->statut = self::STATUT_NON_LUE;

        // Association au destinataire
        $alerte->id_destinataire = $destinataireId;

        // Sauvegarde en base de données
        $alerte->save();

        return $alerte;
    }
}