<?php

namespace App\Enums;

enum RecurringFrequency: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case Yearly = 'yearly';

    public function label(): string
    {
        return match ($this) {
            self::Daily => __('messages.enums.frequency.daily'),
            self::Weekly => __('messages.enums.frequency.weekly'),
            self::Monthly => __('messages.enums.frequency.monthly'),
            self::Yearly => __('messages.enums.frequency.yearly'),
        };
    }
}
