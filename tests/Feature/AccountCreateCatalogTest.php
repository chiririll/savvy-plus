<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function catalogUser(): User
{
    return User::create([
        'name' => 'Accounts',
        'email' => 'catalog-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function catalogUsd(): Currency
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

function fakeCurrencyCatalog(): void
{
    Http::fake([
        'https://cdn.jsdelivr.net/gh/fawazahmed0/exchange-api@main/other/Common-Currency.json' => Http::response([
            'USD' => ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'decimal_digits' => 2],
            'GBP' => ['code' => 'GBP', 'name' => 'British Pound', 'symbol_native' => '£', 'decimal_digits' => 2],
        ], 200),
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json' => Http::response([
            'date' => '2026-09-03',
            'usd' => ['gbp' => 0.79],
        ], 200),
    ]);
}

it('creates an account and a catalog currency together', function () {
    $user = catalogUser();
    catalogUsd();
    fakeCurrencyCatalog();

    $response = callAs('POST', '/api/accounts', [
        'name' => 'Barclays',
        'type' => 'bank',
        'currency_code' => 'GBP',
        'initial_balance' => 100,
    ], $user);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Barclays')
        ->assertJsonPath('data.currency.code', 'GBP')
        ->assertJsonPath('data.currency.symbol', '£');

    $gbp = Currency::where('code', 'GBP')->first();
    expect($gbp)->not->toBeNull()
        ->and($gbp->name)->toBe('British Pound')
        ->and($gbp->is_base)->toBeFalse()
        ->and((float) $gbp->rate)->toBe(round(1 / 0.79, 6));
});

it('reuses an existing currency when currency_code already exists', function () {
    $user = catalogUser();
    $usd = catalogUsd();
    fakeCurrencyCatalog();

    $response = callAs('POST', '/api/accounts', [
        'name' => 'Cash',
        'type' => 'cash',
        'currency_code' => 'USD',
    ], $user);

    $response->assertCreated()->assertJsonPath('data.currencyId', $usd->id);
    expect(Currency::where('code', 'USD')->count())->toBe(1);
});

it('rejects an unknown catalog currency code', function () {
    $user = catalogUser();
    catalogUsd();
    fakeCurrencyCatalog();

    $response = callAs('POST', '/api/accounts', [
        'name' => 'Cash',
        'type' => 'cash',
        'currency_code' => 'XXX',
    ], $user);

    $response->assertUnprocessable();
    expect(Account::count())->toBe(0);
    expect(Currency::where('code', 'XXX')->exists())->toBeFalse();
});
