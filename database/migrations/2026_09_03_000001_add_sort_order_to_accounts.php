<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0);
        });

        $regular = DB::table('accounts')
            ->whereIn('type', ['bank', 'crypto', 'cash'])
            ->orderBy('id')
            ->get(['id']);

        foreach ($regular as $index => $account) {
            DB::table('accounts')->where('id', $account->id)->update(['sort_order' => $index]);
        }

        $debts = DB::table('accounts')
            ->where('type', 'debt')
            ->orderBy('id')
            ->get(['id']);

        foreach ($debts as $index => $account) {
            DB::table('accounts')->where('id', $account->id)->update(['sort_order' => $index]);
        }
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
