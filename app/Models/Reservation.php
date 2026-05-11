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
        'date_reservation',
        'date_retrait',
        'statut',
        'id_consommateur',
        'id_station'
    ];

    protected $casts = [
        'date_reservation' => 'datetime',
        'date_retrait' => 'datetime',
        'quantite' => 'decimal:2'
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
            'en_attente' => 'En attente',
            'confirmee' => 'Confirmée',
            'annulee' => 'Annulée',
            default => $this->statut
        };
    }

    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'en_attente' => 'orange',
            'confirmee' => 'green',
            'annulee' => 'red',
            default => 'gray'
        };
    }

    // ========== MÉTHODES ==========

    public function confirmer()
    {
        $this->statut = 'confirmee';
        $this->save();
        return $this;
    }

    public function annuler()
    {
        $this->statut = 'annulee';
        $this->save();
        return $this;
    }

    public function estAnnulee()
    {
        return $this->statut === 'annulee';
    }

    public function estConfirmee()
    {
        return $this->statut === 'confirmee';
    }

    public function estEnAttente()
    {
        return $this->statut === 'en_attente';
    }
}