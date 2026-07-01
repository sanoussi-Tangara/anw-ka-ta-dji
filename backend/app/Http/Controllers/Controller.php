<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = $request->user();
            
            if ($user && isset($user->statut) && $user->statut == false) {
                $user->tokens()->delete();
                return response()->json([
                    'message' => 'Votre compte est désactivé'
                ], 403);
            }
            
            return $next($request);
        })->except(['login', 'register']);
    }
}