<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ResponsableDepot;
use App\Models\User;
use App\Models\Bon;
use App\Models\Depot;
use App\Models\Stock;
use App\Models\Notification;  // ← C'est comme ça qu'il faut écrire
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ResponsableDepotController extends Controller
{
    // ==============================================
    // 🔹 GESTION DES COMPTES (PAR MANAGER)
    // ==============================================

    // 1. Créer un responsable de dépôt (par le manager)
    public function creer(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'telephone' => 'required|string|unique:users,telephone',
            'id_depot' => 'required|exists:depots,id_depot'
        ]);

        // Créer l'utilisateur
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password ?? 'default123'),
            'telephone' => $request->telephone,
            'role' => 'responsable_depot'
        ]);

        // Créer le responsable
        $responsable = ResponsableDepot::create([
            'id_utilisateur' => $user->id_utilisateur
        ]);

        // Associer le dépôt
        $depot = Depot::find($request->id_depot);
        $depot->id_responsable = $responsable->id_responsable;
        $depot->save();

        return response()->json([
            'message' => 'Responsable de dépôt créé avec succès',
            'responsable' => $responsable->load('user', 'depot')
        ], 201);
    }

    // 2. Voir tous les responsables
    public function index()
    {
        $responsables = ResponsableDepot::with(['user', 'depot'])->get();
        return response()->json($responsables);
    }

    // 3. Voir un responsable
    public function show($id)
    {
        $responsable = ResponsableDepot::with(['user', 'depot'])->findOrFail($id);
        return response()->json($responsable);
    }

    // 4. Désactiver un responsable
    public function desactiver($id)
    {
        $responsable = ResponsableDepot::findOrFail($id);
        $user = $responsable->user;
        $user->statut = false;
        $user->save();

        return response()->json(['message' => 'Responsable désactivé']);
    }

    // 5. Activer un responsable
    public function activer($id)
    {
        $responsable = ResponsableDepot::findOrFail($id);
        $user = $responsable->user;
        $user->statut = true;
        $user->save();

        return response()->json(['message' => 'Responsable activé']);
    }

    // ==============================================
    // 🔹 GESTION DES BONS (NOTIFICATIONS)
    // ==============================================

    // 6. Voir les bons reçus (notifications)
