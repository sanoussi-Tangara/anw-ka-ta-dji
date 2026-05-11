<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificat extends Model
{
    use HasFactory;

    protected $table = 'certificats';
    protected $primaryKey = 'id_certificat';

    protected $fillable = [
        'date_generation',
        'contenu_pdf',
        'signature_icr',
        'signature_chauffeur',
        'id_mission'
    ];

    protected $casts = [
        'date_generation' => 'datetime'
    ];

    // ========== RELATIONS ==========

    // Mission associée
    public function mission()
    {
        return $this->belongsTo(Mission::class, 'id_mission', 'id_mission');
    }

    // ICR via la mission
    public function icr()
    {
        return $this->hasOneThrough(
            Icr::class,
            Mission::class,
            'id_mission',      // clé étrangère sur missions
            'id_icr',          // clé locale sur icr
            'id_mission',      // clé locale sur certificats
            'id_mission'       // clé locale sur missions
        );
    }

    // Chauffeur via la mission
    public function chauffeur()
    {
        return $this->hasOneThrough(
            Chauffeur::class,
            Mission::class,
            'id_mission',
            'id_chauffeur',
            'id_mission',
            'id_mission'
        );
    }

    // ========== ACCESSOIRS ==========

    // Vérifier si le certificat est complètement signé
    public function getEstCompletementSigneAttribute()
    {
        return !empty($this->signature_icr) && !empty($this->signature_chauffeur);
    }

    // Statut du certificat
    public function getStatutAttribute()
    {
        if (empty($this->signature_icr) && empty($this->signature_chauffeur)) {
            return 'non_signe';
        }
        if (!empty($this->signature_icr) && !empty($this->signature_chauffeur)) {
            return 'completement_signe';
        }
        if (!empty($this->signature_icr)) {
            return 'signe_icr_seulement';
        }
        return 'signe_chauffeur_seulement';
    }

    // Statut en texte lisible
    public function getStatutTexteAttribute()
    {
        return match($this->statut) {
            'non_signe' => 'Non signé',
            'signe_icr_seulement' => 'Signé par ICR uniquement',
            'signe_chauffeur_seulement' => 'Signé par chauffeur uniquement',
            'completement_signe' => 'Complètement signé',
            default => 'Inconnu'
        };
    }

    // Couleur du statut
    public function getStatutCouleurAttribute()
    {
        return match($this->statut) {
            'non_signe' => 'red',
            'signe_icr_seulement' => 'orange',
            'signe_chauffeur_seulement' => 'orange',
            'completement_signe' => 'green',
            default => 'gray'
        };
    }

    // Icône du statut
    public function getStatutIconeAttribute()
    {
        return match($this->statut) {
            'non_signe' => '📄',
            'signe_icr_seulement' => '✍️',
            'signe_chauffeur_seulement' => '✍️',
            'completement_signe' => '✅',
            default => '❓'
        };
    }

    // Numéro du certificat (formaté)
    public function getNumeroAttribute()
    {
        return 'CERT-' . str_pad($this->id_certificat, 6, '0', STR_PAD_LEFT);
    }

    // Date de génération formatée
    public function getDateGenerationFormatteeAttribute()
    {
        return $this->date_generation ? $this->date_generation->format('d/m/Y H:i') : null;
    }

    // ========== MÉTHODES ==========

    // Ajouter la signature de l'ICR
    public function signerIcr($signature)
    {
        $this->signature_icr = $signature;
        $this->save();
        
        // Si les deux signatures sont présentes, mettre à jour le statut de la mission ?
        // if ($this->est_completement_signe) {
        //     $this->mission->update(['statut' => 'en_cours']);
        // }
        
        return $this;
    }

    // Ajouter la signature du chauffeur
    public function signerChauffeur($signature)
    {
        $this->signature_chauffeur = $signature;
        $this->save();
        
        return $this;
    }

    // Générer le contenu PDF (à implémenter avec une librairie PDF)
    public function genererPdf()
    {
        // Exemple avec une librairie comme DomPDF ou Barryvdh\Snappy
        // $pdf = \PDF::loadView('certificats.template', ['certificat' => $this]);
        // $filename = 'certificats/certificat_' . $this->id_certificat . '.pdf';
        // \Storage::put($filename, $pdf->output());
        // $this->contenu_pdf = $filename;
        // $this->save();
        
        return $this;
    }

    // Récupérer le contenu du PDF (si stocké)
    public function getPdfUrlAttribute()
    {
        if ($this->contenu_pdf) {
            return asset('storage/' . $this->contenu_pdf);
        }
        return null;
    }

    // Vérifier si le PDF existe
    public function hasPdf()
    {
        return !empty($this->contenu_pdf) && \Storage::exists($this->contenu_pdf);
    }

    // ========== MÉTHODES STATIQUES ==========

    // Créer un certificat pour une mission
    public static function creerPourMission($id_mission)
    {
        return self::create([
            'id_mission' => $id_mission,
            'date_generation' => now()
        ]);
    }

    // Récupérer les certificats non signés
    public static function getNonSignes()
    {
        return self::whereNull('signature_icr')
            ->orWhereNull('signature_chauffeur')
            ->get();
    }

    // Récupérer les certificats complètement signés
    public static function getCompletementSignes()
    {
        return self::whereNotNull('signature_icr')
            ->whereNotNull('signature_chauffeur')
            ->get();
    }
}