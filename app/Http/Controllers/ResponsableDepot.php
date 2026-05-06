<?php

namespace App\Http\Controllers;

use App\Models\ResponsableDepot;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

// Controller pour gérer les responsables de dépôt (CRUD complet)
class ResponsableDepotController extends Controller
{
    /**
     * ======================
     * LISTE TOUS LES RESPONSABLES
     * ======================
     */
    public function index()
    {
        // Récupère tous les responsables avec leurs relations :
        // - utilisateur (compte système)
        // - depot (dépôt géré)
        $responsables = ResponsableDepot::with(['utilisateur', 'depot'])->get();

        return response()->json($responsables);
    }

    /**
     * ======================
     * AFFICHER UN RESPONSABLE
     * ======================
     */
    public function show($id)
    {
        // Récupère un responsable précis avec ses relations
        $responsable = ResponsableDepot::with(['utilisateur', 'depot'])
            ->findOrFail($id);

        return response()->json($responsable);
    }

    /**
     * ======================
     * CRÉER UN RESPONSABLE
     * ======================
     */
    public function store(Request $request)
    {
        // Validation des données reçues
        $validated = $request->validate([
            'id_utilisateur' => 'required|integer|exists:utilisateurs,id_utilisateur',
            'id_depot' => 'required|integer|exists:depots,id_depot',
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:responsables_depot,email',
            'telephone' => 'nullable|string|max:20',
            'role' => 'required|string|max:100',
        ]);

        // Création du responsable en base de données
        $responsable = ResponsableDepot::create($validated);

        // Retour avec code HTTP 201 (créé)
        return response()->json($responsable, Response::HTTP_CREATED);
    }

    /**
     * ======================
     * MODIFIER UN RESPONSABLE
     * ======================
     */
    public function update(Request $request, $id)
    {
        // Recherche du responsable ou erreur 404
        $responsable = ResponsableDepot::findOrFail($id);

        // Validation des champs (optionnels avec "sometimes")
        $validated = $request->validate([
            'id_utilisateur' => 'sometimes|integer|exists:utilisateurs,id_utilisateur',
            'id_depot' => 'sometimes|integer|exists:depots,id_depot',
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',

            // Email unique sauf pour l'enregistrement actuel
            'email' => 'sometimes|email|unique:responsables_depot,email,' 
                . $responsable->id_responsable . ',id_responsable',

            'telephone' => 'sometimes|nullable|string|max:20',
            'role' => 'sometimes|string|max:100',
        ]);

        // Mise à jour des données
        $responsable->update($validated);

        return response()->json($responsable);
    }

    /**
     * ======================
     * SUPPRIMER UN RESPONSABLE
     * ======================
     */
    public function destroy($id)
    {
        // Recherche du responsable
        $responsable = ResponsableDepot::findOrFail($id);

        // Suppression en base de données
        $responsable->delete();

        // Retour HTTP 204 (aucun contenu)
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}