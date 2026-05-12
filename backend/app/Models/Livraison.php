<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    use HasFactory;

    protected $table = 'livraisons';
    protected $primaryKey = 'id_livraison';

    protected $fillable = [
        'quantite_prevue',
        'quantite_livree',
        'code_validation',
        'date_livraison',
        'signature_gerant',
        'signature_chauffeur',
        'photo_compteur',
        'statut',
        'id_station',
        'id_gerant',
        'id_pompiste'
    ];

    protected $casts = [
        'date_livraison' => 'datetime',
        'quantite_prevue' => 'decimal:2',
        'quantite_livree' => 'decimal:2'
    ];

    // ========== RELATIONS ==========

    // Station livrée
    public function station()
    {
        return $this->belongsTo(Station::class, 'id_station', 'id_station');
    }

    // Gérant qui a reçu la livraison
    public function gerant()
    {
        return $this->belongsTo(Gerant::class, 'id_gerant', 'id_gerant');
    }

    // Pompiste qui a participé (optionnel)
    public function pompiste()
    {
        return $this->belongsTo(Pompiste::class, 'id_pompiste', 'id_pompiste');
    }

    // Mission associée (via la table missions_livraisons si pivot)  a revoir 
    // Si tu as une table pivot missions_livraisons
    public function missions()
    {
        return $this->belongsToMany(Mission::class, 'missions_livraisons', 'id_livraison', 'id_mission');
    }

    // ========== ACCESSOIRS ==========

    // Vérifier si la livraison a un écart
    public function getAEcartAttribute()
    {
        if ($this->quantite_livree === null) return false;
        return $this->quantite_prevue != $this->quantite_livree;
    }

    // Calculer l'écart (positif = manquant, négatif = surplus)
    public function getEcartAttribute()
    {
        if ($this->quantite_livree === null) return null;
        return $this->quantite_prevue - $this->quantite_livree;
    }

    // Écart en valeur absolue
    public function getEcartAbsoluAttribute()
    {
        return abs($this->ecart);
    }

    // Statut en texte lisible
    public function getStatutTexteAttribute()
    {
        return match($this->statut) {
            'en_attente' => 'En attente',
            'validee' => 'Validée',
            'ecart' => 'Écart constaté',
            default => $this->statut
        };
    }

    // Couleur du statut
    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'en_attente' => 'orange',
            'validee' => 'green',
            'ecart' => 'red',
            default => 'gray'
        };
    }

    // Icône du statut
    public function getStatutIconeAttribute()
    {
        return match($this->statut) {
            'en_attente' => '⏳',
            'validee' => '✅',
            'ecart' => '⚠️',
            default => '❓'
        };
    }

    // Date de livraison formatée
    public function getDateLivraisonFormatteeAttribute()
    {
        return $this->date_livraison ? $this->date_livraison->format('d/m/Y H:i') : null;
    }

    // Taux de livraison (pourcentage)
    public function getTauxLivraisonAttribute()
    {
        if ($this->quantite_prevue == 0) return 0;
        return round(($this->quantite_livree / $this->quantite_prevue) * 100, 2);
    }

    // ========== MÉTHODES ==========

    // Valider la livraison
    public function valider($quantite_livree, $signatureGerant, $signatureChauffeur, $photo = null)
    {
        $this->quantite_livree = $quantite_livree;
        $this->signature_gerant = $signatureGerant;
        $this->signature_chauffeur = $signatureChauffeur;
        $this->date_livraison = now();
        
        if ($photo) {
            $this->photo_compteur = $photo;
        }
        
        // Déterminer le statut
        if ($quantite_livree == $this->quantite_prevue) {
            $this->statut = 'validee';
        } else {
            $this->statut = 'ecart';
        }
        
        $this->save();
        
        // Mettre à jour le stock de la station
        $this->mettreAJourStock();
        
        return $this;
    }

    // Mettre à jour le stock de la station
    protected function mettreAJourStock()
    {
        if ($this->quantite_livree && $this->station) {
            $mission = $this->missions()->first();
            if ($mission && $mission->bon) {
                $typeCarburant = $mission->bon->type_carburant;
                
                $stock = Stock::where('id_station', $this->id_station)
                    ->where('type_carburant', $typeCarburant)
                    ->first();
                    
                if ($stock) {
                    $stock->quantite += $this->quantite_livree;
                    $stock->date_mise_a_jour = now();
                    $stock->save();
                }
            }
        }
    }

    // Signaler un écart
    public function signalerEcart($quantite_livree, $commentaire = null)
    {
        $this->quantite_livree = $quantite_livree;
        $this->statut = 'ecart';
        $this->date_livraison = now();
        $this->save();
        
        // Créer une alerte
        $this->creerAlerteEcart($commentaire);
        
        return $this;
    }

    // Créer une alerte d'écart
    protected function creerAlerteEcart($commentaire = null)
    {
        $mission = $this->missions()->first();
        if ($mission && $mission->icr && $mission->icr->user) {
            $message = "Écart sur livraison #{$this->id_livraison} : prévu {$this->quantite_prevue}L, reçu {$this->quantite_livree}L";
            if ($commentaire) {
                $message .= " - " . $commentaire;
            }
            
            Alerte::create([
                'type' => 'ecart_livraison',
                'message' => $message,
                'date_creation' => now(),
                'statut' => 'non_lue',
                'id_destinataire' => $mission->icr->user->id_utilisateur
            ]);
        }
    }

    // Vérifier le code de validation
    public function verifierCode($code)
    {
        return $this->code_validation === $code;
    }

    // ========== MÉTHODES STATIQUES ==========

    // Livraisons en attente pour un gérant
    public static function getEnAttenteForGerant($id_gerant)
    {
        return self::where('id_gerant', $id_gerant)
            ->where('statut', 'en_attente')
            ->with('station')
            ->get();
    }

    // Livraisons avec écart
    public static function getAvecEcart()
    {
        return self::where('statut', 'ecart')
            ->with(['station', 'gerant.user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // Statistiques des livraisons par statut
    public static function getStatistiques()
    {
        return [
            'en_attente' => self::where('statut', 'en_attente')->count(),
            'validee' => self::where('statut', 'validee')->count(),
            'ecart' => self::where('statut', 'ecart')->count(),
            'total' => self::count()
        ];
    }

    // Livraisons d'une mission spécifique
    public static function getByMission($id_mission)
    {
        return self::whereHas('missions', function($q) use ($id_mission) {
            $q->where('id_mission', $id_mission);
        })->get();
    }
}