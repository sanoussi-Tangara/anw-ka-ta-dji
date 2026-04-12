<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Inscription
    public function register(Request $request)
    {
        $request->validate([
            'nom' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'telephone' => 'required|string',
            'role' => 'required|string|in:fournisseur,icr,gerant,chauffeur,pompiste,consommateur,manager,responsable_depot,admin'
        ]);

        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'telephone' => $request->telephone,
            'role' => $request->role
        ]);

        // Ajouter des champs spécifiques selon le rôle
        if ($request->role === 'icr') {
            $user->update([
                'matricule' => $request->matricule,
                'zone' => $request->zone
            ]);
        }

        if ($request->role === 'chauffeur') {
            $user->update([
                'matricule' => $request->matricule,
                'permis' => $request->permis
            ]);
        }

        if ($request->role === 'fournisseur') {
            $user->update([
                'nom_societe' => $request->nom_societe,
                'nif' => $request->nif
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'role' => $user->role
        ], 201);
    }

    // Connexion
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'role' => $user->role
        ]);
    }

    // Déconnexion
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }

    // Récupérer l'utilisateur connecté
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}