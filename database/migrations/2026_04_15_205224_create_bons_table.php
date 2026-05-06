<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bons', function (Blueprint $table) {
            $table->id('id_bon');
            $table->string('code_verification', 4);
            $table->enum('type_carburant', ['essence', 'gasoil']);
            $table->decimal('quantite_commandee', 10, 2);
            $table->decimal('quantite_chargee', 10, 2)->nullable();
            $table->datetime('date_creation');
            $table->datetime('date_disponibilite');
            $table->enum('statut', ['cree', 'signe', 'en_cours', 'termine', 'annule'])->default('cree');
            $table->text('signature_fournisseur')->nullable();
            $table->string('photo_compteur', 255)->nullable();
            $table->foreignId('id_fournisseur')->constrained('fournisseurs', 'id_fournisseur');
            $table->foreignId('id_icr')->constrained('icr', 'id_icr');
            $table->foreignId('id_depot')->constrained('depots', 'id_depot');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bons');
    }
};