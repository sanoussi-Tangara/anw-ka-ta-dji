<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
            $table->id('id_alerte');
            $table->string('type', 50);
            $table->text('message');
            $table->datetime('date_creation');
            $table->enum('statut', ['non_lue', 'lue', 'traitee'])->default('non_lue');
            $table->foreignId('id_destinataire')->constrained('users', 'id_utilisateur');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes');
    }
};