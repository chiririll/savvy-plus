<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Skipped = 'skipped';

    public function affectsBalance(): bool
    {
        return $this === self::Confirmed;
    }
}
