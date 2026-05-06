<?php

namespace App\Http\Controllers;

use App\Models\Gerant;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

// Controller gérant les opérations CRUD sur les gérants
class GerantController extends Controller
{
    // ======================
    // AFFICHER TOUS LES GÉRANTS
    // ======================
    public function index()
    {
        // Récupère tous les gérants avec leurs relations (station + pompistes)
        return response()->json(
            Gerant::with(['station', 'pompistes'])->get()
        );
    }

    // ======================
    // AFFICHER UN GÉRANT SPÉCIFIQUE
    // ======================
    public function show($id)
    {
        // Récupère un gérant avec plusieurs relations métier
        return response()->json(
            Gerant::with(['station', 'pompistes', 'livraisons', 'ventes'])
                ->findOrFail($id)
        );
    }

    // ======================
    // CRÉER UN GÉRANT
    // ======================
    public function store(Request $request)
    {
        // Validation des données reçues
        $validated = $request->validate([
            'nom' => 'required|string|max:255',           // Nom obligatoire
            'email' => 'required|email|unique:gerants,email', // Email unique
            'station_id' => 'required|exists:stations,id',    // Station existante
        ]);

        // Création du gérant en base de données
        $gerant = Gerant::create($validated);

        // Retourne le gérant créé avec code HTTP 201
        return response()->json($gerant, Response::HTTP_CREATED);
    }

    // ======================
    // MODIFIER UN GÉRANT
    // ======================
    public function update(Request $request, $id)
    {
        // Recherche du gérant ou erreur 404
        $gerant = Gerant::findOrFail($id);

        // Validation des champs (tous optionnels avec "sometimes")
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            
            // Email unique sauf pour ce gérant (exception sur id_gerant)
            'email' => 'sometimes|email|unique:gerants,email,' . $gerant->id_gerant . ',id_gerant',
            
            // Vérifie que la station existe
            'station_id' => 'sometimes|exists:stations,id',
        ]);

        // Mise à jour des données
        $gerant->update($validated);

        // Retourne le gérant modifié
        return response()->json($gerant);
    }

    // ======================
    // SUPPRIMER UN GÉRANT
    // ======================
    public function destroy($id)
    {
        // Recherche du gérant
        $gerant = Gerant::findOrFail($id);

        // Suppression en base de données
        $gerant->delete();

        // Retourne une réponse vide (HTTP 204 No Content)
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}