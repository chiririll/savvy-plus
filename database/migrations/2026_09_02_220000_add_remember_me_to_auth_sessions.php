<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('auth_sessions', function (Blueprint $table) {
            $table->boolean('remember_me')->default(false)->after('user_agent');
            $table->timestamp('refreshed_at')->nullable()->after('last_used_at');
        });
    }

    public function down(): void
    {
        Schema::table('auth_sessions', function (Blueprint $table) {
            $table->dropColumn(['remember_me', 'refreshed_at']);
        });
    }
};
