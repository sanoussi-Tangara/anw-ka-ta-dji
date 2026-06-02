<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bon extends Model
{
    protected $table = 'bons';
    protected $primaryKey = 'id_bon';

    protected $fillable = [
        'code_verification',
        'type_carburant',
        'quantite_commandee',
        'quantite_chargee',
        'debut_chargement',      // ← AJOUTER
        'fin_chargement',        // ← AJOUTER
        'date_creation',
        'date_disponibilite',
        'statut',
        'signature_fournisseur',
        'photo_compteur',
        'id_fournisseur',
        'id_icr',
        'id_depot',
        'date_transmission'
        
    ];

    protected $casts = [
        'date_creation' => 'datetime',
        'date_disponibilite' => 'datetime',
        'quantite_commandee' => 'decimal:2',
        'quantite_chargee' => 'decimal:2'
        
    ];

    // ========== RELATIONS ==========

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'id_fournisseur', 'id_fournisseur');
    }

    public function icr(): BelongsTo
    {
        return $this->belongsTo(Icr::class, 'id_icr', 'id_icr');
    }

    public function depot(): BelongsTo
    {
        return $this->belongsTo(Depot::class, 'id_depot', 'id_depot');
    }

    // ========== ACCESSOIRS ==========

    public function getStatutLibelleAttribute(): string
    {
        return match($this->statut) {
            'cree' => 'Créé',
            'signe' => 'Signé',
            'en_cours' => 'En cours',
            'termine' => 'Terminé',
            'annule' => 'Annulé',
            default => 'Inconnu'
        };
    }

    public function getTypeCarburantLibelleAttribute(): string
    {
        return $this->type_carburant === 'essence' ? 'Essence' : 'Gasoil';
    }

    public function getQuantiteChargeeOuCommandeeAttribute(): float
    {
        return $this->quantite_chargee ?? $this->quantite_commandee;
    }

    // ========== MÉTHODES ==========

    public function isCancellable(): bool
    {
        return !in_array($this->statut, ['termine', 'en_cours']);
    }

    public function isEditable(): bool
    {
        return in_array($this->statut, ['cree', 'signe']);
    }

    public function getProgression(): int
    {
        return match($this->statut) {
            'termine' => 100,
            'en_cours' => 75,
            'signe' => 50,
            'cree' => 25,
            'annule' => 0,
            default => 10
        };
    }
}