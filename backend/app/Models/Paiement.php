<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $table = 'paiements';
    protected $primaryKey = 'id_paiement';

    protected $fillable = [
        'id_reservation',
        'montant',
        'mode_paiement',
        'date_paiement',
        'statut',
        'reference_transaction'
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
        'montant' => 'decimal:2'
    ];

    // ========== RELATIONS ==========

    // Réservation associée
    public function reservation()
    {
        return $this->belongsTo(Reservation::class, 'id_reservation', 'id_reservation');
    }

    // ========== ACCESSOIRS ==========

    // Mode de paiement en texte lisible
    public function getModePaiementTexteAttribute()
    {
        return match($this->mode_paiement) {
            'orange_money' => 'Orange Money',
            'mobicash' => 'Mobicash',
            'wave' => 'Wave',
            'carte' => 'Carte bancaire',
            'especes' => 'Espèces',
            default => $this->mode_paiement
        };
    }

    // Icône du mode de paiement
    public function getModePaiementIconeAttribute()
    {
        return match($this->mode_paiement) {
            'orange_money' => '📱',
            'mobicash' => '📱',
            'wave' => '📱',
            'carte' => '💳',
            'especes' => '💵',
            default => '💰'
        };
    }

    // Statut en texte lisible
    public function getStatutTexteAttribute()
    {
        return match($this->statut) {
            'en_attente' => 'En attente',
            'paye' => 'Payé',
            'echoue' => 'Échoué',
            default => $this->statut
        };
    }

    // Couleur du statut
    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'en_attente' => 'orange',
            'paye' => 'green',
            'echoue' => 'red',
            default => 'gray'
        };
    }

    // ========== MÉTHODES ==========

    // Marquer comme payé
    public function marquerPaye()
    {
        $this->statut = 'paye';
        $this->save();
        return $this;
    }

    // Marquer comme échoué
    public function marquerEchoue()
    {
        $this->statut = 'echoue';
        $this->save();
        return $this;
    }

    // Vérifier si le paiement est réussi
    public function estPaye()
    {
        return $this->statut === 'paye';
    }

    // Vérifier si le paiement est en attente
    public function estEnAttente()
    {
        return $this->statut === 'en_attente';
    }

    // ========== MÉTHODES STATIQUES ==========

    // Créer un paiement pour une réservation
    public static function creerPourReservation($reservation, $modePaiement, $reference = null)
    {
        return self::create([
            'id_reservation' => $reservation->id_reservation,
            'montant' => $reservation->montant,
            'mode_paiement' => $modePaiement,
            'date_paiement' => now(),
            'statut' => 'paye',
            'reference_transaction' => $reference ?? 'TRX_' . time() . '_' . uniqid()
        ]);
    }
}