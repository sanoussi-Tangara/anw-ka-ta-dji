<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Modèle représentant le stock de carburant (ou produit) dans un dépôt ou une station
class Stock extends Model
{
    use HasFactory; // Permet d'utiliser les factories pour les tests et seeders

    // Nom de la table dans la base de données
    protected $table = 'stocks';

    // Clé primaire de la table
    protected $primaryKey = 'id_stock';

    // Active les timestamps (created_at, updated_at)
    public $timestamps = true;

    // ======================
    // ATTRIBUTS MASS ASSIGNABLES
    // ======================

    protected $fillable = [
        'type_carburant',     // Type de carburant (ex: essence, diesel)
        'quantite',           // Quantité disponible en stock
        'seuil_alerte',       // Seuil minimum pour déclencher une alerte
        'date_mise_a_jour',   // Dernière mise à jour du stock
        'id_depot',           // Référence au dépôt (si stock central)
        'id_station',         // Référence à la station (si stock local)
    ];

    // ======================
    // CASTS (CONVERSION AUTOMATIQUE DES TYPES)
    // ======================

    protected $casts = [
        'quantite' => 'decimal:2',        // Stock avec 2 décimales
        'seuil_alerte' => 'decimal:2',    // Seuil d’alerte avec précision
        'date_mise_a_jour' => 'datetime', // Date convertie en DateTime
        'id_depot' => 'integer',
        'id_station' => 'integer',
    ];

    // ======================
    // RELATIONS
    // ======================

    // Un stock peut appartenir à un dépôt (stock central)
    public function depot()
    {
        return $this->belongsTo(Depot::class, 'id_depot', 'id_depot');
    }

    // Un stock peut être lié à une station (stock local)
    public function station()
    {
        return $this->belongsTo(Station::class, 'id_station', 'id_station');
    }
}