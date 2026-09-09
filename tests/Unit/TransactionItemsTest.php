<?php

use App\Support\TransactionItems;

it('rounds each unit price before summing line contributions', function () {
    $items = [
        ['quantity' => 1, 'price_per_unit' => 10.004],
        ['quantity' => 2, 'price_per_unit' => 10.006],
    ];

    expect(TransactionItems::total($items, 2))->toBe(30.02);
});

it('uses zero decimal places for currencies without minor units', function () {
    $items = [
        ['quantity' => 2, 'price_per_unit' => 10.6],
    ];

    expect(TransactionItems::roundedPrice(10.6, 0))->toBe(11.0)
        ->and(TransactionItems::total($items, 0))->toBe(22.0);
});

it('keeps fractional quantity when multiplying the rounded price', function () {
    $items = [
        ['quantity' => 1.5, 'price_per_unit' => 10],
    ];

    expect(TransactionItems::total($items, 2))->toBe(15.0);
});
