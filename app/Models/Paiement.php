<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Modèle représentant un paiement effectué par un utilisateur
class Paiement extends Model
{
    use HasFactory; // Permet d'utiliser les factories pour les tests et seeders

    // Nom de la table dans la base de données
    protected $table = 'paiements';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_paiement';

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
        'user_id',   // ID du client qui effectue le paiement
        'order_id',  // ID de la commande ou facture liée (optionnel)
        'amount',    // Montant du paiement
        'currency',  // Devise utilisée (ex: EUR, USD)
        'method',    // Méthode de paiement (card, cash, wallet, etc.)
        'status',    // Statut du paiement (pending, paid, failed)
        'paid_at',   // Date de validation du paiement
        'data',      // Données supplémentaires en JSON
    ];

    // ======================
    // CASTS (CONVERSION AUTOMATIQUE DES TYPES)
    // ======================

    protected $casts = [
        'amount' => 'float',       // Montant en nombre décimal
        'paid_at' => 'datetime',   // Date convertie en objet DateTime
        'data' => 'array',         // JSON transformé en tableau PHP
        'currency' => 'string',
        'method' => 'string',
        'status' => 'string',
        'user_id' => 'integer',
        'order_id' => 'integer',
    ];

    // ======================
    // RELATIONS
    // ======================

    // Un paiement appartient à un utilisateur (client)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Un paiement peut être lié à une commande
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    // ======================
    // CONSTANTES MÉTIER (STATUTS)
    // ======================

    public const STATUS_PENDING = 'pending'; // Paiement en attente
    public const STATUS_PAID = 'paid';       // Paiement validé
    public const STATUS_FAILED = 'failed';   // Paiement échoué

    // ======================
    // SCOPES (REQUÊTES RÉUTILISABLES)
    // ======================

    // Récupérer les paiements en attente
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    // Récupérer les paiements validés
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    // Récupérer les paiements échoués
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    // ======================
    // MÉTHODES MÉTIER
    // ======================

    // Marquer le paiement comme réussi
    public function marquerCommePaye(): void
    {
        $this->status = self::STATUS_PAID;
        $this->paid_at = now(); // Enregistre la date de paiement
        $this->save();
    }

    // Remettre le paiement en attente
    public function marquerCommeEnAttente(): void
    {
        $this->status = self::STATUS_PENDING;
        $this->save();
    }

    // Marquer le paiement comme échoué
    public function marquerCommeEchoue(): void
    {
        $this->status = self::STATUS_FAILED;
        $this->save();
    }
}