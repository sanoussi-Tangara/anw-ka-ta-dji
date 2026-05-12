<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('prix_essence', 10, 2)->default(750);
            $table->decimal('prix_gasoil', 10, 2)->default(700);
            $table->datetime('prix_updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['prix_essence', 'prix_gasoil', 'prix_updated_at']);
        });
    }
};