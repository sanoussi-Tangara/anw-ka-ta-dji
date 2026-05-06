<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vente extends Model
{
     protected $fillable = ['pompiste_id','station_id','produit','quantite','prix','date'];

    public function pompiste()
    {
        return $this->belongsTo(Pompiste::class);
    }

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}
