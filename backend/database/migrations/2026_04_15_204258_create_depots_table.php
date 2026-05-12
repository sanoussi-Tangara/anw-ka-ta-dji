<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depots', function (Blueprint $table) {
            $table->id('id_depot');
            $table->string('nom', 100);
            $table->string('localisation', 200);
            $table->foreignId('id_responsable')->constrained('responsables_depot', 'id_responsable');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depots');
    }
};