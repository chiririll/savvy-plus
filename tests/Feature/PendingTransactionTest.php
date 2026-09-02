<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Category;
use App\Models\Currency;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function pendingUser(): User
{
    return User::create([
        'name' => 'Pending',
        'email' => 'pending-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function pendingCurrency(): Currency
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

function pendingAccount(Currency $currency, float $balance = 1000): Account
{
    return Account::create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => $balance,
        'is_active' => true,
    ]);
}

function pendingCategory(): Category
{
    return Category::create([
        'name' => 'Food',
        'type' => 'expense',
        'icon' => '🛒',
        'color' => '#ef4444',
    ]);
}

it('creates a pending transaction for a future date without changing balance', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $response = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 50,
        'date' => now()->addDay()->toDateString(),
    ], $user);

    $response->assertCreated()->assertJsonPath('data.status', 'pending');
    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('creates a confirmed transaction for today and deducts the amount', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $response = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 50,
        'date' => now()->toDateString(),
    ], $user);

    $response->assertCreated()->assertJsonPath('data.status', 'confirmed');
    expect((float) $account->fresh()->current_balance)->toBe(950.0);
});

it('confirms a pending transaction and deducts the amount', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 75,
        'date' => now()->addDays(3)->toDateString(),
    ], $user);

    $id = $created->json('data.id');

    callAs('POST', "/api/transactions/{$id}/confirm", [], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed');

    expect((float) $account->fresh()->current_balance)->toBe(925.0);
});

it('does not create a pending occurrence for an inactive recurring template', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $response = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 120,
        'frequency' => 'monthly',
        'interval' => 1,
        'day_of_month' => now()->day,
        'start_date' => now()->toDateString(),
        'is_active' => false,
    ], $user);

    $response->assertCreated();
    expect(Transaction::pending()->where('recurring_transaction_id', $response->json('data.id'))->count())->toBe(0);
});

it('creates a pending occurrence when a recurring template is created', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();
    $today = now()->toDateString();

    $response = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 120,
        'frequency' => 'monthly',
        'interval' => 1,
        'day_of_month' => now()->day,
        'start_date' => $today,
        'is_active' => true,
    ], $user);

    $response->assertCreated();
    expect((float) $account->fresh()->current_balance)->toBe(1000.0);

    $pending = Transaction::pending()->where('recurring_transaction_id', $response->json('data.id'))->first();
    expect($pending)->not->toBeNull()
        ->and((float) $pending->amount)->toBe(120.0)
        ->and($pending->date->toDateString())->toBe($today);
});

it('creates the first pending on the start date even when it is in the past', function () {
    $this->travelTo('2026-09-02');

    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $response = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 50,
        'frequency' => 'monthly',
        'interval' => 1,
        'day_of_month' => 15,
        'start_date' => '2026-08-19',
        'is_active' => true,
    ], $user);

    $response->assertCreated();
    expect(
        Transaction::pending()->where('recurring_transaction_id', $response->json('data.id'))->first()->date->toDateString()
    )->toBe('2026-08-19');
});

it('spawns the next pending after confirming a recurring occurrence', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 80,
        'frequency' => 'daily',
        'interval' => 1,
        'start_date' => now()->toDateString(),
        'is_active' => true,
    ], $user);

    $templateId = $created->json('data.id');
    $pending = Transaction::pending()->where('recurring_transaction_id', $templateId)->first();

    callAs('POST', "/api/transactions/{$pending->id}/confirm", [], $user)->assertOk();

    expect((float) $account->fresh()->current_balance)->toBe(920.0);
    expect(Transaction::pending()->where('recurring_transaction_id', $templateId)->count())->toBe(1);
    expect(Transaction::confirmed()->where('recurring_transaction_id', $templateId)->count())->toBe(1);
});

it('does not spawn the next pending after the end date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 40,
        'frequency' => 'daily',
        'interval' => 1,
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
        'is_active' => true,
    ], $user);

    $templateId = $created->json('data.id');
    $pending = Transaction::pending()->where('recurring_transaction_id', $templateId)->first();

    callAs('POST', "/api/transactions/{$pending->id}/confirm", [], $user)->assertOk();

    expect(Transaction::pending()->where('recurring_transaction_id', $templateId)->count())->toBe(0);
});

it('skips a recurring pending as skipped and creates the next one', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 30,
        'frequency' => 'daily',
        'interval' => 1,
        'start_date' => now()->toDateString(),
        'is_active' => true,
    ], $user);

    $templateId = $created->json('data.id');
    $pending = Transaction::pending()->where('recurring_transaction_id', $templateId)->first();

    callAs('POST', "/api/transactions/{$pending->id}/skip", [], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'skipped');

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
    expect(Transaction::skipped()->where('recurring_transaction_id', $templateId)->count())->toBe(1);
    expect(Transaction::pending()->where('recurring_transaction_id', $templateId)->count())->toBe(1);
});

it('rejects skip on a one-off pending transaction', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => now()->addDay()->toDateString(),
    ], $user);

    callAs('POST', '/api/transactions/'.$created->json('data.id').'/skip', [], $user)
        ->assertStatus(422);
});

it('rejects deleting a recurring pending or skipped occurrence', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 15,
        'frequency' => 'daily',
        'interval' => 1,
        'start_date' => now()->toDateString(),
        'is_active' => true,
    ], $user);

    $pending = Transaction::pending()->where('recurring_transaction_id', $created->json('data.id'))->first();

    callAs('DELETE', "/api/transactions/{$pending->id}", [], $user)->assertStatus(422);

    callAs('POST', "/api/transactions/{$pending->id}/skip", [], $user)->assertOk();
    $skipped = Transaction::skipped()->where('recurring_transaction_id', $created->json('data.id'))->first();

    callAs('DELETE', "/api/transactions/{$skipped->id}", [], $user)->assertStatus(422);
});

it('deletes a one-off pending transaction', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => now()->addDay()->toDateString(),
    ], $user);

    $id = $created->json('data.id');
    callAs('DELETE', "/api/transactions/{$id}", [], $user)->assertNoContent();
    expect(Transaction::find($id))->toBeNull();
});

it('keeps summary confirmed-only when listing pending transactions', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 100,
        'date' => now()->toDateString(),
    ], $user)->assertCreated();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 40,
        'date' => now()->addDay()->toDateString(),
    ], $user)->assertCreated();

    $response = callAs('GET', '/api/transactions?status=pending&with_summary=1', [], $user);

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect((float) $response->json('summary.expense'))->toBe(100.0);
});

it('no longer registers the recurring process command', function () {
    expect(collect(Illuminate\Support\Facades\Artisan::all())->has('recurring:process'))->toBeFalse();
});
