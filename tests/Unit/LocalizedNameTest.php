<?php

use App\Support\LocalizedName;

uses(Tests\TestCase::class);

it('leaves custom names unchanged', function () {
    expect(LocalizedName::display('Coffee shop'))->toBe('Coffee shop');
    expect(LocalizedName::key('Coffee shop'))->toBeNull();
});

it('resolves a default category key', function () {
    app()->setLocale('en');

    expect(LocalizedName::key('#GROCERIES'))->toBe('GROCERIES');
    expect(LocalizedName::display('#GROCERIES'))->toBe('Groceries');

    app()->setLocale('ru');

    expect(LocalizedName::display('#GROCERIES'))->toBe('Продукты');
});

it('returns the key when the translation is missing', function () {
    expect(LocalizedName::display('#NOT_A_REAL_CATEGORY'))->toBe('#NOT_A_REAL_CATEGORY');
});
