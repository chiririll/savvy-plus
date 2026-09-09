<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Category;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function negativeBalanceUser(): User
{
    return User::create([
        'name' => 'Negative',
        'email' => 'negative-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function negativeBalanceCurrency(): Currency
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

function negativeBalanceAccount(Currency $currency, float $balance = 50, string $name = 'Cash'): Account
{
    return Account::create([
        'name' => $name,
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => $balance,
        'is_active' => true,
    ]);
}

function negativeBalanceCategory(string $type = 'expense'): Category
{
    return Category::create([
        'name' => $type === 'expense' ? 'Food' : 'Salary',
        'type' => $type,
        'icon' => '🛒',
        'color' => '#ef4444',
    ]);
}

it('creates a confirmed expense that takes the account negative', function () {
    $user = negativeBalanceUser();
    $account = negativeBalanceAccount(negativeBalanceCurrency());
    $category = negativeBalanceCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'date' => now()->toDateString(),
    ], $user)
        ->assertCreated()
        ->assertJsonPath('data.status', 'confirmed')
        ->assertJsonPath('data.amount', 80);

    expect((float) $account->fresh()->current_balance)->toBe(-30.0);
});

it('creates a confirmed transfer that takes the source account negative', function () {
    $user = negativeBalanceUser();
    $currency = negativeBalanceCurrency();
    $source = negativeBalanceAccount($currency, 40, 'From');
    $destination = negativeBalanceAccount($currency, 10, 'To');

    callAs('POST', '/api/transactions', [
        'type' => 'transfer',
        'account_id' => $source->id,
        'to_account_id' => $destination->id,
        'amount' => 75,
        'date' => now()->toDateString(),
    ], $user)
        ->assertCreated()
        ->assertJsonPath('data.status', 'confirmed');

    expect((float) $source->fresh()->current_balance)->toBe(-35.0)
        ->and((float) $destination->fresh()->current_balance)->toBe(85.0);
});

it('does not spend a future pending expense that would exceed the balance', function () {
    $user = negativeBalanceUser();
    $account = negativeBalanceAccount(negativeBalanceCurrency());
    $category = negativeBalanceCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'date' => now()->addDay()->toDateString(),
    ], $user)
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending');

    expect((float) $account->fresh()->current_balance)->toBe(50.0);
});

it('does not spend an undated pending expense that would exceed the balance', function () {
    $user = negativeBalanceUser();
    $account = negativeBalanceAccount(negativeBalanceCurrency());
    $category = negativeBalanceCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'date' => null,
    ], $user)
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.date', null);

    expect((float) $account->fresh()->current_balance)->toBe(50.0);
});

it('confirms a pending expense that takes the account negative', function () {
    $user = negativeBalanceUser();
    $account = negativeBalanceAccount(negativeBalanceCurrency());
    $category = negativeBalanceCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'date' => now()->addDays(2)->toDateString(),
    ], $user)->assertCreated();

    expect((float) $account->fresh()->current_balance)->toBe(50.0);

    $id = $created->json('data.id');
    $today = now()->toDateString();

    callAs('POST', "/api/transactions/{$id}/confirm", ['date' => $today], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed')
        ->assertJsonPath('data.date', $today);

    expect((float) $account->fresh()->current_balance)->toBe(-30.0);
});

it('pays an i_owe debt from an account that goes negative', function () {
    $user = negativeBalanceUser();
    $account = negativeBalanceAccount(negativeBalanceCurrency(), 20);

    $created = callAs('POST', '/api/debts', [
        'origin' => 'existing',
        'name' => 'Loan',
        'debt_type' => 'i_owe',
        'currency_id' => $account->currency_id,
        'amount' => 40,
    ], $user)->assertCreated();

    $debtId = $created->json('data.id');

    callAs('POST', "/api/debts/{$debtId}/payment", [
        'account_id' => $account->id,
        'amount' => 40,
        'date' => now()->toDateString(),
    ], $user)->assertSuccessful();

    expect((float) $account->fresh()->current_balance)->toBe(-20.0);
    expect((float) Account::find($debtId)->current_balance)->toBe(0.0);
});
