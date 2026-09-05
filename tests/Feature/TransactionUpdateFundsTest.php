<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Category;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function updateFundsUser(): User
{
    return User::create([
        'name' => 'Editor',
        'email' => 'update-funds-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function updateFundsCurrency(): Currency
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

function updateFundsAccount(Currency $currency, float $balance = 100): Account
{
    return Account::create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => $balance,
        'is_active' => true,
    ]);
}

function updateFundsCategory(): Category
{
    return Category::create([
        'name' => 'Food',
        'type' => 'expense',
        'icon' => '🛒',
        'color' => '#ef4444',
    ]);
}

it('allows editing an expense amount when the delta fits the remaining balance', function () {
    $user = updateFundsUser();
    $account = updateFundsAccount(updateFundsCurrency());
    $category = updateFundsCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'date' => now()->toDateString(),
    ], $user);

    $created->assertCreated();
    expect((float) $account->fresh()->current_balance)->toBe(20.0);

    $id = $created->json('data.id');

    callAs('PATCH', "/api/transactions/{$id}", [
        'amount' => 90,
    ], $user)
        ->assertOk()
        ->assertJsonPath('data.amount', 90);

    expect((float) $account->fresh()->current_balance)->toBe(10.0);
});

it('allows saving an expense without changing the amount', function () {
    $user = updateFundsUser();
    $account = updateFundsAccount(updateFundsCurrency());
    $category = updateFundsCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'description' => 'Lunch',
        'date' => now()->toDateString(),
    ], $user);

    $id = $created->json('data.id');

    callAs('PATCH', "/api/transactions/{$id}", [
        'amount' => 80,
        'description' => 'Dinner',
    ], $user)
        ->assertOk()
        ->assertJsonPath('data.description', 'Dinner');

    expect((float) $account->fresh()->current_balance)->toBe(20.0);
});

it('rejects editing an expense when the amount delta exceeds the remaining balance', function () {
    $user = updateFundsUser();
    $account = updateFundsAccount(updateFundsCurrency());
    $category = updateFundsCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'date' => now()->toDateString(),
    ], $user);

    $id = $created->json('data.id');

    callAs('PATCH', "/api/transactions/{$id}", [
        'amount' => 150,
    ], $user)
        ->assertStatus(422)
        ->assertJsonValidationErrors('amount');

    expect((float) $account->fresh()->current_balance)->toBe(20.0);
});
