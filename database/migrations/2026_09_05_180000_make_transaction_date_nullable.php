<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE transactions ALTER COLUMN date DROP NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE transactions MODIFY date DATE NULL');
        } else {
            // SQLite cannot ALTER COLUMN; change() rebuilds the table and can
            // replace the partial recurring-pending unique index with a full unique.
            Schema::table('transactions', function ($table) {
                $table->date('date')->nullable()->change();
            });

            $this->restoreRecurringPendingUnique();
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE transactions ALTER COLUMN date SET NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE transactions MODIFY date DATE NOT NULL');
        } else {
            Schema::table('transactions', function ($table) {
                $table->date('date')->nullable(false)->change();
            });

            $this->restoreRecurringPendingUnique();
        }
    }

    private function restoreRecurringPendingUnique(): void
    {
        $indexes = DB::select("PRAGMA index_list('transactions')");

        foreach ($indexes as $index) {
            $name = $index->name ?? '';
            $unique = (int) ($index->unique ?? 0);

            if ($name === '' || $unique !== 1 || str_starts_with($name, 'sqlite_autoindex_')) {
                continue;
            }

            $columns = DB::select("PRAGMA index_info('{$name}')");
            $columnNames = array_map(fn ($column) => $column->name ?? '', $columns);

            if ($columnNames === ['recurring_transaction_id']) {
                DB::statement("DROP INDEX IF EXISTS {$name}");
            }
        }

        DB::statement('DROP INDEX IF EXISTS transactions_recurring_pending_unique');
        DB::statement('CREATE UNIQUE INDEX transactions_recurring_pending_unique ON transactions (recurring_transaction_id) WHERE status = \'pending\' AND recurring_transaction_id IS NOT NULL');
    }
};
