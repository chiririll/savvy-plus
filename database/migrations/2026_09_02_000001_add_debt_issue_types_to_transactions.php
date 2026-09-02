<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys=off');

        DB::statement('
            CREATE TABLE "transactions_new" (
                "id" integer primary key autoincrement not null,
                "type" varchar check ("type" in (\'income\', \'expense\', \'transfer\', \'debt_payment\', \'debt_collection\', \'debt_lend\', \'debt_borrow\')) not null,
                "account_id" integer not null,
                "to_account_id" integer,
                "category_id" integer,
                "amount" numeric not null,
                "to_amount" numeric,
                "exchange_rate" numeric,
                "description" varchar,
                "dedup_hash" varchar,
                "date" date not null,
                "created_at" datetime,
                "updated_at" datetime,
                foreign key("account_id") references "accounts"("id"),
                foreign key("to_account_id") references "accounts"("id"),
                foreign key("category_id") references "categories"("id")
            )
        ');

        DB::statement('
            INSERT INTO transactions_new (
                id, type, account_id, to_account_id, category_id, amount, to_amount,
                exchange_rate, description, dedup_hash, date, created_at, updated_at
            )
            SELECT
                id, type, account_id, to_account_id, category_id, amount, to_amount,
                exchange_rate, description, dedup_hash, date, created_at, updated_at
            FROM transactions
        ');

        Schema::drop('transactions');
        DB::statement('ALTER TABLE transactions_new RENAME TO transactions');

        $this->recreateIndexes();

        DB::statement('PRAGMA foreign_keys=on');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys=off');

        DB::statement('
            CREATE TABLE "transactions_old" (
                "id" integer primary key autoincrement not null,
                "type" varchar check ("type" in (\'income\', \'expense\', \'transfer\', \'debt_payment\', \'debt_collection\')) not null,
                "account_id" integer not null,
                "to_account_id" integer,
                "category_id" integer,
                "amount" numeric not null,
                "to_amount" numeric,
                "exchange_rate" numeric,
                "description" varchar,
                "dedup_hash" varchar,
                "date" date not null,
                "created_at" datetime,
                "updated_at" datetime,
                foreign key("account_id") references "accounts"("id"),
                foreign key("to_account_id") references "accounts"("id"),
                foreign key("category_id") references "categories"("id")
            )
        ');

        DB::statement('
            INSERT INTO transactions_old (
                id, type, account_id, to_account_id, category_id, amount, to_amount,
                exchange_rate, description, dedup_hash, date, created_at, updated_at
            )
            SELECT
                id, type, account_id, to_account_id, category_id, amount, to_amount,
                exchange_rate, description, dedup_hash, date, created_at, updated_at
            FROM transactions
            WHERE type IN (\'income\', \'expense\', \'transfer\', \'debt_payment\', \'debt_collection\')
        ');

        Schema::drop('transactions');
        DB::statement('ALTER TABLE transactions_old RENAME TO transactions');

        $this->recreateIndexes();

        DB::statement('PRAGMA foreign_keys=on');
    }

    private function recreateIndexes(): void
    {
        DB::statement('CREATE INDEX "transactions_date_index" ON "transactions" ("date")');
        DB::statement('CREATE UNIQUE INDEX "transactions_account_dedup_unique" ON "transactions" ("account_id", "dedup_hash")');
        DB::statement('CREATE INDEX "transactions_account_type_date_amount_index" ON "transactions" ("account_id", "type", "date", "amount")');
        DB::statement('CREATE INDEX "transactions_to_account_date_amount_index" ON "transactions" ("to_account_id", "date", "to_amount")');
        DB::statement('CREATE INDEX "transactions_type_date_amount_index" ON "transactions" ("type", "date", "amount")');
        DB::statement('CREATE INDEX "transactions_account_date_index" ON "transactions" ("account_id", "date")');
    }
};
