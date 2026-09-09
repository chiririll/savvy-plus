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
    $today = now()->toDateString();

    callAs('POST', "/api/transactions/{$id}/confirm", ['date' => $today], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed')
        ->assertJsonPath('data.date', $today);

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

it('duplicates a one-off pending transaction as pending with the same date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();
    $date = now()->addDays(4)->toDateString();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 25,
        'date' => $date,
    ], $user);

    $response = callAs('POST', '/api/transactions/'.$created->json('data.id').'/duplicate', [], $user);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.date', $date)
        ->assertJsonPath('data.recurringTransactionId', null)
        ->assertJsonPath('data.actions.edit', true)
        ->assertJsonPath('data.actions.duplicate', true)
        ->assertJsonPath('data.actions.confirm', true)
        ->assertJsonPath('data.actions.skip', false);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('rejects editing or duplicating a recurring pending occurrence', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/recurring', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 20,
        'frequency' => 'daily',
        'interval' => 1,
        'start_date' => now()->toDateString(),
        'is_active' => true,
    ], $user);

    $pending = Transaction::pending()->where('recurring_transaction_id', $created->json('data.id'))->first();

    callAs('GET', "/api/transactions/{$pending->id}", [], $user)
        ->assertOk()
        ->assertJsonPath('data.actions.edit', false)
        ->assertJsonPath('data.actions.duplicate', false)
        ->assertJsonPath('data.actions.delete', false)
        ->assertJsonPath('data.actions.confirm', true)
        ->assertJsonPath('data.actions.skip', true);

    callAs('PUT', "/api/transactions/{$pending->id}", [
        'amount' => 99,
    ], $user)->assertStatus(422);

    callAs('POST', "/api/transactions/{$pending->id}/duplicate", [], $user)->assertStatus(422);
});

it('creates a pending transaction without a date and does not change balance', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $response = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 40,
        'date' => null,
    ], $user);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.date', null);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('rejects confirming an undated pending transaction without a date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 40,
    ], $user);

    $id = $created->json('data.id');

    callAs('POST', "/api/transactions/{$id}/confirm", [], $user)
        ->assertStatus(422);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('confirms an undated pending transaction with a chosen date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();
    $date = now()->subDay()->toDateString();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 60,
    ], $user);

    $id = $created->json('data.id');

    callAs('POST', "/api/transactions/{$id}/confirm", ['date' => $date], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed')
        ->assertJsonPath('data.date', $date);

    expect((float) $account->fresh()->current_balance)->toBe(940.0);
});

it('confirms a dated pending transaction using today and persists that date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();
    $today = now()->toDateString();
    $original = now()->subDays(5)->toDateString();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 25,
        'date' => now()->addDays(2)->toDateString(),
    ], $user);

    $id = $created->json('data.id');

    Transaction::query()->whereKey($id)->update(['date' => $original]);

    callAs('POST', "/api/transactions/{$id}/confirm", ['date' => $today], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed')
        ->assertJsonPath('data.date', $today);

    expect((float) $account->fresh()->current_balance)->toBe(975.0);
});

it('clears the date on a pending transaction and keeps it pending', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 15,
        'date' => now()->addDay()->toDateString(),
    ], $user);

    $id = $created->json('data.id');

    callAs('PUT', "/api/transactions/{$id}", [
        'date' => null,
    ], $user)
        ->assertOk()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.date', null);
});

it('rejects clearing the date on a confirmed transaction', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => now()->toDateString(),
    ], $user);

    $id = $created->json('data.id');

    callAs('PUT', "/api/transactions/{$id}", [
        'date' => null,
    ], $user)->assertStatus(422);
});

it('lists undated pending transactions without treating them as epoch', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 12,
        'date' => now()->addDays(2)->toDateString(),
    ], $user)->assertCreated();

    $undated = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 8,
    ], $user)->assertCreated();

    $response = callAs('GET', '/api/transactions?status=pending&sort_by=date&sort_direction=asc', [], $user);

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2)
        ->and($response->json('data.0.date'))->not->toBeNull()
        ->and($response->json('data.1.id'))->toBe($undated->json('data.id'))
        ->and($response->json('data.1.date'))->toBeNull();
});

