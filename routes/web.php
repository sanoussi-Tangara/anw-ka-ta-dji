<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;


Route::get('/', function () {
    return view('welcome');

});

   // Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées (nécessitent authentification)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});


