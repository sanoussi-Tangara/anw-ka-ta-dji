<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pompiste extends Model
{
    protected $primaryKey = 'id_pompiste';

    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'id_utilisateur',
        'id_gerant'
    ];

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function gerant()
    {
        return $this->belongsTo(Gerant::class, 'id_gerant', 'id_gerant');
    }

    // relation avec ventes (important pour la suite)
    public function ventes()
    {
        return $this->hasMany(Vente::class, 'id_pompiste');
    }
}