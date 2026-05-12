<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificats', function (Blueprint $table) {
            $table->id('id_certificat');
            $table->datetime('date_generation');
            $table->string('contenu_pdf', 255)->nullable();
            $table->text('signature_icr');
            $table->text('signature_chauffeur');
            $table->foreignId('id_mission')->constrained('missions', 'id_mission');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificats');
    }
};