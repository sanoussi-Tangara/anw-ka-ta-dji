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
        'nif',
        'statut'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
    
    public function bons(): HasMany
    {
        return $this->hasMany(Bon::class, 'id_fournisseur', 'id_fournisseur');
    }
    
    public function getNomContactAttribute(): string
    {
        return $this->utilisateur->name ?? $this->nom_societe;
    }
    
    public function scopeActif($query)
    {
        return $query->where('statut', 'actif');
    }
}