public function bonsRecus($id_responsable)
{
    try {
        $responsable = ResponsableDepot::findOrFail($id_responsable);
        $depot = Depot::where('id_responsable', $id_responsable)->first();
        
        if (!$depot) {
            return response()->json(['bons' => []]);
        }
        
        $bons = Bon::where('id_depot', $depot->id_depot)
            ->with(['fournisseur.user', 'icr.user'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['bons' => $bons]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}

    // 7. Voir le détail d'un bon
    public function detailBon($id_bon)
    {
        $bon = Bon::with(['fournisseur.user', 'icr.user', 'depot'])->findOrFail($id_bon);
        return response()->json($bon);
    }

    // ==============================================
    // 🔹 VÉRIFICATION ET CHARGEMENT
    // ==============================================

    // 8. Vérifier le code ICR et autoriser le chargement
    public function verifierCode(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon',
            'code' => 'required|string|size:4'
        ]);

        $bon = Bon::findOrFail($request->id_bon);

        if ($bon->code_verification !== $request->code) {
            return response()->json([
                'message' => 'Code incorrect',
                'valide' => false
            ], 400);
        }

        if ($bon->statut !== 'signe') {
            return response()->json([
                'message' => 'Bon non signé par le fournisseur',
                'valide' => false
            ], 400);
        }

        return response()->json([
            'message' => 'Code valide, chargement autorisé',
            'valide' => true,
            'bon' => $bon
        ]);
    }

    // 9. Autoriser le chargement
    public function autoriserChargement(Request $request)
    {
        $request->validate([
            'id_bon' => 'required|exists:bons,id_bon'
        ]);

        $bon = Bon::findOrFail($request->id_bon);
        $bon->statut = 'en_cours';
        $bon->save();

        return response()->json([
            'message' => 'Chargement autorisé',
            'bon' => $bon
        ]);
    }

    // 10. Suivre le chargement (fin de chargement)
    // 10. Terminer le chargement avec vérification de stock
public function terminerChargement(Request $request)
{
    $request->validate([
        'id_bon' => 'required|exists:bons,id_bon',
        'quantite_chargee' => 'required|numeric|min:0.01'
    ]);

    try {
        $bon = Bon::findOrFail($request->id_bon);
        
        // Vérifier que le bon est en cours
        if ($bon->statut !== 'en_cours') {
            return response()->json([
                'message' => 'Ce bon n\'est pas en cours de chargement'
            ], 400);
        }
        
        // Vérifier que la quantité ne dépasse pas la commande
        if ($request->quantite_chargee > $bon->quantite_commandee) {
            return response()->json([
                'message' => 'La quantité chargée ne peut pas dépasser la quantité commandée'
            ], 400);
        }
        
        // Vérifier le stock disponible
        $stock = Stock::where('id_depot', $bon->id_depot)
            ->where('type_carburant', $bon->type_carburant)
            ->first();
        
        if (!$stock || $stock->quantite < $request->quantite_chargee) {
            return response()->json([
                'message' => 'Stock insuffisant pour ce chargement',
                'stock_disponible' => $stock->quantite ?? 0,
                'quantite_demandee' => $request->quantite_chargee
            ], 400);
        }
        
        // Mettre à jour le bon
        $bon->quantite_chargee = $request->quantite_chargee;
        $bon->fin_chargement = now();
        $bon->statut = 'termine';
        $bon->save();
        
        // Mettre à jour le stock
        $stock->quantite -= $request->quantite_chargee;
        $stock->date_mise_a_jour = now();
        $stock->save();
        
        // Vérifier si stock bas après déduction
        $seuilAlerte = 5000;
        $alerteStock = $stock->quantite < $seuilAlerte;
        
        return response()->json([
            'message' => 'Chargement terminé avec succès',
            'bon' => $bon,
            'stock_restant' => $stock->quantite,
            'alerte_stock' => $alerteStock
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}

    // ==============================================
    // 🔹 GESTION DES STOCKS
    // ==============================================

  // ==============================================
// 🔹 GESTION COMPLÈTE DES STOCKS
// ==============================================

// 11. Voir le stock du dépôt
// 11. Voir le stock du dépôt
public function voirStock($id_responsable)
{
    try {
        $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
        
        if (!$responsable->depot) {
            return response()->json([
                'message' => 'Aucun dépôt associé à ce responsable',
                'stocks' => []
            ], 404);
        }
        
        $stocks = Stock::where('id_depot', $responsable->depot->id_depot)->get();
        
        // NE PAS ÉCRASER - Utiliser le seuil existant
        foreach ($stocks as $stock) {
            // Utiliser le seuil de la base, ou 5000 par défaut si null
            $seuil = $stock->seuil_alerte ?? 5000;
            $stock->alerte = $stock->quantite < $seuil;
            $stock->seuil_alerte = $seuil; // Garder la vraie valeur
        }
        
        return response()->json([
            'depot' => $responsable->depot->nom,
            'stocks' => $stocks
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}

// 12. Mettre à jour le stock (ajout manuel)
public function updateStock(Request $request, $id_responsable)
{
    $request->validate([
        'type_carburant' => 'required|in:essence,gasoil',
        'quantite' => 'required|numeric|min:0',
        'operation' => 'required|in:add,remove,set'
    ]);
    
    try {
        $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
        
        if (!$responsable->depot) {
            return response()->json(['message' => 'Aucun dépôt associé'], 404);
        }
        
        $stock = Stock::where('id_depot', $responsable->depot->id_depot)
            ->where('type_carburant', $request->type_carburant)
            ->first();
        
        if (!$stock) {
            // Créer le stock s'il n'existe pas - CORRECTION : AJOUT DE seuil_alerte
            $stock = Stock::create([
                'id_depot' => $responsable->depot->id_depot,
                'type_carburant' => $request->type_carburant,
                'quantite' => 0,
                'seuil_alerte' => 5000,  // ← LIGNE AJOUTÉE (obligatoire)
                'date_mise_a_jour' => now()
            ]);
        }
        
        // Sauvegarder l'ancienne quantité pour le message
        $ancienneQuantite = $stock->quantite;
        
        // Appliquer l'opération
        switch ($request->operation) {
            case 'add':
                $stock->quantite += $request->quantite;
                $message = "Ajout de {$request->quantite} L de {$request->type_carburant}";
                break;
            case 'remove':
                if ($stock->quantite < $request->quantite) {
                    return response()->json([
                        'message' => 'Stock insuffisant pour cette opération'
                    ], 400);
                }
                $stock->quantite -= $request->quantite;
                $message = "Retrait de {$request->quantite} L de {$request->type_carburant}";
                break;
            case 'set':
                $stock->quantite = $request->quantite;
                $message = "Stock défini à {$request->quantite} L de {$request->type_carburant}";
                break;
        }
        
        $stock->date_mise_a_jour = now();
        $stock->save();
        
        // Vérifier alerte
        $seuilAlerte = 5000;
        if ($stock->quantite < $seuilAlerte) {
            return response()->json([
                'message' => $message . " ⚠️ Stock bas: {$stock->quantite} L",
                'stock' => $stock,
                'alerte' => true
            ]);
        }
        
        return response()->json([
            'message' => $message,
            'stock' => $stock,
            'alerte' => false
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}

// 13. Obtenir les alertes de stock
public function alertesStock($id_responsable)
{
    try {
        $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
        
        if (!$responsable->depot) {
            return response()->json(['alertes' => []]);
        }
        
        $stocks = Stock::where('id_depot', $responsable->depot->id_depot)->get();
        $seuilAlerte = 5000;
        
        $alertes = [];
        foreach ($stocks as $stock) {
            if ($stock->quantite < $seuilAlerte) {
                $alertes[] = [
                    'type_carburant' => $stock->type_carburant,
                    'quantite' => $stock->quantite,
                    'seuil' => $seuilAlerte,
                    'message' => "Stock {$stock->type_carburant} bas: {$stock->quantite} L"
                ];
            }
        }
        
        return response()->json([
            'alertes' => $alertes,
            'has_alertes' => count($alertes) > 0
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}


// ==============================================
// 🔹 PROFIL
// ==============================================

// 13. Voir le profil
public function profil($id_responsable)
{
    try {
        $responsable = ResponsableDepot::with(['user', 'depot'])->findOrFail($id_responsable);
        
        // Ajouter les infos du dépôt si disponible
        $depot = Depot::where('id_responsable', $id_responsable)->first();
        
        return response()->json([
            'id_responsable' => $responsable->id_responsable,
            'user' => $responsable->user,
            'depot' => $depot ?? $responsable->depot
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Responsable non trouvé'], 404);
    }
}

// 14. Modifier le profil
public function updateProfil(Request $request, $id_responsable)
{
    $responsable = ResponsableDepot::findOrFail($id_responsable);
    $user = $responsable->user;

    $request->validate([
        'nom' => 'nullable|string|max:100',
        'prenom' => 'nullable|string|max:100',
        'telephone' => 'nullable|string|unique:users,telephone,' . $user->id_utilisateur . ',id_utilisateur'
    ]);

    if ($request->has('nom')) $user->nom = $request->nom;
    if ($request->has('prenom')) $user->prenom = $request->prenom;
    if ($request->has('telephone')) $user->telephone = $request->telephone;
    $user->save();

    return response()->json([
        'message' => 'Profil mis à jour',
        'responsable' => $responsable->fresh('user')
    ]);
}



    // ==============================================
    // 🔹 HISTORIQUE DES SORTIES
    // ==============================================

    public function historiqueSorties($id_responsable)
    {
        try {
            $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
            
            if (!$responsable->depot) {
                return response()->json([
                    'historique' => [],
                    'message' => 'Aucun dépôt associé'
                ]);
            }
            
            $historique = Bon::where('id_depot', $responsable->depot->id_depot)
                ->whereIn('statut', ['termine', 'annule'])
                ->with(['fournisseur.user', 'icr.user'])
                ->orderBy('updated_at', 'desc')
                ->get();
            
            return response()->json([
                'historique' => $historique,
                'total' => $historique->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage(),
                'historique' => []
            ], 500);
        }
    }


    // 13. Mettre à jour le seuil d'alerte
public function updateSeuilAlerte(Request $request, $id_responsable)
{
    $request->validate([
        'type_carburant' => 'required|in:essence,gasoil',
        'seuil_alerte' => 'required|numeric|min:0'
    ]);
    
    try {
        $responsable = ResponsableDepot::with('depot')->findOrFail($id_responsable);
        
        if (!$responsable->depot) {
            return response()->json(['message' => 'Aucun dépôt associé'], 404);
        }
        
        $stock = Stock::where('id_depot', $responsable->depot->id_depot)
            ->where('type_carburant', $request->type_carburant)
            ->first();
        
        if (!$stock) {
            $stock = Stock::create([
                'id_depot' => $responsable->depot->id_depot,
                'type_carburant' => $request->type_carburant,
                'quantite' => 0,
                'seuil_alerte' => $request->seuil_alerte,
                'date_mise_a_jour' => now()
            ]);
        } else {
            $stock->seuil_alerte = $request->seuil_alerte;
            $stock->save();
        }
        
        return response()->json([
            'message' => "Seuil d'alerte mis à jour: {$request->seuil_alerte} L",
            'stock' => $stock
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}


// ==============================================
// 🔹 NOTIFICATIONS POUR RESPONSABLE DÉPÔT
// ==============================================

/**
 * Récupérer toutes les notifications du responsable
 */
public function getNotifications(Request $request)
{
    $user = auth()->user();
    
    $query = Notification::where('id_destinataire', $user->id_utilisateur);
    
    if ($request->has('lu')) {
        $query->where('lu', $request->boolean('lu'));
    }
    
    $notifications = $query->orderBy('created_at', 'desc')
        ->paginate($request->get('per_page', 20));
    
    return response()->json([
        'notifications' => $notifications,
        'non_lues' => Notification::where('id_destinataire', $user->id_utilisateur)
            ->where('lu', false)
            ->count(),
        'total' => Notification::where('id_destinataire', $user->id_utilisateur)->count()
    ]);
}

/**
 * Récupérer uniquement les notifications non lues
 */
public function getNotificationsNonLues()
{
    $user = auth()->user();
    
    $notifications = Notification::where('id_destinataire', $user->id_utilisateur)
        ->where('lu', false)
        ->orderBy('created_at', 'desc')
        ->get();
    
    return response()->json([
        'notifications' => $notifications,
        'count' => $notifications->count()
    ]);
}

/**
 * Statistiques des notifications
 */
public function getNotificationsStatistiques()
{
    $user = auth()->user();
    
    $stats = [
        'total' => Notification::where('id_destinataire', $user->id_utilisateur)->count(),
        'non_lues' => Notification::where('id_destinataire', $user->id_utilisateur)->where('lu', false)->count(),
        'lues' => Notification::where('id_destinataire', $user->id_utilisateur)->where('lu', true)->count()
    ];
    
    return response()->json($stats);
}

/**
 * Marquer une notification comme lue
 */
public function marquerNotificationLue($id)
{
    $user = auth()->user();
    
    $notification = Notification::where('id_destinataire', $user->id_utilisateur)
        ->where('id_notification', $id)
        ->firstOrFail();
    
    $notification->lu = true;
    $notification->save();
    
    return response()->json([
        'message' => 'Notification marquée comme lue',
        'notification' => $notification
    ]);
}

/**
 * Marquer toutes les notifications comme lues
 */
public function marquerToutesNotificationsLues()
{
    $user = auth()->user();
    
    $count = Notification::where('id_destinataire', $user->id_utilisateur)
        ->where('lu', false)
        ->update(['lu' => true]);
    
    return response()->json([
        'message' => $count . ' notification(s) marquée(s) comme lue(s)'
    ]);
}
}

