<?php

namespace App\Enums;

enum TriggerType: string
{
    case OnTransactionCreate = 'on_transaction_create';
    case OnTransactionUpdate = 'on_transaction_update';

    public function label(): string
    {
        return match ($this) {
            self::OnTransactionCreate => __('messages.enums.trigger.on_transaction_create'),
            self::OnTransactionUpdate => __('messages.enums.trigger.on_transaction_update'),
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::OnTransactionCreate => __('messages.enums.trigger_description.on_transaction_create'),
            self::OnTransactionUpdate => __('messages.enums.trigger_description.on_transaction_update'),
        };
    }
}
