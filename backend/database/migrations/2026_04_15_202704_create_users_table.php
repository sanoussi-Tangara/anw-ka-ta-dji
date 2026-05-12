<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email')->unique();
            $table->string('password');
            $table->string('telephone', 20);
            $table->string('role', 50);
            $table->string('matricule', 50)->nullable();
            $table->string('zone', 100)->nullable();
            $table->string('permis', 50)->nullable();
            $table->string('nom_societe', 100)->nullable();
            $table->string('nif', 50)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};