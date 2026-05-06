<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id('id_stock');
            $table->enum('type_carburant', ['essence', 'gasoil']);
            $table->decimal('quantite', 10, 2)->default(0);
            $table->decimal('seuil_alerte', 10, 2)->default(1000);
            $table->datetime('date_mise_a_jour');
            $table->foreignId('id_depot')->nullable()->constrained('depots', 'id_depot')->onDelete('cascade');
            $table->foreignId('id_station')->nullable()->constrained('stations', 'id_station')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};