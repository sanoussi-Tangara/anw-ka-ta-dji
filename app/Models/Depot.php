<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Depot extends Model
{
    // Nom de la table et clé primaire personnalisés
    protected $table = 'depots';
    protected $primaryKey = 'id_depot';
    public $incrementing = true;
    protected $keyType = 'int';

    // Dates gérées par Eloquent (timestamps fournis)
    public $timestamps = true;

    // Champs pouvant être mass-assignés
    protected $fillable = [
        'nom',
        'localisation',
        'id_responsable',
    ];

    // Casts utiles
    protected $casts = [
        'nom' => 'string',
        'localisation' => 'string',
        'id_responsable' => 'integer',
    ];

    // Relations
    public function responsable()
    {
        // Ajustez la clé étrangère et la clé locale selon votre schéma
        // Par défaut: depots.id_responsable -> responsables_depot.id_responsable
        return $this->belongsTo(ResponsableDepot::class, 'id_responsable', 'id_responsable');
        // Si la table cible est différente, adaptez les noms
    }
}
