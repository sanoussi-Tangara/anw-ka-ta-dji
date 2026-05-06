<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gerant extends Model
{
    use HasFactory;

    protected $table = 'gerants'; // ajustez si nécessaire
    protected $primaryKey = 'id_gerant';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nom',
        'email',
        'station_id', // ou 'id_station' selon votre schéma
    ];

    // Relation vers la Station qu'il gère
    public function station()
    {
        return $this->belongsTo(Station::class, 'station_id');
    }

    // Pompistes rattachés à ce gérant
    public function pompistes()
    {
        return $this->hasMany(Pompiste::class, 'gerant_id', 'id_gerant');
    }

    // Livraisons liées à la station gérée (via pompistes)
    public function livraisons()
    {
        return $this->hasManyThrough(
            Livraison::class,
            Pompiste::class,
            'gerant_id',     // clé étrangère sur pompistes => gerant_id
            'pompiste_id',   // clé étrangère sur livraisons => pompiste_id
            'id_gerant',      // clé locale sur Gerant
            'id_pompiste'     // clé locale sur Pompiste
        );
    }

    // Ventes des pompistes de sa station
    public function ventes()
    {
        return $this->hasManyThrough(
            Vente::class,
            Pompiste::class,
            'gerant_id',     // clé étrangère sur pompistes => gerant_id
            'pompiste_id',   // clé étrangère sur ventes => pompiste_id
            'id_gerant',      // clé locale sur Gerant
            'id_pompiste'     // clé locale sur Pompiste
        );
    }
}
