<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ManagerController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\StationController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
});

Route::get('test', function () {
    return response()->json([
        'message' => 'Laravel API fonctionne'
    ]);
});







// Routes protégées pour manager
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
// 🔹 ROUTES STATIONS PUBLIQUES (sans authentification)
// ==============================================

Route::get('stations', [StationController::class, 'index']);
Route::get('stations/{id_station}', [StationController::class, 'show']);
Route::get('stations/filtre/disponibles', [StationController::class, 'disponibles']);
Route::get('stations/filtre/type/{type_carburant}', [StationController::class, 'byTypeCarburant']);
Route::post('stations/recherche', [StationController::class, 'search']);
Route::post('stations/proximite', [StationController::class, 'aProximite']);

// ==============================================
// 🔹 ROUTES STATIONS PROTÉGÉES (avec authentification)
// ==============================================

Route::middleware('auth:sanctum')->group(function () {
    
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
});