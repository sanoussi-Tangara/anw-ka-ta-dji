<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Fournisseur;
use App\Models\Icr;
use App\Models\Gerant;
use App\Models\Chauffeur;
use App\Models\Pompiste;
use App\Models\Consommateur;
use App\Models\ResponsableDepot;
use App\Models\Manager;
use App\Models\Administrateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ==========================================
    // 🔹 CONNEXION
    // ==========================================
    public function login(Request $request)
    {
        // 1. Valider les données
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        // 2. Chercher l'utilisateur
        $user = User::where('email', $request->email)->first();

        // 3. Vérifier les identifiants
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // 4. Vérifier si le compte est actif
        if ($user->statut === false) {
            return response()->json([
                'message' => 'Votre compte est désactivé'
            ], 403);
        }

        // 5. Supprimer les anciens tokens
        $user->tokens()->delete();

        // 6. Créer un nouveau token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 7. Récupérer l'ID spécifique selon le rôle
        $specificId = $this->getSpecificId($user);
        
        // 8. Récupérer l'objet complet du rôle
        $roleObject = $this->getRoleObject($user);

        // 9. Retourner la réponse
        return response()->json([
            'message' => 'Connexion réussie',
            'user' => [
                'id_utilisateur' => $user->id_utilisateur,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'role' => $user->role,
                'statut' => $user->statut,
                'specific_id' => $specificId,
                $user->role => $roleObject
            ],
            'token' => $token,
            'redirect_to' => $this->getRedirectPath($user->role)
        ]);
    }

    // ==========================================
    // 🔹 INSCRIPTION (uniquement consommateur)
    // ==========================================
    public function register(Request $request)
    {
        // 1. Valider les données
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'telephone' => 'required|string|unique:users,telephone'
        ]);

        // 2. Créer l'utilisateur
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'telephone' => $request->telephone,
            'role' => 'consommateur',
            'statut' => true
        ]);

        // 3. Créer l'entrée dans la table consommateurs
        $consommateur = Consommateur::create([
            'id_utilisateur' => $user->id_utilisateur
        ]);

        // 4. Générer le token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 5. Retourner la réponse
        return response()->json([
            'message' => 'Inscription réussie',
            'user' => [
                'id_utilisateur' => $user->id_utilisateur,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'role' => 'consommateur',
                'statut' => $user->statut,
                'specific_id' => $consommateur->id_consommateur,
                'consommateur' => $consommateur
            ],
            'token' => $token,
            'redirect_to' => '/consommateur/dashboard'
        ], 201);
    }

    // ==========================================
    // 🔹 DÉCONNEXION
    // ==========================================
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }

    // ==========================================
    // 🔹 RÉCUPÉRER L'UTILISATEUR CONNECTÉ
    // ==========================================
    public function me(Request $request)
    {
        $user = $request->user();
        $specificId = $this->getSpecificId($user);
        $roleObject = $this->getRoleObject($user);

        return response()->json([
            'user' => [
                'id_utilisateur' => $user->id_utilisateur,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'role' => $user->role,
                'statut' => $user->statut,
                'specific_id' => $specificId,
                $user->role => $roleObject
            ]
        ]);
    }

    // ==========================================
    // 🔹 FONCTIONS PRIVÉES
    // ==========================================

    private function getRedirectPath($role)
    {
        $paths = [
            'fournisseur' => '/fournisseur/dashboard',
            'manager' => '/manager/dashboard',
            'icr' => '/icr/dashboard',
            'responsable_depot' => '/responsabledepot/dashboard',
            'chauffeur' => '/chauffeur/dashboard',
            'gerant' => '/gerant/dashboard',
            'pompiste' => '/pompiste/dashboard',
            'consommateur' => '/consommateur/dashboard',
            'admin' => '/admin/dashboard'
        ];
        return $paths[$role] ?? '/dashboard';
    }

    private function getSpecificId($user)
    {
        $relations = [
            'fournisseur' => fn() => $user->fournisseur?->id_fournisseur,
            'icr' => fn() => $user->icr?->id_icr,
            'gerant' => fn() => $user->gerant?->id_gerant,
            'chauffeur' => fn() => $user->chauffeur?->id_chauffeur,
            'pompiste' => fn() => $user->pompiste?->id_pompiste,
            'consommateur' => fn() => $user->consommateur?->id_consommateur,
            'responsable_depot' => fn() => $user->responsableDepot?->id_responsable,
            'manager' => fn() => $user->manager?->id_manager,
            'admin' => fn() => $user->administrateur?->id_admin,
        ];

        return isset($relations[$user->role]) ? $relations[$user->role]() : null;
    }

    private function getRoleObject($user)
    {
        $relations = [
            'fournisseur' => fn() => $user->fournisseur,
            'icr' => fn() => $user->icr,
            'gerant' => fn() => $user->gerant,
            'chauffeur' => fn() => $user->chauffeur,
            'pompiste' => fn() => $user->pompiste,
            'consommateur' => fn() => $user->consommateur,
            'responsable_depot' => fn() => $user->responsableDepot,
            'manager' => fn() => $user->manager,
            'admin' => fn() => $user->administrateur,
        ];

        return isset($relations[$user->role]) ? $relations[$user->role]() : null;
    }
}