it('includes undated pending transactions in upcoming date-bounded lists', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 8,
    ], $user)->assertCreated();

    $response = callAs('GET', '/api/transactions?status=pending&end_date='.now()->addDays(7)->toDateString(), [], $user);

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.date'))->toBeNull();
});

it('summarizes pending amounts in the base currency', function () {
    $user = pendingUser();
    $usd = pendingCurrency();
    $eur = Currency::create([
        'code' => 'EUR',
        'name' => 'Euro',
        'symbol' => '€',
        'decimals' => 2,
        'is_base' => false,
        'rate' => 2,
    ]);
    $cash = pendingAccount($usd);
    $euroAccount = pendingAccount($eur, 500);
    $category = pendingCategory();
    $incomeCategory = Category::create([
        'name' => 'Salary',
        'type' => 'income',
        'icon' => '💼',
        'color' => '#22c55e',
    ]);

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $cash->id,
        'category_id' => $category->id,
        'amount' => 10,
    ], $user)->assertCreated();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $euroAccount->id,
        'category_id' => $category->id,
        'amount' => 5,
    ], $user)->assertCreated();

    callAs('POST', '/api/transactions', [
        'type' => 'income',
        'account_id' => $cash->id,
        'category_id' => $incomeCategory->id,
        'amount' => 4,
        'date' => now()->addDay()->toDateString(),
    ], $user)->assertCreated();

    $response = callAs('GET', '/api/transactions-pending-summary', [], $user);

    $response->assertOk()
        ->assertJsonPath('income', 4)
        ->assertJsonPath('expense', 20)
        ->assertJsonPath('balance', -16)
        ->assertJsonPath('transactions_count', 3)
        ->assertJsonPath('currency', 'USD');
});

it('duplicates an undated pending transaction as pending without a date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 18,
    ], $user);

    $response = callAs('POST', '/api/transactions/'.$created->json('data.id').'/duplicate', [], $user);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.date', null)
        ->assertJsonPath('data.recurringTransactionId', null);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('rejects confirming a pending transaction with a future date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();
    $future = now()->addDays(3)->toDateString();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 30,
        'date' => $future,
    ], $user)->assertCreated();

    $id = $created->json('data.id');

    callAs('POST', "/api/transactions/{$id}/confirm", ['date' => $future], $user)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['date']);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0)
        ->and(Transaction::query()->find($id)->status->value)->toBe('pending');
});

it('rejects confirming a future-dated pending transaction without a new date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 22,
        'date' => now()->addDay()->toDateString(),
    ], $user)->assertCreated();

    $id = $created->json('data.id');

    callAs('POST', "/api/transactions/{$id}/confirm", [], $user)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['date']);

    expect((float) $account->fresh()->current_balance)->toBe(1000.0);
});

it('rejects updating a confirmed transaction to a future date', function () {
    $user = pendingUser();
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    $created = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 12,
        'date' => now()->toDateString(),
    ], $user)->assertCreated()->assertJsonPath('data.status', 'confirmed');

    $id = $created->json('data.id');

    callAs('PUT', "/api/transactions/{$id}", [
        'date' => now()->addDay()->toDateString(),
    ], $user)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['date']);

    expect(Transaction::query()->find($id)->date?->toDateString())->toBe(now()->toDateString());
});

it('rejects creating a confirmed transaction with a future date', function () {
    $account = pendingAccount(pendingCurrency());
    $category = pendingCategory();

    expect(fn () => app(App\Services\TransactionService::class)->create(
        App\DTOs\TransactionData::fromArray([
            'type' => 'expense',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'amount' => 14,
            'date' => now()->addDay()->toDateString(),
            'status' => 'confirmed',
        ])
    ))->toThrow(\DomainException::class, __('messages.transactions.date_cannot_be_future'));
});

it('no longer registers the recurring process command', function () {
    expect(collect(Illuminate\Support\Facades\Artisan::all())->has('recurring:process'))->toBeFalse();
});
