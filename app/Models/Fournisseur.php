<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fournisseur extends Model
{
    protected $table = 'fournisseurs';
    protected $primaryKey = 'id_fournisseur';

    protected $fillable = [
        'id_utilisateur',
        'nom_societe',
        'adresse',
        'nif'
        // 'statut' supprimé car n'existe pas dans ta table
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // ========== RELATIONS ==========

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function bons(): HasMany
    {
        return $this->hasMany(Bon::class, 'id_fournisseur', 'id_fournisseur');
    }

    // ========== ACCESSOIRS ==========

    public function getNomContactAttribute(): string
    {
        return $this->user->nom ?? $this->nom_societe;
    }

    public function getEmailAttribute(): string
    {
        return $this->user->email ?? '';
    }

    public function getTelephoneAttribute(): string
    {
        return $this->user->telephone ?? '';
    }
}