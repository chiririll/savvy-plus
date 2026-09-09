<?php

namespace App\Support;

class TransactionDates
{
    public static function today(): string
    {
        return now()->toDateString();
    }

    public static function normalize(mixed $date): ?string
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        if (! filled($date)) {
            return null;
        }

        $value = (string) $date;

        return preg_match('/^\d{4}-\d{2}-\d{2}/', $value, $matches)
            ? $matches[0]
            : $value;
    }

    public static function isFuture(mixed $date): bool
    {
        $date = self::normalize($date);

        return $date !== null && $date > self::today();
    }
}
