<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Modèle représentant une livraison de carburant (ou produit)
class Livraison extends Model
{
    use HasFactory; // Permet d'utiliser les factories pour les tests / seeders

    // Nom de la table dans la base de données
    protected $table = 'livraisons';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_livraison';

    // Indique que la clé primaire est auto-incrémentée
    public $incrementing = true;

    // Type de la clé primaire
    protected $keyType = 'int';

    // Active les colonnes created_at et updated_at
    public $timestamps = true;

    // ======================
    // ATTRIBUTS MASS ASSIGNABLES
    // ======================

    // Champs autorisés pour insertion/mise à jour en masse
    protected $fillable = [
        'station_id',        // ID de la station concernée
        'pompiste_id',       // ID du pompiste (agent)
        'code_validation',   // Code utilisé pour valider la livraison
        'quantite_recue',    // Quantité reçue à la station
        'quantite_livree',   // Quantité réellement livrée
        'statut',            // Statut de la livraison
        'photos',            // Chemin ou nom des photos justificatives
        'jauge',             // Mesure de la jauge (niveau du réservoir)
        'validated_at',      // Date de validation
    ];

    // ======================
    // CASTS (CONVERSION AUTOMATIQUE DES TYPES)
    // ======================

    protected $casts = [
        'station_id' => 'integer',
        'pompiste_id' => 'integer',
        'quantite_recue' => 'float',
        'quantite_livree' => 'float',
        'statut' => 'string',
        'photos' => 'string',
        'jauge' => 'float',
        'validated_at' => 'datetime', // Converti en objet DateTime
    ];

    // ======================
    // RELATIONS
    // ======================

    // Une livraison appartient à une station
    public function station()
    {
        return $this->belongsTo(Station::class, 'station_id');
    }

    // Une livraison est effectuée par un pompiste
    public function pompiste()
    {
        return $this->belongsTo(Pompiste::class, 'pompiste_id');
    }

    // ======================
    // CONSTANTES MÉTIER (STATUTS)
    // ======================

    public const STATUT_EN_ATTENTE = 'en_attente'; // Livraison en attente de validation
    public const STATUT_VALIDE = 'validee';        // Livraison validée
    public const STATUT_ECART = 'ecart';           // Différence détectée (écart)

    // ======================
    // MÉTHODES MÉTIER
    // ======================

    // Marque la livraison comme validée
    public function marquerCommeValidee(): void
    {
        $this->statut = self::STATUT_VALIDE;
        $this->save();
    }

    // Marque la livraison comme ayant un écart
    public function marquerCommeEcarts(): void
    {
        $this->statut = self::STATUT_ECART;
        $this->save();
    }

    // Remet la livraison en attente
    public function marquerCommeEnAttente(): void
    {
        $this->statut = self::STATUT_EN_ATTENTE;
        $this->save();
    }

    // ======================
    // SCOPES (REQUÊTES RÉUTILISABLES)
    // ======================

    // Scope pour récupérer les livraisons en attente
    public function scopeEnAttente($query)
    {
        return $query->where('statut', self::STATUT_EN_ATTENTE);
    }

    // Scope pour récupérer les livraisons validées
    public function scopeValidees($query)
    {
        return $query->where('statut', self::STATUT_VALIDE);
    }

    // Scope pour récupérer les livraisons avec écart
    public function scopeEcarts($query)
    {
        return $query->where('statut', self::STATUT_ECART);
    }
}