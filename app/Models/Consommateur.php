<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consommateur extends Model
{
    protected $primaryKey = 'id_consommateur';

    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'id_utilisateur'
    ];

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
}