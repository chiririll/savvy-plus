<?php

use App\Enums\TransactionStatus;
use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Category;
use App\Models\Currency;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function historyChartUser(): User
{
    return User::create([
        'name' => 'History',
        'email' => 'history-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function historyChartUsd(): Currency
{
    return Currency::create([
        'code' => 'USD',
        'name' => 'US Dollar',
        'symbol' => '$',
        'decimals' => 2,
        'is_base' => true,
        'rate' => 1,
    ]);
}

function historyChartAccount(Currency $currency, string $name, float $balance = 1000): Account
{
    return Account::create([
        'name' => $name,
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => $balance,
        'is_active' => true,
    ]);
}

function historyChartCategory(string $type = 'income'): Category
{
    return Category::create([
        'name' => $type === 'income' ? 'Salary' : 'Food',
        'type' => $type,
        'icon' => '💰',
        'color' => '#22c55e',
    ]);
}

it('omits accounts with no confirmed cash flow in the selected period', function () {
    $user = historyChartUser();
    $usd = historyChartUsd();
    $active = historyChartAccount($usd, 'Active Cash', 200);
    historyChartAccount($usd, 'Idle Wallet', 500);
    $category = historyChartCategory();

    Transaction::create([
        'type' => 'income',
        'account_id' => $active->id,
        'category_id' => $category->id,
        'amount' => 50,
        'date' => '2026-03-10',
        'status' => TransactionStatus::Confirmed,
    ]);

    $response = callAs('GET', '/api/accounts-balance-history?start_date=2026-03-01&end_date=2026-03-31', [], $user);

    $response->assertOk();
    $names = collect($response->json('series'))->pluck('name');

    expect($names)->toContain('Active Cash')
        ->and($names)->not->toContain('Idle Wallet')
        ->and(collect($response->json('series'))->pluck('type'))->toContain('total');
});

it('keeps accounts that had activity even when net change is zero', function () {
    $user = historyChartUser();
    $usd = historyChartUsd();
    $account = historyChartAccount($usd, 'Churn', 100);
    $income = historyChartCategory('income');
    $expense = historyChartCategory('expense');

    Transaction::create([
        'type' => 'income',
        'account_id' => $account->id,
        'category_id' => $income->id,
        'amount' => 40,
        'date' => '2026-03-05',
        'status' => TransactionStatus::Confirmed,
    ]);
    Transaction::create([
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $expense->id,
        'amount' => 40,
        'date' => '2026-03-20',
        'status' => TransactionStatus::Confirmed,
    ]);

    $response = callAs('GET', '/api/accounts-balance-history?start_date=2026-03-01&end_date=2026-03-31', [], $user);

    $series = collect($response->json('series'))->firstWhere('name', 'Churn');

    expect($series)->not->toBeNull()
        ->and($series['native_data'][0])->toBe(100)
        ->and(end($series['native_data']))->toBe(100);
});

it('returns legend amounts in each account currency while total stays in base', function () {
    $user = historyChartUser();
    $usd = historyChartUsd();
    $eur = Currency::create([
        'code' => 'EUR',
        'name' => 'Euro',
        'symbol' => '€',
        'decimals' => 2,
        'is_base' => false,
        'rate' => 2,
    ]);
    $usdAccount = historyChartAccount($usd, 'USD Cash', 0);
    $eurAccount = historyChartAccount($eur, 'EUR Cash', 0);
    $category = historyChartCategory();

    Transaction::create([
        'type' => 'income',
        'account_id' => $usdAccount->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => '2026-03-10',
        'status' => TransactionStatus::Confirmed,
    ]);
    Transaction::create([
        'type' => 'income',
        'account_id' => $eurAccount->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => '2026-03-10',
        'status' => TransactionStatus::Confirmed,
    ]);

    $response = callAs('GET', '/api/accounts-balance-history?start_date=2026-03-01&end_date=2026-03-31', [], $user);
    $series = collect($response->json('series'));
    $usdSeries = $series->firstWhere('name', 'USD Cash');
    $eurSeries = $series->firstWhere('name', 'EUR Cash');
    $total = $series->firstWhere('type', 'total');

    expect($usdSeries['currency'])->toBe('USD')
        ->and(end($usdSeries['native_data']))->toBe(10)
        ->and(end($usdSeries['data']))->toBe(10)
        ->and($eurSeries['currency'])->toBe('EUR')
        ->and(end($eurSeries['native_data']))->toBe(10)
        ->and(end($eurSeries['data']))->toBe(20)
        ->and($total['currency'])->toBe('USD')
        ->and(end($total['data']))->toBe(30);
});

it('does not treat pending transactions as period movement', function () {
    $user = historyChartUser();
    $usd = historyChartUsd();
    $account = historyChartAccount($usd, 'Pending Only', 300);
    $category = historyChartCategory('expense');

    Transaction::create([
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 25,
        'date' => '2026-03-12',
        'status' => TransactionStatus::Pending,
    ]);

    $response = callAs('GET', '/api/accounts-balance-history?start_date=2026-03-01&end_date=2026-03-31', [], $user);
    $names = collect($response->json('series'))->pluck('name');

    expect($names)->not->toContain('Pending Only');
});
