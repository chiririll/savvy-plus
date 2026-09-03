<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function reorderUser(): User
{
    return User::create([
        'name' => 'Accounts',
        'email' => 'accounts-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function reorderCurrency(): Currency
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

function reorderAccount(Currency $currency, string $name, string $type = 'cash'): Account
{
    return Account::create([
        'name' => $name,
        'type' => $type,
        'currency_id' => $currency->id,
        'initial_balance' => 0,
        'is_active' => true,
    ]);
}

it('lists accounts in sort order', function () {
    $user = reorderUser();
    $currency = reorderCurrency();
    $cash = reorderAccount($currency, 'Cash');
    $bank = reorderAccount($currency, 'Bank', 'bank');
    $crypto = reorderAccount($currency, 'Crypto', 'crypto');

    $cash->update(['sort_order' => 2]);
    $bank->update(['sort_order' => 0]);
    $crypto->update(['sort_order' => 1]);

    $response = callAs('GET', '/api/accounts?exclude_debts=true', [], $user);

    $response->assertOk()
        ->assertJsonPath('data.0.id', $bank->id)
        ->assertJsonPath('data.1.id', $crypto->id)
        ->assertJsonPath('data.2.id', $cash->id)
        ->assertJsonPath('data.0.sortOrder', 0);
});

it('reorders accounts and keeps the new order', function () {
    $user = reorderUser();
    $currency = reorderCurrency();
    $first = reorderAccount($currency, 'First');
    $second = reorderAccount($currency, 'Second', 'bank');
    $third = reorderAccount($currency, 'Third', 'crypto');

    $response = callAs('POST', '/api/accounts/reorder', [
        'ids' => [$third->id, $first->id, $second->id],
    ], $user);

    $response->assertOk()->assertJsonPath('success', true);

    expect($third->fresh()->sort_order)->toBe(0);
    expect($first->fresh()->sort_order)->toBe(1);
    expect($second->fresh()->sort_order)->toBe(2);

    $list = callAs('GET', '/api/accounts?exclude_debts=true', [], $user);

    $list->assertOk()
        ->assertJsonPath('data.0.id', $third->id)
        ->assertJsonPath('data.1.id', $first->id)
        ->assertJsonPath('data.2.id', $second->id);
});

it('assigns the next sort order when creating an account', function () {
    $user = reorderUser();
    $currency = reorderCurrency();
    reorderAccount($currency, 'Existing');

    $response = callAs('POST', '/api/accounts', [
        'name' => 'New',
        'type' => 'bank',
        'currency_id' => $currency->id,
        'initial_balance' => 0,
    ], $user);

    $response->assertCreated()->assertJsonPath('data.sortOrder', 1);
});

it('rejects reorder payloads with unknown ids', function () {
    $user = reorderUser();
    $currency = reorderCurrency();
    $account = reorderAccount($currency, 'Cash');

    $response = callAs('POST', '/api/accounts/reorder', [
        'ids' => [$account->id, 9999],
    ], $user);

    $response->assertUnprocessable();
});
