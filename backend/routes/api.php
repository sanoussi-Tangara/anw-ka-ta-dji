<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ManagerController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\StationController;
use App\Http\Controllers\API\DepotController;
use App\Http\Controllers\API\ResponsableDepotController;
use App\Http\Controllers\API\FournisseurController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\IcrController; 
use App\Http\Controllers\API\CertificatController;  
use App\Http\Controllers\API\MissionController;
use App\Http\Controllers\API\ChauffeurController;
use App\Http\Controllers\API\GerantController;
use App\Http\Controllers\API\PompisteController;
use App\Http\Controllers\API\ConsommateurController;
use App\Http\Controllers\API\AdministrateurController;
use App\Http\Controllers\API\ReservationController;
use App\Http\Controllers\API\PaiementController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

Route::get('test', function () {
    return response()->json([
        'message' => 'Laravel API fonctionne'
    ]);
});

// ==============================================
// 🔹 ROUTES PROTÉGÉES PAR AUTHENTIFICATION
// ==============================================
Route::middleware('auth:sanctum')->group(function () {
    
    // ========== NOTIFICATIONS (PLACÉES ICI) ==========
    Route::prefix('notifications')->group(function () {
        // Routes spécifiques (sans paramètre) AVANT la route avec paramètre
        Route::get('/non-lues', [NotificationController::class, 'nonLues']);
        Route::get('/statistiques', [NotificationController::class, 'statistiques']);
        Route::put('/lire-toutes', [NotificationController::class, 'marquerToutesLues']);
        Route::delete('/supprimer/toutes', [NotificationController::class, 'deleteAll']);
        Route::post('/envoyer', [NotificationController::class, 'envoyer']);
        
        // Route avec paramètre APRÈS les routes spécifiques
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/{id}', [NotificationController::class, 'show']);
        Route::put('/{id}/lire', [NotificationController::class, 'marquerLue']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });
    
    // ========== ROUTES STATIONS PROTÉGÉES ==========
    Route::prefix('stations')->group(function () {
        // CRUD (création, modification, suppression)
        Route::post('/', [StationController::class, 'store']);
        Route::put('{id_station}', [StationController::class, 'update']);
        Route::delete('{id_station}', [StationController::class, 'destroy']);
        
        // Stocks
        Route::get('stocks/{id_station}', [StationController::class, 'voirStocks']);
        Route::put('stocks/{id_station}', [StationController::class, 'updateStock']);
        Route::get('disponibilite/{id_station}', [StationController::class, 'checkDisponibilite']);
        
        // Gérant
        Route::post('affecter-gerant/{id_station}', [StationController::class, 'affecterGerant']);
        Route::delete('retirer-gerant/{id_station}', [StationController::class, 'retirerGerant']);
        
        // Ventes, livraisons, réservations
        Route::get('ventes/{id_station}', [StationController::class, 'voirVentes']);
        Route::get('livraisons/{id_station}', [StationController::class, 'voirLivraisons']);
        Route::get('reservations/{id_station}', [StationController::class, 'voirReservations']);
        
        // Statistiques
        Route::get('statistiques/{id_station}', [StationController::class, 'statistiques']);
    });
    
    // ========== ROUTES DÉPÔTS ==========
    Route::prefix('depots')->group(function () {
        // CRUD
        Route::get('/', [DepotController::class, 'index']);
        Route::get('{id_depot}', [DepotController::class, 'show']);
        Route::post('/', [DepotController::class, 'store']);
        Route::put('{id_depot}', [DepotController::class, 'update']);
        Route::delete('{id_depot}', [DepotController::class, 'destroy']);
        
        // Stocks
        Route::get('stocks/{id_depot}', [DepotController::class, 'voirStocks']);
        Route::put('stocks/{id_depot}', [DepotController::class, 'updateStock']);
        Route::get('disponibilite/{id_depot}/{type_carburant}', [DepotController::class, 'checkDisponibilite']);
        
        // Bons
        Route::get('bons/{id_depot}', [DepotController::class, 'voirBons']);
        Route::get('bons/{id_depot}/{statut}', [DepotController::class, 'voirBonsByStatut']);
        
        // Responsable
        Route::post('affecter-responsable/{id_depot}', [DepotController::class, 'affecterResponsable']);
        Route::delete('retirer-responsable/{id_depot}', [DepotController::class, 'retirerResponsable']);
        
        // Statistiques
        Route::get('statistiques/globales', [DepotController::class, 'statistiques']);
        Route::get('dashboard', [DepotController::class, 'dashboard']);
        
        // Recherche
        Route::post('rechercher', [DepotController::class, 'search']);
    });
    
    // ========== ROUTES RESPONSABLE DÉPÔT ==========
Route::prefix('responsable-depot')->group(function () {
    // Gestion des comptes (manager)
    Route::post('creer', [ResponsableDepotController::class, 'creer']);
    Route::get('liste', [ResponsableDepotController::class, 'index']);
    Route::get('voir/{id}', [ResponsableDepotController::class, 'show']);
    Route::put('desactiver/{id}', [ResponsableDepotController::class, 'desactiver']);
    Route::put('activer/{id}', [ResponsableDepotController::class, 'activer']);
    
    
    // Gestion des bons
    Route::get('bons-recus/{id_responsable}', [ResponsableDepotController::class, 'bonsRecus']);
    Route::get('bon/{id_bon}', [ResponsableDepotController::class, 'detailBon']);
    
    // Chargement
    Route::post('verifier-code', [ResponsableDepotController::class, 'verifierCode']);
    Route::post('autoriser-chargement', [ResponsableDepotController::class, 'autoriserChargement']);
    Route::post('terminer-chargement', [ResponsableDepotController::class, 'terminerChargement']);
    
    // Stocks - AJOUTEZ LA ROUTE PUT ICI
    Route::get('stock/{id_responsable}', [ResponsableDepotController::class, 'voirStock']);
    Route::put('stock/{id_responsable}', [ResponsableDepotController::class, 'updateStock']);  // ← ROUTE MANQUANTE
    Route::get('alertes/{id_responsable}', [ResponsableDepotController::class, 'alertesStock']);  // ← AJOUTEZ AUSSI CELLE-CI
    Route::get('historique-sorties/{id_responsable}', [ResponsableDepotController::class, 'historiqueSorties']);
       Route::put('seuil-alerte/{id_responsable}', [ResponsableDepotController::class, 'updateSeuilAlerte']); 
    // Profil
    Route::get('profil/{id_responsable}', [ResponsableDepotController::class, 'profil']);
    Route::put('profil/{id_responsable}', [ResponsableDepotController::class, 'updateProfil']);
});
});

// ========== NOTIFICATIONS POUR RESPONSABLE DÉPÔT ==========
Route::middleware(['auth:sanctum', 'role:responsable_depot'])->prefix('responsable-depot')->group(function () {
    Route::get('/notifications', [ResponsableDepotController::class, 'getNotifications']);
    Route::get('/notifications/non-lues', [ResponsableDepotController::class, 'getNotificationsNonLues']);
    Route::get('/notifications/statistiques', [ResponsableDepotController::class, 'getNotificationsStatistiques']);
    Route::put('/notifications/{id}/lire', [ResponsableDepotController::class, 'marquerNotificationLue']);
    Route::put('/notifications/lire-toutes', [ResponsableDepotController::class, 'marquerToutesNotificationsLues']);
});

// ==============================================
// 🔹 ROUTES STATIONS PUBLIQUES (sans authentification)
// ==============================================
Route::get('stations', [StationController::class, 'index']);
Route::get('stations/{id_station}', [StationController::class, 'show']);
Route::get('stations/filtre/disponibles', [StationController::class, 'disponibles']);
Route::get('stations/filtre/type/{type_carburant}', [StationController::class, 'byTypeCarburant']);
Route::post('stations/recherche', [StationController::class, 'search']);
Route::post('stations/proximite', [StationController::class, 'aProximite']);

// ==============================================
// 🔹 ROUTES POUR FOURNISSEUR
// ==============================================
Route::prefix('fournisseur')->middleware(['auth:sanctum', 'role:fournisseur'])->group(function () {
    Route::post('bon/creer', [FournisseurController::class, 'creerBon']);
    Route::post('bon/signer/{id}', [FournisseurController::class, 'signerBon']);
    Route::post('bon/transmettre/{id}', [FournisseurController::class, 'transmettreBon']);
    Route::get('bon/suivre/{id}', [FournisseurController::class, 'suivreBon']);
    Route::get('bons/historique', [FournisseurController::class, 'historique']);
    Route::delete('bon/annuler/{id}', [FournisseurController::class, 'annulerBon']);
    Route::get('icrs', [FournisseurController::class, 'listeIcrs']);
    Route::get('depots', [FournisseurController::class, 'listeDepots']);
    Route::get('bon/details/{id}', [FournisseurController::class, 'getDetailsBon']);

});

// ==============================================
// 🔹 ROUTES POUR MANAGER
// ==============================================
Route::prefix('manager')->middleware(['auth:sanctum', 'role:manager'])->group(function () {
    
    // Gestion des fournisseurs
    Route::post('fournisseur/creer', [ManagerController::class, 'creerFournisseur']);
    Route::put('fournisseur/modifier/{id_fournisseur}', [ManagerController::class, 'modifierFournisseur']);
    Route::get('fournisseurs', [ManagerController::class, 'listerFournisseurs']);
    Route::put('fournisseur/desactiver/{id_fournisseur}', [ManagerController::class, 'desactiverFournisseur']);
    Route::put('fournisseur/activer/{id_fournisseur}', [ManagerController::class, 'activerFournisseur']);
    
    // Gestion des ICR
    Route::post('icr/creer', [ManagerController::class, 'creerIcr']);
    Route::put('icr/modifier/{id_icr}', [ManagerController::class, 'modifierIcr']);
    Route::get('icrs', [ManagerController::class, 'listerIcr']);
    Route::put('icr/desactiver/{id_icr}', [ManagerController::class, 'desactiverIcr']);
    Route::put('icr/activer/{id_icr}', [ManagerController::class, 'activerIcr']);
    
    // Gestion des responsables dépôt
    Route::post('responsable/creer', [ManagerController::class, 'creerResponsableDepot']);
    Route::put('responsable/modifier/{id_responsable}', [ManagerController::class, 'modifierResponsableDepot']);
    Route::get('responsables', [ManagerController::class, 'listerResponsablesDepot']);
    Route::put('responsable/desactiver/{id_responsable}', [ManagerController::class, 'desactiverResponsableDepot']);
    Route::put('responsable/activer/{id_responsable}', [ManagerController::class, 'activerResponsableDepot']);

    // Gestion des dépôts
    Route::post('depot/creer', [ManagerController::class, 'creerDepot']);
    Route::get('depots', [ManagerController::class, 'listerDepots']);
    
    // Gestion des responsables de dépôt (affectation)
    Route::post('responsable/affecter', [ManagerController::class, 'affecterResponsable']);
    
    // Tableau de bord
    Route::get('dashboard', [ManagerController::class, 'dashboard']);
    
    // Stocks
    Route::get('stocks/depots', [ManagerController::class, 'stocksDepots']);
    Route::get('stocks/stations', [ManagerController::class, 'stocksStations']);
    
    // Livraisons
    Route::get('livraisons/suivi', [ManagerController::class, 'suiviLivraisons']);
    
    // Alertes
    Route::get('alertes', [ManagerController::class, 'alertes']);
    
    // Statistiques
    Route::get('statistiques', [ManagerController::class, 'statistiques']);
    
    // Prix carburant
    Route::post('prix/fixer', [ManagerController::class, 'fixerPrix']);
    Route::get('prix', [ManagerController::class, 'getPrix']);
    Route::get('prix/historique', [ManagerController::class, 'historiquePrix']);
});


// ==============================================
// 🔹 ROUTES ICR (Inspecteur Commercial de Réseaux)
// ==============================================

Route::prefix('icr')->middleware(['auth:sanctum', 'role:icr'])->group(function () {
    
    // GESTION DES GÉRANTS
    Route::get('gerants/{id_icr}', [IcrController::class, 'voirGerants']);
    Route::post('gerant/creer', [IcrController::class, 'creerGerant']);
    Route::put('gerant/modifier/{id_gerant}', [IcrController::class, 'modifierGerant']);
    Route::put('gerant/desactiver/{id_gerant}', [IcrController::class, 'desactiverGerant']);
    Route::put('gerant/activer/{id_gerant}', [IcrController::class, 'activerGerant']);
    Route::get('gerant/{id_gerant}', [IcrController::class, 'detailGerant']);
    
    // GESTION DES CHAUFFEURS
    Route::get('chauffeurs/{id_icr}', [IcrController::class, 'voirChauffeurs']);
    Route::post('chauffeur/creer', [IcrController::class, 'creerChauffeur']);
    Route::put('chauffeur/modifier/{id_chauffeur}', [IcrController::class, 'modifierChauffeur']);
    Route::put('chauffeur/desactiver/{id_chauffeur}', [IcrController::class, 'desactiverChauffeur']);
    Route::put('chauffeur/activer/{id_chauffeur}', [IcrController::class, 'activerChauffeur']);
    Route::get('chauffeur/{id_chauffeur}', [IcrController::class, 'detailChauffeur']);
    
    // GESTION DES STATIONS
    Route::get('stations', [IcrController::class, 'voirStations']);
    Route::post('station/creer', [IcrController::class, 'creerStation']);
    Route::put('station/modifier/{id_station}', [IcrController::class, 'modifierStation']);
    Route::put('station/desactiver/{id_station}', [IcrController::class, 'desactiverStation']);
    Route::put('station/activer/{id_station}', [IcrController::class, 'activerStation']);
    Route::get('station/{id_station}', [IcrController::class, 'detailStation']);
    
    // GESTION DES CAMIONS
    Route::get('camions', [IcrController::class, 'voirCamions']);
    Route::post('camion/creer', [IcrController::class, 'creerCamion']);
    Route::put('camion/modifier/{id_camion}', [IcrController::class, 'modifierCamion']);
    Route::put('camion/desactiver/{id_camion}', [IcrController::class, 'desactiverCamion']);
    Route::put('camion/activer/{id_camion}', [IcrController::class, 'activerCamion']);
    Route::get('camion/{id_camion}', [IcrController::class, 'detailCamion']);
    
    // GESTION DES BONS
    Route::get('bons-recus/{id_icr}', [IcrController::class, 'bonsRecus']);
    Route::get('bon/{id_bon}', [IcrController::class, 'detailBon']);
    
    // GESTION DES MISSIONS
    Route::post('mission/organiser', [IcrController::class, 'organiserMission']);
    Route::get('missions/{id_icr}', [IcrController::class, 'voirMissions']);
    Route::get('mission/{id_mission}', [IcrController::class, 'detailMission']);
    Route::put('mission/annuler/{id_mission}', [IcrController::class, 'annulerMission']);
    Route::put('mission/demarrer/{id_mission}', [IcrController::class, 'demarrerMission']);
    Route::put('mission/terminer/{id_mission}', [IcrController::class, 'terminerMission']);
    
    // CHARGEMENT ET CERTIFICAT
    Route::post('chargement/enregistrer', [IcrController::class, 'enregistrerChargement']);
    Route::post('certificat/signer', [IcrController::class, 'signerCertificat']);
    Route::get('certificat/{id_mission}', [IcrController::class, 'voirCertificat']);
    Route::get('certificat/pdf/{id_certificat}', [IcrController::class, 'genererPdfCertificat']);
    
    // SUIVI GPS
    Route::get('mission/suivre/{id_mission}', [IcrController::class, 'suivreGps']);
    Route::get('camion/position/{id_camion}', [IcrController::class, 'positionCamion']);
    
    // STATISTIQUES
    Route::get('statistiques/{id_icr}', [IcrController::class, 'statistiques']);
    Route::get('rapport/mensuel/{id_icr}', [IcrController::class, 'rapportMensuel']);
    
    // PROFIL ET DASHBOARD
    Route::get('profil/{id_icr}', [IcrController::class, 'profil']);
    Route::put('profil/{id_icr}', [IcrController::class, 'updateProfil']);
    Route::get('dashboard/{id_icr}', [IcrController::class, 'dashboard']);
});



// ==============================================
// 🔹 ROUTES POUR CERTIFICATS (API)
// ==============================================
Route::middleware('auth:sanctum')->prefix('certificats')->group(function () {
    // Routes principales
    Route::get('/', [CertificatController::class, 'index']);
    Route::get('/non-signes', [CertificatController::class, 'nonSignes']);
    Route::get('/completement-signes', [CertificatController::class, 'completementSignes']);
    Route::get('/statistiques', [CertificatController::class, 'statistiques']);
    Route::get('/dashboard', [CertificatController::class, 'dashboard']);
    
    // Routes avec paramètres (à mettre APRÈS les routes spécifiques)
    Route::get('/mission/{id_mission}', [CertificatController::class, 'getByMission']);
    Route::get('/{id_certificat}', [CertificatController::class, 'show']);
    Route::post('/{id_certificat}/signer', [CertificatController::class, 'signer']);
    Route::get('/{id_certificat}/check-signature', [CertificatController::class, 'checkSignature']);
    Route::post('/{id_certificat}/generer-pdf', [CertificatController::class, 'genererPdf']);
    Route::get('/{id_certificat}/download-pdf', [CertificatController::class, 'downloadPdf']);
    Route::get('/{id_certificat}/view-pdf', [CertificatController::class, 'viewPdf']);
    Route::delete('/{id_certificat}', [CertificatController::class, 'destroy']);
     // NOUVELLES ROUTES - Signature par mission
    Route::post('/signer-icr', [CertificatController::class, 'signerParIcr']);
    Route::post('/signer-chauffeur', [CertificatController::class, 'signerParChauffeur']);
    
    // Route pour créer un certificat pour une mission
    Route::post('/creer-pour-mission', [CertificatController::class, 'creerPourMission']);
    Route::get('/statut-signature/{id_mission}', [CertificatController::class, 'getStatutSignature']);
});


// ========== SUIVI GPS ==========

// Chauffeur : mettre à jour sa position
Route::middleware(['auth:sanctum', 'role:chauffeur'])->group(function () {
    Route::put('/chauffeur/mission/{id_mission}/position', [MissionController::class, 'updatePosition']);
    Route::get('/chauffeur/mission-en-cours', [MissionController::class, 'getMissionEnCours']);
});

// ICR : voir la position
Route::middleware(['auth:sanctum', 'role:icr'])->group(function () {
    Route::get('/icr/mission/{id_mission}/position', [MissionController::class, 'getPosition']);
});


// ========== CHAUFFEUR ==========
Route::middleware(['auth:sanctum', 'role:chauffeur'])->prefix('chauffeur')->group(function () {
    // Dashboard
    Route::get('/dashboard/{id_chauffeur}', [ChauffeurController::class, 'dashboard']);
    Route::get('/profil/{id_chauffeur}', [ChauffeurController::class, 'profil']);
    Route::put('/profil/{id_chauffeur}', [ChauffeurController::class, 'updateProfil']);
    
    // Missions
    Route::get('/missions/{id_chauffeur}', [ChauffeurController::class, 'voirMissions']);
    Route::get('/mission-en-cours/{id_chauffeur}', [ChauffeurController::class, 'missionEnCours']);
    Route::post('/mission/{id_mission}/demarrer', [ChauffeurController::class, 'demarrerMission']);
    Route::post('/mission/{id_mission}/terminer', [ChauffeurController::class, 'terminerMission']);
    Route::get('/mission/{id_mission}/details', [ChauffeurController::class, 'detailsMission']);
    Route::get('/missions-planifiees/{id_chauffeur}', [ChauffeurController::class, 'missionsPlanifiees']);
    // Livraisons
    Route::get('/livraisons/{id_chauffeur}', [ChauffeurController::class, 'livraisonsAEffectuer']);
    Route::post('/livraison/valider', [ChauffeurController::class, 'validerLivraison']);
    Route::get('/historique/{id_chauffeur}', [ChauffeurController::class, 'historiqueLivraisons']);
    
    // Certificat
    Route::post('/certificat/signer', [ChauffeurController::class, 'signerCertificat']);
    
    // Incidents
    Route::post('/incident/signaler', [ChauffeurController::class, 'signalerIncident']);
});


// ========== GÉRANT DE STATION ==========
Route::middleware(['auth:sanctum', 'role:gerant'])->prefix('gerant')->group(function () {
    
    // Profil
    Route::get('/profil/{id_gerant}', [GerantController::class, 'profil']);
    Route::put('/profil/{id_gerant}', [GerantController::class, 'updateProfil']);
    
    // Dashboard
    Route::get('/dashboard/{id_gerant}', [GerantController::class, 'dashboard']);
    
    // Pompistes
    Route::get('/pompistes/{id_gerant}', [GerantController::class, 'voirPompistes']);
    Route::post('/pompiste/creer', [GerantController::class, 'creerPompiste']);
    Route::put('/pompiste/modifier/{id_pompiste}', [GerantController::class, 'modifierPompiste']);
    Route::put('/pompiste/desactiver/{id_pompiste}', [GerantController::class, 'desactiverPompiste']);
    Route::put('/pompiste/activer/{id_pompiste}', [GerantController::class, 'activerPompiste']);
    
    // Stocks (station)
    Route::get('/stocks/{id_gerant}', [GerantController::class, 'voirStock']);
    
    // Livraisons
    Route::get('/livraisons/attente/{id_gerant}', [GerantController::class, 'livraisonsEnAttente']);
    Route::get('/livraisons/historique/{id_gerant}', [GerantController::class, 'historiqueLivraisons']);
    Route::post('/livraison/valider', [GerantController::class, 'validerReception']);
    
    // Ventes
    Route::get('/ventes/{id_gerant}', [GerantController::class, 'voirVentes']);
    
    // Alertes
    Route::get('/alertes/{id_gerant}', [GerantController::class, 'alertesStock']);
    Route::put('/alerte/lire/{id_alerte}', [GerantController::class, 'marquerAlerteLue']);
    Route::get('/alertes/verifier/{id_gerant}', [GerantController::class, 'verifierAlertesStock']);

     Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/non-lues', [NotificationController::class, 'nonLues']);
    Route::put('/notification/lire/{id}', [NotificationController::class, 'marquerLue']);
    Route::put('/notifications/lire-toutes', [NotificationController::class, 'marquerToutesLues']);
    Route::delete('/notification/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications/supprimer/toutes', [NotificationController::class, 'deleteAll']);
//stock
    Route::get('/stocks/{id_gerant}', [GerantController::class, 'voirStock']);
    Route::put('/stocks/{id_gerant}/seuil', [GerantController::class, 'updateSeuilAlerte']); // ← AJOUTE CETTE LIGNE
});

// ========== POMPISTE ==========
Route::middleware(['auth:sanctum', 'role:pompiste'])->prefix('pompiste')->group(function () {
    
    // Profil
    Route::get('/profil', [PompisteController::class, 'profil']);
    Route::put('/profil', [PompisteController::class, 'updateProfil']);
    
    // Ventes
    Route::post('/vente', [PompisteController::class, 'saisirVente']);
    Route::get('/ventes', [PompisteController::class, 'historiqueVentes']);
    Route::get('/ventes/jour', [PompisteController::class, 'ventesDuJour']);
    Route::get('/prix', [PompisteController::class, 'getPrixActuels']);
    
    // Stocks (consultation)
    Route::get('/stocks', [PompisteController::class, 'voirStock']);
    
    // Réservations
    Route::get('/reservations', [PompisteController::class, 'voirReservations']);
    Route::put('/reservation/{id}/servir', [PompisteController::class, 'marquerServie']);
    
    // Fin de journée
    Route::get('/cloture', [PompisteController::class, 'clotureCaisse']);
    
    // Synchronisation hors-ligne
    Route::post('/synchroniser', [PompisteController::class, 'synchroniserVentes']);
    Route::get('/reservations', [ReservationController::class, 'getReservationsPompiste']);
    Route::put('/reservation/{id}/servir', [ReservationController::class, 'servirReservation']);
});
// routes/api.php
Route::post('/pompiste/vente/public', [PompisteController::class, 'saisirVentePublic']);
// ==============================================
// 🔹 ROUTES POUR CONSOMMATEUR
// ==============================================

Route::middleware(['auth:sanctum', 'role:consommateur'])->group(function () {
    
    // ========== PROFIL ==========
    Route::get('/consommateur/profil', [ConsommateurController::class, 'profil']);
    Route::put('/consommateur/profil', [ConsommateurController::class, 'updateProfil']);
    
    // ========== RÉSERVATIONS ==========
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservation/{id}', [ReservationController::class, 'show']);
    Route::put('/reservation/{id}/annuler', [ReservationController::class, 'annuler']);
    // Paiement d'une réservation
Route::post('/reservation/payer', [ReservationController::class, 'payer']);
    
    // ========== PAIEMENTS ==========
    Route::post('/paiements/simuler', [PaiementController::class, 'simuler']);
    Route::get('/paiements/verifier/{id_reservation}', [PaiementController::class, 'verifier']);
    
    // ========== STATISTIQUES ==========
    Route::get('/consommateur/statistiques', [ReservationController::class, 'statistiques']);
    
    // ========== NOTIFICATIONS ==========
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/lire', [NotificationController::class, 'marquerLue']);
});

// ==============================================
// 🔹 ROUTES PUBLIQUES POUR LE CONSOMMATEUR
// ==============================================

// Stations (consultation sans authentification)
Route::get('/stations', [StationController::class, 'index']);
Route::get('/stations/{id_station}', [StationController::class, 'show']);
Route::get('/stations/disponibles/{type_carburant}', [StationController::class, 'disponibles']);
Route::post('/stations/proximite', [StationController::class, 'aProximite']);

// Prix actuels (public)
Route::get('/prix-actuels', function() {
    $manager = App\Models\User::where('role', 'manager')->first();
    return response()->json([
        'essence' => $manager->prix_essence ?? 750,
        'gasoil' => $manager->prix_gasoil ?? 700
    ]);
});