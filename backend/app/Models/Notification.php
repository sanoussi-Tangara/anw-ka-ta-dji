<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

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
        'lu' => 'boolean'
    ];

    // ========== RELATIONS ==========

    public function destinataire()
    {
        return $this->belongsTo(User::class, 'id_destinataire', 'id_utilisateur');
    }

    // ========== ACCESSOIRS ==========

    public function getEstLueAttribute()
    {
        return $this->lu;
    }

    public function getDateEnvoiFormateeAttribute()
    {
        return $this->date_envoi ? $this->date_envoi->format('d/m/Y H:i') : null;
    }

    // ========== MÉTHODES ==========

    public function marquerCommeLue()
    {
        $this->lu = true;
        $this->save();
        return $this;
    }

    public function marquerCommeNonLue()
    {
        $this->lu = false;
        $this->save();
        return $this;
    }

    // ========== MÉTHODES STATIQUES ==========

    public static function envoyer($destinataireId, $titre, $message)
    {
        return self::create([
            'id_destinataire' => $destinataireId,
            'titre' => $titre,
            'message' => $message,
            'date_envoi' => now(),
            'lu' => false
        ]);
    }

    public static function getNonLues($destinataireId)
    {
        return self::where('id_destinataire', $destinataireId)
            ->where('lu', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public static function getToutes($destinataireId)
    {
        return self::where('id_destinataire', $destinataireId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}