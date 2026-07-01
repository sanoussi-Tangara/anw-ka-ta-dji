<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificat de Transport | Anw Ka Ta Djì</title>
    <style>
        /* --- CONFIGURATION GENERALE --- */
        @page {
            margin: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            line-height: 1.4;
            font-size: 11px;
            background-color: #ffffff;
            margin: 0;
            padding: 40px;
        }

        /* --- FILIGRANE & DECORATION --- */
        .top-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%);
        }

        /* --- EN-TETE --- */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
        }
        .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #ff6b00;
            letter-spacing: 1px;
            margin: 0;
        }
        .brand-subtitle {
            font-size: 10px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 2px;
        }
        .doc-info {
            text-align: right;
        }
        .doc-id {
            font-size: 14px;
            font-weight: bold;
            color: #1a202c;
            margin: 0;
        }
        .doc-date {
            font-size: 10px;
            color: #718096;
            margin-top: 4px;
        }

        /* --- SECTIONS --- */
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #ff6b00;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #edf2f7;
        }

        /* --- TABLEAUX DE DONNÉES --- */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .data-table td {
            padding: 7px 10px;
            vertical-align: middle;
            border-bottom: 1px solid #f7fafc;
            width: 50%;
        }
        .label {
            font-weight: 600;
            color: #4a5568;
            font-size: 10.5px;
        }
        .value {
            color: #1a202c;
            text-align: right;
            font-size: 11px;
        }
        .highlight {
            font-weight: bold;
            color: #ff6b00;
        }
        .badge-code {
            background-color: #f7fafc;
            border: 1px dashed #cbd5e0;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
        }

        /* --- STATION DE LIVRAISON --- */
        .station-section {
            background: #fef9f4;
            border: 2px solid #ff6b00;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .station-section .section-title {
            border-bottom-color: #ff6b00;
            color: #ff6b00;
        }
        .station-item {
            border-bottom: 1px solid #f0e6d8;
            padding: 10px 0;
        }
        .station-item:last-child {
            border-bottom: none;
        }
        .station-name {
            font-size: 14px;
            font-weight: 700;
            color: #1a202c;
        }
        .station-address {
            font-size: 11px;
            color: #4a5568;
            margin-top: 2px;
        }
        .station-gerant {
            font-size: 10px;
            color: #718096;
            margin-top: 2px;
        }
        .station-quantity {
            font-size: 13px;
            font-weight: 700;
            color: #ff6b00;
            text-align: right;
        }
        .station-status {
            text-align: right;
            margin-top: 3px;
        }
        .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-success {
            background: #c6f6d5;
            color: #22543d;
        }
        .badge-warning {
            background: #fefcbf;
            color: #744210;
        }
        .badge-info {
            background: #bee3f8;
            color: #2a4365;
        }
        .station-code {
            font-family: monospace;
            font-size: 11px;
            color: #ff6b00;
            font-weight: bold;
        }

        /* --- SIGNATURES --- */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .signature-card {
            width: 48%;
            border: 1px solid #edf2f7;
            border-radius: 6px;
            background-color: #fcfcfc;
            padding: 12px;
        }
        .signature-title {
            font-weight: 700;
            color: #2d3748;
            font-size: 11px;
            margin-bottom: 8px;
        }
        .signature-box {
            border: 1px dashed #e2e8f0;
            background-color: #ffffff;
            border-radius: 4px;
            height: 70px;
            text-align: center;
            vertical-align: middle;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-box img {
            max-height: 60px;
            max-width: 100%;
        }
        .signature-box .empty {
            color: #a0aec0;
            font-style: italic;
            font-size: 10px;
        }
        .status-text {
            text-align: center;
            font-size: 10px;
            font-weight: 600;
            margin-top: 8px;
        }
        .text-signed { color: #38a169; }
        .text-pending { color: #dd6b20; }

        /* --- STATUT GLOBAL --- */
        .status-bar {
            margin-top: 25px;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-complete { background-color: #f0fff4; border-left: 4px solid #38a169; color: #276749; }
        .status-waiting { background-color: #fffaf0; border-left: 4px solid #dd6b20; color: #9c4221; }
        .status-alert { background-color: #fff5f5; border-left: 4px solid #e53e3e; color: #9b2c2c; }

        /* --- FOOTER --- */
        .footer {
            position: absolute;
            bottom: 40px;
            left: 40px;
            right: 40px;
            text-align: center;
            border-top: 1px solid #edf2f7;
            padding-top: 15px;
        }
        .footer p {
            margin: 2px 0;
            font-size: 9px;
            color: #a0aec0;
        }
        .footer-brand {
            font-weight: 700;
            color: #4a5568 !important;
        }

        .keep-together {
            page-break-inside: avoid;
        }

        /* --- RESPONSIVE --- */
        @media print {
            body { padding: 30px; }
            .station-section { break-inside: avoid; }
            .signature-table { break-inside: avoid; }
        }
    </style>
</head>
<body>

    <div class="top-bar"></div>

    <!-- ============================================================ -->
    <!-- EN-TÊTE -->
    <!-- ============================================================ -->
    <table class="header-table">
        <tr>
            <td>
                <h1 class="brand-title">ANW KA TA DJÌ</h1>
                <div class="brand-subtitle">Le carburant intelligent du Mali</div>
            </td>
            <td class="doc-info">
                <p class="doc-id">CERTIFICAT DE TRANSPORT</p>
                <p class="doc-date">N° {{ $certificat->id_certificat ?? 'N/A' }} — Le {{ now()->format('d/m/Y à H:i') }}</p>
            </td>
        </tr>
    </table>

    <!-- ============================================================ -->
    <!-- 1. INFORMATIONS DU BON -->
    <!-- ============================================================ -->
    <div class="keep-together">
        <div class="section-title">Informations du Bon</div>
        <table class="data-table">
            <tr>
                <td class="label">N° Bon</td>
                <td class="value highlight">#{{ $bon->id_bon ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Code de vérification</td>
                <td class="value"><span class="badge-code">{{ $bon->code_verification ?? 'N/A' }}</span></td>
            </tr>
            <tr>
                <td class="label">Type de carburant</td>
                <td class="value">{{ ucfirst($bon->type_carburant ?? 'N/A') }}</td>
            </tr>
            <tr>
                <td class="label">Quantité commandée / chargée</td>
                <td class="value">
                    {{ number_format($bon->quantite_commandee ?? 0, 0, ',', ' ') }} L / 
                    <span class="highlight">{{ number_format($bon->quantite_chargee ?? 0, 0, ',', ' ') }} L</span>
                </td>
            </tr>
            <tr>
                <td class="label">Fournisseur</td>
                <td class="value">{{ $bon->fournisseur->nom_societe ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Dépôt de chargement</td>
                <td class="value">{{ $bon->depot->nom ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <!-- ============================================================ -->
    <!-- 2. ACTEURS & LOGISTIQUE -->
    <!-- ============================================================ -->
    <div class="keep-together">
        <div class="section-title">Acteurs & Logistique</div>
        <table class="data-table">
            <tr>
                <td class="label">Agent ICR</td>
                <td class="value"><strong>{{ $icr->user->prenom ?? '' }} {{ $icr->user->nom ?? '' }}</strong> ({{ $icr->matricule ?? 'N/A' }})</td>
            </tr>
            <tr>
                <td class="label">Chauffeur</td>
                <td class="value"><strong>{{ $chauffeur->user->prenom ?? '' }} {{ $chauffeur->user->nom ?? '' }}</strong></td>
            </tr>
            <tr>
                <td class="label">N° Permis de conduire</td>
                <td class="value">{{ $chauffeur->permis ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Camion (Immatriculation / Capacité)</td>
                <td class="value"><strong>{{ $camion->immatriculation ?? 'N/A' }}</strong> — {{ number_format($camion->capacite ?? 0, 0, ',', ' ') }} L</td>
            </tr>
        </table>
    </div>

    <!-- ============================================================ -->
    <!-- 3. STATION DE LIVRAISON (NOUVEAU) -->
    <!-- ============================================================ -->
    <div class="station-section keep-together">
        <div class="section-title"> Station de livraison</div>
        
        @if(isset($livraisons) && count($livraisons) > 0)
            @foreach($livraisons as $index => $livraison)
                <div class="station-item">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="vertical-align: top; width: 70%;">
                                <div class="station-name"> {{ $livraison->station->nom ?? 'N/A' }}</div>
                                <div class="station-address"> {{ $livraison->station->adresse ?? 'Adresse non renseignée' }}</div>
                                @if(!empty($livraison->station->gerant))
                                    <div class="station-gerant"> Gérant: {{ $livraison->station->gerant->user->prenom ?? '' }} {{ $livraison->station->gerant->user->nom ?? '' }}</div>
                                    <div class="station-gerant"> {{ $livraison->station->gerant->user->telephone ?? 'N/A' }}</div>
                                @endif
                            </td>
                            <td style="vertical-align: top; text-align: right; width: 30%;">
                                <div class="station-quantity">{{ number_format($livraison->quantite_prevue ?? 0, 0, ',', ' ') }} L</div>
                                <div style="font-size: 10px; color: #718096;">Quantité livrée</div>
                                <div class="station-status">
                                    @if(($livraison->statut ?? '') === 'validee')
                                        <span class="badge badge-success"> Validée</span>
                                    @elseif(($livraison->statut ?? '') === 'livree')
                                        <span class="badge badge-info">Livrée</span>
                                    @else
                                        <span class="badge badge-warning"> En attente</span>
                                    @endif
                                </div>
                                @if(!empty($livraison->code_validation))
                                    <div style="font-size: 10px; color: #718096; margin-top: 5px;">
                                        Code: <span class="station-code">{{ $livraison->code_validation }}</span>
                                    </div>
                                @endif
                            </td>
                        </tr>
                    </table>
                </div>
            @endforeach

            <!-- Totaux des livraisons -->
            @php
                $totalPrevues = $livraisons->sum('quantite_prevue');
                $totalLivrees = $livraisons->sum('quantite_livree');
                $nbLivraisons = $livraisons->count();
                $nbValidees = $livraisons->where('statut', 'validee')->count();
            @endphp
            <div style="margin-top: 12px; padding-top: 10px; border-top: 2px solid #ff6b00; background: #fff8f0; border-radius: 4px; padding: 8px 12px;">
                <table style="width: 100%; font-size: 11px;">
                    <tr>
                        <td><strong>Total livraisons:</strong> {{ $nbLivraisons }}</td>
                        <td><strong>Validées:</strong> {{ $nbValidees }}</td>
                        <td style="text-align: right;"><strong>Quantité totale:</strong> {{ number_format($totalPrevues, 0, ',', ' ') }} L</td>
                    </tr>
                </table>
            </div>
        @else
            <div style="text-align: center; color: #a0aec0; padding: 20px 0;">
                <p>Aucune livraison enregistrée pour cette mission</p>
            </div>
        @endif
    </div>

    <!-- ============================================================ -->
    <!-- 4. SIGNATURES -->
    <!-- ============================================================ -->
    <div class="keep-together">
        <div class="section-title">Signatures Numériques</div>
        <table class="signature-table">
            <tr>
                <td class="signature-card">
                    <div class="signature-title">L'Inspecteur Commercial de  Réseau (ICR)</div>
                    <div class="signature-box">
                        @if(!empty($certificat->signature_icr))
                            <img src="data:image/png;base64,{{ $certificat->signature_icr }}" alt="Signature ICR">
                        @else
                            <span class="empty">En attente de signature</span>
                        @endif
                    </div>
                    <div class="status-text">
                        @if(!empty($certificat->signature_icr))
                            <span class="text-signed"> Validé et signé électroniquement</span>
                        @else
                            <span class="text-pending">○ En attente</span>
                        @endif
                    </div>
                </td>

                <td style="width: 4%;"></td>

                <td class="signature-card">
                    <div class="signature-title">Le Chauffeur Transporteur</div>
                    <div class="signature-box">
                        @if(!empty($certificat->signature_chauffeur))
                            <img src="data:image/png;base64,{{ $certificat->signature_chauffeur }}" alt="Signature Chauffeur">
                        @else
                            <span class="empty">En attente de signature</span>
                        @endif
                    </div>
                    <div class="status-text">
                        @if(!empty($certificat->signature_chauffeur))
                            <span class="text-signed"> Validé et signé électroniquement</span>
                        @else
                            <span class="text-pending">○ En attente</span>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        @if(!empty($certificat->signature_icr) && !empty($certificat->signature_chauffeur))
            <div class="status-bar status-complete">
                 Document sécurisé — Certificat de transport complet, intègre et validé par les deux parties.
            </div>
        @elseif(!empty($certificat->signature_icr))
            <div class="status-bar status-waiting">
                ⏳ Document en cours — Validé par l'ICR. En attente de la signature de clôture du chauffeur.
            </div>
        @else
            <div class="status-bar status-alert">
                ❌ Document non validé — En attente des signatures réglementaires pour authentification.
            </div>
        @endif
    </div>

    <!-- ============================================================ -->
    <!-- FOOTER -->
    <!-- ============================================================ -->
    <div class="footer">
        <p class="footer-brand"> Anw Ka Ta Djì — Plateforme intelligente en gestion du    carburant</p>
        <p>Ce document fait foi de certificat officiel de transport de produits pétroliers.</p>
        <p>Généré de manière sécurisée — ID Certificat : {{ $certificat->id_certificat ?? 'N/A' }}</p>
    </div>

</body>
</html>