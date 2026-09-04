<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Currency;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function debtUser(): User
{
    return User::create([
        'name' => 'Debts',
        'email' => 'debts-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function debtCurrency(): Currency
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

function cashAccount(Currency $currency, float $balance = 1000): Account
{
    return Account::create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => $balance,
        'is_active' => true,
    ]);
}

it('lends money when creating an owed_to_me debt', function () {
    $user = debtUser();
    $account = cashAccount(debtCurrency());

    $response = callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'Loan to Ivan',
        'debt_type' => 'owed_to_me',
        'account_id' => $account->id,
        'amount' => 200,
        'date' => '2026-09-01',
    ], $user);

    $response->assertCreated()
        ->assertJsonPath('data.remainingDebt', 200)
        ->assertJsonPath('data.currencyId', $account->currency_id);

    expect((float) $account->fresh()->current_balance)->toBe(800.0);
    expect(Transaction::where('type', 'debt_lend')->where('to_account_id', $response->json('data.id'))->count())->toBe(1);
});

it('credits the account when creating an i_owe debt', function () {
    $user = debtUser();
    $account = cashAccount(debtCurrency());

    $response = callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'Borrowed from bank',
        'debt_type' => 'i_owe',
        'account_id' => $account->id,
        'amount' => 300,
        'date' => '2026-09-01',
    ], $user);

    $response->assertCreated()
        ->assertJsonPath('data.remainingDebt', 300);

    expect((float) $account->fresh()->current_balance)->toBe(1300.0);
    expect(Transaction::where('type', 'debt_borrow')->count())->toBe(1);
});

it('records an existing debt without moving money', function () {
    $user = debtUser();
    $currency = debtCurrency();
    $account = cashAccount($currency);

    $response = callAs('POST', '/api/debts', [
        'origin' => 'existing',
        'name' => 'Old loan',
        'debt_type' => 'owed_to_me',
        'currency_id' => $currency->id,
        'amount' => 150,
    ], $user);

    $response->assertCreated()
        ->assertJsonPath('data.remainingDebt', 150);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
    expect(Transaction::count())->toBe(0);
});

it('requires a date and account for a new operation', function () {
    $user = debtUser();
    $account = cashAccount(debtCurrency());

    callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'No date',
        'debt_type' => 'owed_to_me',
        'account_id' => $account->id,
        'amount' => 50,
    ], $user)->assertStatus(422)->assertJsonValidationErrors(['date']);

    callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'No account',
        'debt_type' => 'owed_to_me',
        'amount' => 50,
        'date' => '2026-09-01',
    ], $user)->assertStatus(422)->assertJsonValidationErrors(['account_id']);
});

it('deletes a newly issued debt and restores the account balance', function () {
    $user = debtUser();
    $account = cashAccount(debtCurrency());

    $created = callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'Loan to Ivan',
        'debt_type' => 'owed_to_me',
        'account_id' => $account->id,
        'amount' => 200,
        'date' => '2026-09-01',
    ], $user);

    $created->assertCreated();
    $debtId = $created->json('data.id');

    callAs('DELETE', "/api/debts/{$debtId}", [], $user)->assertNoContent();

    expect(Account::find($debtId))->toBeNull();
    expect(Transaction::count())->toBe(0);
    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('rejects deleting a debt after a repayment', function () {
    $user = debtUser();
    $account = cashAccount(debtCurrency());

    $created = callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'Loan to Ivan',
        'debt_type' => 'owed_to_me',
        'account_id' => $account->id,
        'amount' => 200,
        'date' => '2026-09-01',
    ], $user);

    $debtId = $created->json('data.id');

    callAs('POST', "/api/debts/{$debtId}/collect", [
        'account_id' => $account->id,
        'amount' => 50,
        'date' => '2026-09-02',
    ], $user)->assertCreated();

    callAs('DELETE', "/api/debts/{$debtId}", [], $user)->assertStatus(422);
    expect(Account::find($debtId))->not->toBeNull();
});

it('rejects lending more than the account balance', function () {
    $user = debtUser();
    $account = cashAccount(debtCurrency(), 100);

    callAs('POST', '/api/debts', [
        'origin' => 'new',
        'name' => 'Too much',
        'debt_type' => 'owed_to_me',
        'account_id' => $account->id,
        'amount' => 150,
        'date' => '2026-09-01',
    ], $user)->assertStatus(422)->assertJsonValidationErrors(['amount']);
});
