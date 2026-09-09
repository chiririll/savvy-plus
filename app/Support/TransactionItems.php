<?php

namespace App\Support;

class TransactionItems
{
    public static function roundedPrice(float $price, int $decimals): float
    {
        return round($price, max(0, $decimals));
    }

    public static function contribution(float $quantity, float $price, int $decimals): float
    {
        return self::roundedPrice($price, $decimals) * $quantity;
    }

    public static function total(array $items, int $decimals): float
    {
        $sum = 0.0;

        foreach ($items as $item) {
            $sum += self::contribution(
                (float) ($item['quantity'] ?? 0),
                (float) ($item['price_per_unit'] ?? 0),
                $decimals,
            );
        }

        return round($sum, max(0, $decimals));
    }
}
