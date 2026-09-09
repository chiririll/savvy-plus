<?php

use App\Enums\UserRole;
use App\Models\Account;
use App\Models\Category;
use App\Models\Currency;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function itemUser(): User
{
    return User::create([
        'name' => 'Items',
        'email' => 'items-'.uniqid().'@example.com',
        'password' => 'secret1',
        'role' => UserRole::ReadWrite,
    ]);
}

function itemCurrency(int $decimals = 2, string $code = 'USD'): Currency
{
    return Currency::create([
        'code' => $code,
        'name' => $code,
        'symbol' => $code === 'JPY' ? '¥' : '$',
        'decimals' => $decimals,
        'is_base' => $code === 'USD',
        'rate' => 1,
    ]);
}

function itemAccount(Currency $currency, float $balance = 1000): Account
{
    return Account::create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency_id' => $currency->id,
        'initial_balance' => $balance,
        'is_active' => true,
    ]);
}

function itemCategory(): Category
{
    return Category::create([
        'name' => 'Food',
        'type' => 'expense',
        'icon' => '🛒',
        'color' => '#ef4444',
    ]);
}

it('stores fractional quantity and rounds unit prices before totaling', function () {
    $user = itemUser();
    $account = itemAccount(itemCurrency());
    $category = itemCategory();

    $response = callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 15,
        'date' => now()->toDateString(),
        'items' => [
            ['name' => 'Apples', 'quantity' => 1.5, 'price_per_unit' => 10],
        ],
    ], $user);

    $response->assertCreated()
        ->assertJsonPath('data.amount', 15)
        ->assertJsonPath('data.items.0.quantity', 1.5)
        ->assertJsonPath('data.items.0.pricePerUnit', 10);

    $item = TransactionItem::first();
    expect((float) $item->quantity)->toBe(1.5)
        ->and((float) $item->price_per_unit)->toBe(10.0)
        ->and((float) $item->total_price)->toBe(15.0);
});

it('rejects a total that does not use rounded unit prices', function () {
    $user = itemUser();
    $account = itemAccount(itemCurrency());
    $category = itemCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10.006,
        'date' => now()->toDateString(),
        'items' => [
            ['name' => 'Tea', 'quantity' => 1, 'price_per_unit' => 10.006],
        ],
    ], $user)->assertUnprocessable();
});

it('accepts an amount that matches the rounded unit price', function () {
    $user = itemUser();
    $account = itemAccount(itemCurrency());
    $category = itemCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10.01,
        'date' => now()->toDateString(),
        'items' => [
            ['name' => 'Tea', 'quantity' => 1, 'price_per_unit' => 10.006],
        ],
    ], $user)
        ->assertCreated()
        ->assertJsonPath('data.amount', 10.01)
        ->assertJsonPath('data.items.0.pricePerUnit', 10.01);
});

it('rounds prices to zero decimals for currencies without minor units', function () {
    $user = itemUser();
    $account = itemAccount(itemCurrency(0, 'JPY'));
    $category = itemCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 22,
        'date' => now()->toDateString(),
        'items' => [
            ['name' => 'Onigiri', 'quantity' => 2, 'price_per_unit' => 10.6],
        ],
    ], $user)
        ->assertCreated()
        ->assertJsonPath('data.amount', 22)
        ->assertJsonPath('data.items.0.pricePerUnit', 11)
        ->assertJsonPath('data.items.0.totalPrice', 22);
});

it('rejects a non-positive quantity', function () {
    $user = itemUser();
    $account = itemAccount(itemCurrency());
    $category = itemCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => now()->toDateString(),
        'items' => [
            ['name' => 'Bad', 'quantity' => 0, 'price_per_unit' => 10],
        ],
    ], $user)->assertUnprocessable();
});

it('rejects quantity with more than three decimal places', function () {
    $user = itemUser();
    $account = itemAccount(itemCurrency());
    $category = itemCategory();

    callAs('POST', '/api/transactions', [
        'type' => 'expense',
        'account_id' => $account->id,
        'category_id' => $category->id,
        'amount' => 10,
        'date' => now()->toDateString(),
        'items' => [
            ['name' => 'Too precise', 'quantity' => 1.5555, 'price_per_unit' => 10],
        ],
    ], $user)->assertUnprocessable();
});
