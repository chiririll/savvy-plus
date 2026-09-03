<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('status')->default('confirmed');
            $table->foreignId('recurring_transaction_id')
                ->nullable()
                ->constrained('recurring_transactions')
                ->nullOnDelete();
        });

        DB::statement('CREATE UNIQUE INDEX transactions_recurring_pending_unique ON transactions (recurring_transaction_id) WHERE status = \'pending\' AND recurring_transaction_id IS NOT NULL');

        $now = now();

        $templates = DB::table('recurring_transactions')->where('is_active', true)->get();

        foreach ($templates as $template) {
            $hasPending = DB::table('transactions')
                ->where('recurring_transaction_id', $template->id)
                ->where('status', 'pending')
                ->exists();

            if ($hasPending) {
                continue;
            }

            if ($template->end_date && $template->next_run_date > $template->end_date) {
                continue;
            }

            $transactionId = DB::table('transactions')->insertGetId([
                'type' => $template->type,
                'account_id' => $template->account_id,
                'to_account_id' => $template->to_account_id,
                'category_id' => $template->category_id,
                'amount' => $template->amount,
                'to_amount' => $template->to_amount,
                'description' => $template->description,
                'date' => $template->next_run_date,
                'status' => 'pending',
                'recurring_transaction_id' => $template->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $tagIds = DB::table('recurring_transaction_tag')
                ->where('recurring_transaction_id', $template->id)
                ->pluck('tag_id');

            foreach ($tagIds as $tagId) {
                DB::table('transaction_tag')->insert([
                    'transaction_id' => $transactionId,
                    'tag_id' => $tagId,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS transactions_recurring_pending_unique');

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['recurring_transaction_id']);
            $table->dropColumn(['status', 'recurring_transaction_id']);
        });
    }
};
