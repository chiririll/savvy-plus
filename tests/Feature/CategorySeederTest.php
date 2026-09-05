<?php

use App\Models\Budget;
use App\Models\Category;
use App\Models\Currency;
use App\Models\Transaction;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds localized default category keys', function () {
    $this->seed(CategorySeeder::class);

    expect(Category::where('name', '#GROCERIES')->where('type', 'expense')->exists())->toBeTrue();
    expect(Category::where('name', '#RENT')->where('type', 'expense')->exists())->toBeTrue();
    expect(Category::where('name', '#SALARY')->where('type', 'income')->exists())->toBeTrue();
    expect(Category::where('name', 'Food & Groceries')->exists())->toBeFalse();
});

it('remaps and merges legacy english categories', function () {
    $usd = Currency::create([
        'code' => 'USD',
        'name' => 'US Dollar',
        'symbol' => '$',
        'decimals' => 2,
        'is_base' => true,
        'rate' => 1,
    ]);

    $entertainment = Category::create([
        'name' => 'Entertainment',
        'type' => 'expense',
        'icon' => '🎮',
        'color' => '#f472b6',
    ]);
    $subscriptions = Category::create([
        'name' => 'Subscriptions',
        'type' => 'expense',
        'icon' => '🔄',
        'color' => '#c084fc',
    ]);
    $groceries = Category::create([
        'name' => 'Food & Groceries',
        'type' => 'expense',
        'icon' => '🛒',
        'color' => '#4ade80',
    ]);

    $accountId = \App\Models\Account::create([
        'name' => 'Cash',
        'type' => 'cash',
        'currency_id' => $usd->id,
        'initial_balance' => 0,
        'is_active' => true,
    ])->id;

    Transaction::create([
        'type' => 'expense',
        'account_id' => $accountId,
        'category_id' => $subscriptions->id,
        'amount' => 10,
        'date' => now()->toDateString(),
        'description' => 'Netflix',
    ]);

    $budget = Budget::create([
        'name' => 'Fun',
        'amount' => 100,
        'currency_id' => $usd->id,
        'period' => 'monthly',
        'is_global' => false,
        'is_active' => true,
    ]);
    $budget->categories()->attach([$entertainment->id, $subscriptions->id]);

    $this->seed(CategorySeeder::class);

    $merged = Category::where('name', '#ENTERTAINMENT')->first();
    $food = Category::where('name', '#GROCERIES')->first();

    expect($merged)->not->toBeNull();
    expect($food)->not->toBeNull();
    expect(Category::where('name', 'Subscriptions')->exists())->toBeFalse();
    expect(Category::where('name', 'Entertainment')->exists())->toBeFalse();
    expect(Category::where('name', 'Food & Groceries')->exists())->toBeFalse();
    expect(Transaction::where('description', 'Netflix')->value('category_id'))->toBe($merged->id);
    expect($budget->fresh()->categories()->pluck('categories.id'))->toContain($merged->id);
});
