<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $table = 'reservations';
    protected $primaryKey = 'id_reservation';
    
    protected $fillable = [
        'quantite',
        'type_carburant',
        'montant_total',
        'date_reservation',
        'date_retrait',
        'statut',
        'id_consommateur',
        'id_station'
    ];

    protected $casts = [
        'date_reservation' => 'datetime',
        'date_retrait' => 'datetime',
        'quantite' => 'decimal:2',
        'montant_total' => 'decimal:2'
    ];

    // ========== RELATIONS ==========

    public function consommateur()
    {
        return $this->belongsTo(Consommateur::class, 'id_consommateur', 'id_consommateur');
    }

    public function station()
    {
        return $this->belongsTo(Station::class, 'id_station', 'id_station');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'id_reservation', 'id_reservation');
    }

    // ========== ACCESSOIRS ==========

    public function getStatutTexteAttribute()
    {
        return match($this->statut) {
            'en_attente' => '⏳ En attente de paiement',
            'payee' => '✅ Payée',
            'servie' => '🚛 Servie',
            'annulee' => '❌ Annulée',
            default => $this->statut
        };
    }

    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'en_attente' => 'yellow',
            'payee' => 'green',
            'servie' => 'blue',
            'annulee' => 'red',
            default => 'gray'
        };
    }

    // ========== MÉTHODES ==========

    public function confirmer()
    {
        $this->statut = 'payee';
        $this->save();
        return $this;
    }

    public function annuler()
    {
        $this->statut = 'annulee';
        $this->save();
        return $this;
    }

    public function servir()
    {
        $this->statut = 'servie';
        $this->save();
        return $this;
    }

    public function estAnnulee()
    {
        return $this->statut === 'annulee';
    }

    public function estPayee()
    {
        return $this->statut === 'payee';
    }

    public function estEnAttente()
    {
        return $this->statut === 'en_attente';
    }

    public function estServie()
    {
        return $this->statut === 'servie';
    }
}