<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventes', function (Blueprint $table) {
            $table->id('id_vente');
            $table->enum('type_carburant', ['essence', 'gasoil']);
            $table->decimal('quantite', 10, 2);
            $table->decimal('montant', 10, 2);
            $table->datetime('date_vente');
            $table->string('periode', 20)->nullable();
            $table->foreignId('id_pompiste')->constrained('pompistes', 'id_pompiste');
            $table->foreignId('id_station')->constrained('stations', 'id_station');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventes');
    }
};