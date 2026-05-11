<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Camion extends Model
{
    use HasFactory;

    protected $table = 'camions';
    protected $primaryKey = 'id_camion';

    protected $fillable = [
        'immatriculation',
        'capacite',
        'type_carburant',
        'statut',
        'id_chauffeur'
    ];

    // ========== RELATIONS ==========

    // Chauffeur assigné au camion
    public function chauffeur()
    {
        return $this->belongsTo(Chauffeur::class, 'id_chauffeur', 'id_chauffeur');
    }

    // Missions effectuées par ce camion
    public function missions()
    {
        return $this->hasMany(Mission::class, 'id_camion', 'id_camion');
    }

    // ========== ACCESSOIRS ==========

    // Statut en texte lisible
    public function getStatutTexteAttribute()
    {
        return match($this->statut) {
            'disponible' => 'Disponible',
            'en_mission' => 'En mission',
            'en_panne' => 'En panne',
            default => $this->statut
        };
    }

    // Couleur du statut
    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'disponible' => 'green',
            'en_mission' => 'orange',
            'en_panne' => 'red',
            default => 'gray'
        };
    }

    // Icône du statut
    public function getStatutIconeAttribute()
    {
        return match($this->statut) {
            'disponible' => '✅',
            'en_mission' => '🚚',
            'en_panne' => '🔧',
            default => '❓'
        };
    }

    // Type de carburant en texte lisible
    public function getTypeCarburantTexteAttribute()
    {
        return $this->type_carburant === 'essence' ? 'Essence' : 'Gasoil';
    }

    // Informations complètes du camion
    public function getInfoAttribute()
    {
        return "{$this->immatriculation} - {$this->type_carburant_texte} - {$this->statut_texte}";
    }

    // Nombre de missions effectuées
    public function getNombreMissionsAttribute()
    {
        return $this->missions()->count();
    }

    // Nombre de missions en cours
    public function getMissionsEnCoursAttribute()
    {
        return $this->missions()->where('statut', 'en_cours')->count();
    }

    // ========== MÉTHODES ==========

    // Vérifier si le camion est disponible
    public function estDisponible()
    {
        return $this->statut === 'disponible';
    }

    // Mettre le camion en mission
    public function mettreEnMission()
    {
        if (!$this->estDisponible()) {
            throw new \Exception('Le camion n\'est pas disponible');
        }
        $this->statut = 'en_mission';
        $this->save();
        return $this;
    }

    // Mettre le camion en panne
    public function mettreEnPanne()
    {
        $this->statut = 'en_panne';
        $this->save();
        return $this;
    }

    // Remettre le camion disponible
    public function rendreDisponible()
    {
        $this->statut = 'disponible';
        $this->save();
        return $this;
    }

    // Vérifier si le camion est en panne
    public function estEnPanne()
    {
        return $this->statut === 'en_panne';
    }

    // Vérifier si le camion est en mission
    public function estEnMission()
    {
        return $this->statut === 'en_mission';
    }

    // Vérifier si le camion peut transporter une certaine quantité
    public function peutTransporter($quantite)
    {
        return $this->capacite >= $quantite;
    }

    // ========== MÉTHODES STATIQUES ==========

    // Récupérer tous les camions disponibles
    public static function getDisponibles()
    {
        return self::where('statut', 'disponible')
            ->with('chauffeur.user')
            ->get();
    }

    // Récupérer les camions par type de carburant
    public static function getByTypeCarburant($type)
    {
        return self::where('type_carburant', $type)
            ->with('chauffeur.user')
            ->get();
    }

    // Compter les camions par statut
    public static function getStatistiques()
    {
        return [
            'disponible' => self::where('statut', 'disponible')->count(),
            'en_mission' => self::where('statut', 'en_mission')->count(),
            'en_panne' => self::where('statut', 'en_panne')->count(),
            'total' => self::count()
        ];
    }

    // Récupérer un camion par immatriculation
    public static function findByImmatriculation($immatriculation)
    {
        return self::where('immatriculation', $immatriculation)->first();
    }
}