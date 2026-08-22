<?php

namespace App\Enums;

enum BudgetPeriod: string
{
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case Yearly = 'yearly';
    case OneTime = 'one_time';

    public function label(): string
    {
        return match ($this) {
            self::Weekly => __('messages.enums.budget_period.weekly'),
            self::Monthly => __('messages.enums.budget_period.monthly'),
            self::Yearly => __('messages.enums.budget_period.yearly'),
            self::OneTime => __('messages.enums.budget_period.one_time'),
        };
    }
}
