<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email')->unique();
            $table->string('password');
            $table->string('telephone', 20);
            $table->string('role', 50);  // fournisseur, icr, gerant, chauffeur, pompiste, consommateur, manager, responsable_depot, admin
            $table->string('matricule')->nullable(); // pour ICR et chauffeur
            $table->string('zone')->nullable(); // pour ICR
            $table->string('permis')->nullable(); // pour chauffeur
            $table->string('nom_societe')->nullable(); // pour fournisseur
            $table->string('nif')->nullable(); // pour fournisseur
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};