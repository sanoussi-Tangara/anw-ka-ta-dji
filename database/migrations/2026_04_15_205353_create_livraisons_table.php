<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livraisons', function (Blueprint $table) {
            $table->id('id_livraison');
            $table->decimal('quantite_prevue', 10, 2);
            $table->decimal('quantite_livree', 10, 2)->nullable();
            $table->string('code_validation', 4);
            $table->datetime('date_livraison')->nullable();
            $table->text('signature_gerant')->nullable();
            $table->text('signature_chauffeur')->nullable();
            $table->string('photo_compteur', 255)->nullable();
            $table->enum('statut', ['en_attente', 'validee', 'ecart'])->default('en_attente');
            $table->foreignId('id_mission')->constrained('missions', 'id_mission');
            $table->foreignId('id_station')->constrained('stations', 'id_station');
            $table->foreignId('id_gerant')->constrained('gerants', 'id_gerant');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livraisons');
    }
};