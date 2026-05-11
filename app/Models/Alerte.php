<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    use HasFactory;

    protected $table = 'alertes';
    protected $primaryKey = 'id_alerte';

    protected $fillable = [
        'type',
        'message',
        'date_creation',
        'statut',
        'id_destinataire'
    ];

    protected $casts = [
        'date_creation' => 'datetime'
    ];

    // ========== RELATIONS ==========

    // Destinataire de l'alerte (gérant, manager, etc.)
    public function destinataire()
    {
        return $this->belongsTo(User::class, 'id_destinataire', 'id_utilisateur');
    }

    // ========== ACCESSEURS ==========

    // Couleur selon le type (pour l'affichage)
    public function getCouleurAttribute()
    {
        return match($this->type) {
            'stock_faible' => 'orange',
            'ecart_livraison' => 'red',
            'probleme_consommateur' => 'yellow',
            default => 'blue'
        };
    }

    // Icône selon le type
    public function getIconeAttribute()
    {
        return match($this->type) {
            'stock_faible' => '📉',
            'ecart_livraison' => '⚠️',
            'probleme_consommateur' => '📢',
            default => '🔔'
        };
    }

    // ========== MÉTHODES ==========

    // Marquer comme lue
    public function marquerLue()
    {
        $this->statut = 'lue';
        $this->save();
        return $this;
    }

    // Marquer comme traitée
    public function marquerTraitee()
    {
        $this->statut = 'traitee';
        $this->save();
        return $this;
    }

    // Vérifier si l'alerte est lue
    public function estLue()
    {
        return $this->statut === 'lue';
    }

    // Vérifier si l'alerte est traitée
    public function estTraitee()
    {
        return $this->statut === 'traitee';
    }

    // ========== MÉTHODES STATIQUES (CRÉATION) ==========

    // Créer une alerte de stock faible
    public static function stockFaible($destinataireId, $stationNom, $typeCarburant, $quantite)
    {
        return self::create([
            'type' => 'stock_faible',
            'message' => "Stock faible à la station {$stationNom} : plus que {$quantite} litres de {$typeCarburant}",
            'date_creation' => now(),
            'statut' => 'non_lue',
            'id_destinataire' => $destinataireId
        ]);
    }

    // Créer une alerte d'écart de livraison
    public static function ecartLivraison($destinataireId, $livraisonId, $ecart)
    {
        return self::create([
            'type' => 'ecart_livraison',
            'message' => "Écart de livraison : {$ecart} litres manquants sur la livraison #{$livraisonId}",
            'date_creation' => now(),
            'statut' => 'non_lue',
            'id_destinataire' => $destinataireId
        ]);
    }

    // Créer une alerte de problème signalé par consommateur
    public static function problemeConsommateur($destinataireId, $message)
    {
        return self::create([
            'type' => 'probleme_consommateur',
            'message' => $message,
            'date_creation' => now(),
            'statut' => 'non_lue',
            'id_destinataire' => $destinataireId
        ]);
    }
}