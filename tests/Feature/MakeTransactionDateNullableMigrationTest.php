<?php

use App\Models\Account;
use App\Models\Category;
use App\Models\Currency;
use App\Models\RecurringTransaction;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('rebuilds nullable transaction dates when recurring occurrences share an id', function () {
    $currency = Currency::create([
        'code' => 'USD',
        'name' => 'US Dollar',
        'symbol' => '$',
        'decimals' => 2,
        'is_base' => true,
        'rate' => 1,
    ]);

    $account = Account::create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => 1000,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Rent',
        'type' => 'expense',
    ]);

    $template = RecurringTransaction::create([
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 50,
        'description' => 'Rent',
        'frequency' => 'monthly',
        'interval' => 1,
        'day_of_month' => 1,
        'start_date' => '2026-01-01',
        'next_run_date' => '2026-03-01',
        'is_active' => true,
    ]);

    foreach (['2026-01-01', '2026-02-01'] as $date) {
        Transaction::create([
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 50,
            'description' => 'Rent',
            'date' => $date,
            'status' => 'confirmed',
            'recurring_transaction_id' => $template->id,
        ]);
    }

    Transaction::create([
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 50,
        'description' => 'Rent',
        'date' => '2026-03-01',
        'status' => 'pending',
        'recurring_transaction_id' => $template->id,
    ]);

    $migration = require database_path('migrations/2026_09_05_180000_make_transaction_date_nullable.php');
    $migration->up();

    expect(DB::table('transactions')->where('recurring_transaction_id', $template->id)->count())->toBe(3);

    $dateColumn = collect(DB::select("PRAGMA table_info('transactions')"))->firstWhere('name', 'date');
    expect((int) $dateColumn->notnull)->toBe(0);

    $index = DB::selectOne("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'transactions_recurring_pending_unique'");
    expect($index?->sql)->toContain("status = 'pending'");
});
