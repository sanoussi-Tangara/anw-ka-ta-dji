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
        'date_creation',
        'date_disponibilite',
        'statut',
        'signature_fournisseur',
        'photo_compteur',
        'id_fournisseur',
        'id_icr',
        'id_depot',
        'debut_chargement',
        'fin_chargement',
        'motif_annulation'
    ];
    
    protected $casts = [
        'date_creation' => 'datetime',
        'date_disponibilite' => 'datetime',
        'debut_chargement' => 'datetime',
        'fin_chargement' => 'datetime',
        'quantite_commandee' => 'decimal:2',
        'quantite_chargee' => 'decimal:2'
    ];
    
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
    
    public function isCancellable(): bool
    {
        return !in_array($this->statut, ['termine', 'annule', 'en_cours']);
    }
}