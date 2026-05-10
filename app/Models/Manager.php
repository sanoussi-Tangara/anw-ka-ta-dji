<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Manager extends Model
{
    protected $table = 'managers';
    protected $primaryKey = 'id_manager';
    
    protected $fillable = [
        'id_utilisateur',
        'niveau_acces'
    ];
    
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
    
    public function hasAccess($fonctionnalite): bool
    {
        if ($this->niveau_acces === 'national') {
            return true;
        }
        return false;
    }
}