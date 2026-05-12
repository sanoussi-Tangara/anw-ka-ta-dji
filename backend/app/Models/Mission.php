<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    use HasFactory;

    protected $table = 'missions';
    protected $primaryKey = 'id_mission';

    protected $fillable = [
        'date_debut',
        'date_fin',
        'statut',
        'id_bon',
        'id_icr',
        'id_chauffeur',
        'id_camion'
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime'
    ];

    // ========== RELATIONS ==========

    // Bon d'enlèvement associé
    public function bon()
    {
        return $this->belongsTo(Bon::class, 'id_bon', 'id_bon');
    }

    // ICR qui a organisé la mission
    public function icr()
    {
        return $this->belongsTo(Icr::class, 'id_icr', 'id_icr');
    }

    // Chauffeur assigné
    public function chauffeur()
    {
        return $this->belongsTo(Chauffeur::class, 'id_chauffeur', 'id_chauffeur');
    }

    // Camion utilisé
    public function camion()
    {
        return $this->belongsTo(Camion::class, 'id_camion', 'id_camion');
    }

    // Livraisons de la mission
    public function livraisons()
    {
        return $this->hasMany(Livraison::class, 'id_mission', 'id_mission');
    }

    // Certificat de la mission
    public function certificat()
    {
        return $this->hasOne(Certificat::class, 'id_mission', 'id_mission');
    }

    // ========== ACCESSOIRS ==========

    // Nombre total de livraisons
    public function getNombreLivraisonsAttribute()
    {
        return $this->livraisons()->count();
    }

    // Nombre de livraisons validées
    public function getLivraisonsValideesAttribute()
    {
        return $this->livraisons()->where('statut', 'validee')->count();
    }

    // Progression de la mission (en pourcentage)
    public function getProgressionAttribute()
    {
        $total = $this->nombre_livraisons;
        if ($total === 0) return 0;
        return round(($this->livraisons_validees / $total) * 100);
    }

    // Quantité totale prévue
    public function getQuantiteTotalePrevueAttribute()
    {
        return $this->livraisons()->sum('quantite_prevue');
    }

    // Quantité totale livrée
    public function getQuantiteTotaleLivreeAttribute()
    {
        return $this->livraisons()->sum('quantite_livree');
    }

    // Statut en texte lisible
    public function getStatutTexteAttribute()
    {
        return match($this->statut) {
            'planifiee' => 'Planifiée',
            'en_cours' => 'En cours',
            'terminee' => 'Terminée',
            'annulee' => 'Annulée',
            default => $this->statut
        };
    }

    // Couleur du statut
    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'planifiee' => 'blue',
            'en_cours' => 'orange',
            'terminee' => 'green',
            'annulee' => 'red',
            default => 'gray'
        };
    }

    // Icône du statut
    public function getStatutIconeAttribute()
    {
        return match($this->statut) {
            'planifiee' => '📋',
            'en_cours' => '🚚',
            'terminee' => '✅',
            'annulee' => '❌',
            default => '❓'
        };
    }

    // Durée de la mission (en heures)
    public function getDureeAttribute()
    {
        if ($this->date_debut && $this->date_fin) {
            return $this->date_debut->diffInHours($this->date_fin);
        }
        return null;
    }

    // ========== MÉTHODES ==========

    // Démarrer la mission
    public function demarrer()
    {
        if ($this->statut !== 'planifiee') {
            throw new \Exception('Seule une mission planifiée peut être démarrée');
        }
        
        $this->statut = 'en_cours';
        $this->date_debut = now();
        $this->save();
        
        return $this;
    }

    // Terminer la mission
    public function terminer()
    {
        if ($this->statut !== 'en_cours') {
            throw new \Exception('Seule une mission en cours peut être terminée');
        }
        
        // Vérifier que toutes les livraisons sont validées
        $livraisonsNonValidees = $this->livraisons()
            ->where('statut', '!=', 'validee')
            ->count();
            
        if ($livraisonsNonValidees > 0) {
            throw new \Exception('Toutes les livraisons doivent être validées');
        }
        
        $this->statut = 'terminee';
        $this->date_fin = now();
        $this->save();
        
        return $this;
    }

    // Annuler la mission
    public function annuler()
    {
        if (!in_array($this->statut, ['planifiee', 'en_cours'])) {
            throw new \Exception('Cette mission ne peut pas être annulée');
        }
        
        $this->statut = 'annulee';
        $this->save();
        
        return $this;
    }

    // Vérifier si la mission est terminable
    public function estTerminable()
    {
        if ($this->statut !== 'en_cours') return false;
        
        $livraisonsNonValidees = $this->livraisons()
            ->where('statut', '!=', 'validee')
            ->count();
            
        return $livraisonsNonValidees === 0;
    }

    // Récupérer la prochaine livraison à effectuer
    public function prochaineLivraison()
    {
        return $this->livraisons()
            ->where('statut', 'en_attente')
            ->orderBy('id_livraison')
            ->first();
    }

    // ========== MÉTHODES STATIQUES ==========

    // Missions en cours pour un chauffeur
    public static function getEnCoursForChauffeur($id_chauffeur)
    {
        return self::where('id_chauffeur', $id_chauffeur)
            ->where('statut', 'en_cours')
            ->first();
    }

    // Missions planifiées pour un ICR
    public static function getPlanifieesForIcr($id_icr)
    {
        return self::where('id_icr', $id_icr)
            ->where('statut', 'planifiee')
            ->get();
    }
}