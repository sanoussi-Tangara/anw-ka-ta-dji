<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id_notification';
    
    protected $fillable = [
        'titre',
        'message',
        'date_envoi',
        'lu',
        'id_destinataire'
    ];

    protected $casts = [
        'date_envoi' => 'datetime',
        'lu' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relation avec l'utilisateur destinataire
     */
    public function destinataire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_destinataire', 'id_utilisateur');
    }

    /**
     * Marquer la notification comme lue
     */
    public function marquerCommeLue(): void
    {
        $this->update(['lu' => true]);
    }

    /**
     * Marquer la notification comme non lue
     */
    public function marquerCommeNonLue(): void
    {
        $this->update(['lu' => false]);
    }

    /**
     * Vérifier si la notification est lue
     */
    public function estLue(): bool
    {
        return (bool) $this->lu;
    }

    /**
     * Créer une notification (méthode statique)
     */
    public static function envoyer(int $idDestinataire, string $titre, string $message): self
    {
        return self::create([
            'titre' => $titre,
            'message' => $message,
            'date_envoi' => now(),
            'lu' => false,
            'id_destinataire' => $idDestinataire
        ]);
    }

    /**
     * Envoyer une notification à plusieurs destinataires
     */
    public static function envoyerMultiple(array $idsDestinataires, string $titre, string $message): array
    {
        $notifications = [];
        foreach ($idsDestinataires as $idDestinataire) {
            $notifications[] = self::envoyer($idDestinataire, $titre, $message);
        }
        return $notifications;
    }

    /**
     * Récupérer les notifications non lues d'un utilisateur
     */
    public static function nonLuesPourUtilisateur(int $idUtilisateur)
    {
        return self::where('id_destinataire', $idUtilisateur)
            ->where('lu', false)
            ->orderBy('date_envoi', 'desc')
            ->get();
    }

    /**
     * Scope pour les notifications non lues
     */
    public function scopeNonLues($query)
    {
        return $query->where('lu', false);
    }

    /**
     * Scope pour les notifications lues
     */
    public function scopeLues($query)
    {
        return $query->where('lu', true);
    }

    /**
     * Scope pour les notifications récentes (derniers X jours)
     */
    public function scopeRecentes($query, int $jours = 7)
    {
        return $query->where('date_envoi', '>=', now()->subDays($jours));
    }
}