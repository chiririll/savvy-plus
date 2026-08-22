<?php

namespace App\Enums;

enum DebtType: string
{
    case IOwe = 'i_owe';
    case OwedToMe = 'owed_to_me';

    public function label(): string
    {
        return match ($this) {
            self::IOwe => __('messages.enums.debt.i_owe'),
            self::OwedToMe => __('messages.enums.debt.owed_to_me'),
        };
    }

    /**
     * How this debt type affects total capital
     *
     * @return int 1 = positive (increases capital), -1 = negative (decreases capital)
     */
    public function capitalImpact(): int
    {
        return match ($this) {
            self::IOwe => -1,
            self::OwedToMe => 1,
        };
    }
}
