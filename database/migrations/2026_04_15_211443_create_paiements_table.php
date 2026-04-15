<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id('id_paiement');
            $table->decimal('montant', 10, 2);
            $table->string('mode_paiement', 50);
            $table->datetime('date_paiement');
            $table->enum('statut', ['en_attente', 'paye', 'echoue'])->default('en_attente');
            $table->string('reference_transaction', 100)->nullable();
            $table->foreignId('id_reservation')->constrained('reservations', 'id_reservation');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};