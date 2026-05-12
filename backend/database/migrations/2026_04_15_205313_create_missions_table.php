<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id('id_mission');
            $table->datetime('date_debut')->nullable();
            $table->datetime('date_fin')->nullable();
            $table->enum('statut', ['planifiee', 'en_cours', 'terminee', 'annulee'])->default('planifiee');
            $table->foreignId('id_bon')->constrained('bons', 'id_bon');
            $table->foreignId('id_icr')->constrained('icr', 'id_icr');
            $table->foreignId('id_chauffeur')->constrained('chauffeurs', 'id_chauffeur');
            $table->foreignId('id_camion')->constrained('camions', 'id_camion');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};