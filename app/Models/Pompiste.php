<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pompiste extends Model
{
    protected $primaryKey = 'id_pompiste';
    
    protected $fillable = [
        'id_utilisateur',
        'id_gerant'
    ];

    // 🔹 Relation avec l'utilisateur (héritage)
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    // 🔹 Relation avec le gérant (créateur du compte)
    public function gerant()
    {
        return $this->belongsTo(Gerant::class, 'id_gerant', 'id_gerant');
    }

    // 🔹 Relation avec les ventes (pour le suivi)
    public function ventes()
    {
        return $this->hasMany(Vente::class, 'id_pompiste', 'id_pompiste');
    }

    // 🔹 Raccourcis d'accès aux informations
    public function getNomAttribute()
    {
        return $this->utilisateur->nom;
    }

    public function getPrenomAttribute()
    {
        return $this->utilisateur->prenom;
    }

    public function getEmailAttribute()
    {
        return $this->utilisateur->email;
    }

    public function getTelephoneAttribute()
    {
        return $this->utilisateur->telephone;
    }

    public function getStationAttribute()
    {
        return $this->gerant->station;
    }

    // 🔹 Calcul du total des ventes du jour
    public function totalVentesJour($date = null)
    {
        $date = $date ?? date('Y-m-d');
        return $this->ventes()
            ->whereDate('date_vente', $date)
            ->sum('montant');
    }

    // 🔹 Calcul du total des ventes par période (6h-12h, etc.)
    public function totalVentesParPeriode($periode)
    {
        return $this->ventes()
            ->where('periode', $periode)
            ->sum('montant');
    }
}