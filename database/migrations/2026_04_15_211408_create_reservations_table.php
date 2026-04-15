<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id('id_reservation');
            $table->decimal('quantite', 10, 2);
            $table->datetime('date_reservation');
            $table->datetime('date_retrait');
            $table->enum('statut', ['en_attente', 'confirmee', 'annulee'])->default('en_attente');
            $table->foreignId('id_consommateur')->constrained('consommateurs', 'id_consommateur');
            $table->foreignId('id_station')->constrained('stations', 'id_station');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};