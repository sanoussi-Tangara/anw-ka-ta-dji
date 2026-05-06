<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('camions', function (Blueprint $table) {
            $table->id('id_camion');
            $table->string('immatriculation', 20)->unique();
            $table->decimal('capacite', 10, 2);
            $table->enum('type_carburant', ['essence', 'gasoil']);
            $table->enum('statut', ['disponible', 'en_mission', 'en_panne'])->default('disponible');
            $table->foreignId('id_chauffeur')->constrained('chauffeurs', 'id_chauffeur');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camions');
    }
};