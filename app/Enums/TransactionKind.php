<?php

namespace App\Enums;

use App\Models\Transaction;

enum TransactionKind
{
    case OneOffPending;
    case RecurringPending;
    case Confirmed;
    case OneOffSkipped;
    case RecurringSkipped;

    public static function fromTransaction(Transaction $transaction): self
    {
        $recurring = $transaction->recurring_transaction_id !== null;

        return match ($transaction->status) {
            TransactionStatus::Pending => $recurring ? self::RecurringPending : self::OneOffPending,
            TransactionStatus::Skipped => $recurring ? self::RecurringSkipped : self::OneOffSkipped,
            TransactionStatus::Confirmed => self::Confirmed,
        };
    }

    public function canEdit(): bool
    {
        return match ($this) {
            self::OneOffPending, self::Confirmed => true,
            default => false,
        };
    }

    public function canDuplicate(): bool
    {
        return match ($this) {
            self::OneOffPending, self::Confirmed => true,
            default => false,
        };
    }

    public function canDelete(): bool
    {
        return match ($this) {
            self::RecurringPending, self::RecurringSkipped => false,
            default => true,
        };
    }

    public function canConfirm(): bool
    {
        return match ($this) {
            self::OneOffPending, self::RecurringPending => true,
            default => false,
        };
    }

    public function canSkip(): bool
    {
        return $this === self::RecurringPending;
    }

    public function keepsPendingOnDuplicate(): bool
    {
        return $this === self::OneOffPending;
    }

    public function cannotEditMessage(): string
    {
        return match ($this) {
            self::RecurringPending => __('messages.transactions.cannot_edit_recurring'),
            default => __('messages.transactions.cannot_edit_skipped'),
        };
    }

    public function cannotDuplicateMessage(): string
    {
        return match ($this) {
            self::RecurringPending => __('messages.transactions.cannot_duplicate_recurring'),
            default => __('messages.transactions.cannot_duplicate'),
        };
    }

    public function cannotDeleteMessage(): string
    {
        return __('messages.transactions.cannot_delete_recurring');
    }

    public function cannotConfirmMessage(): string
    {
        return __('messages.transactions.not_pending');
    }

    public function cannotSkipMessage(): string
    {
        return __('messages.transactions.cannot_skip');
    }

    /**
     * @return array{edit: bool, duplicate: bool, delete: bool, confirm: bool, skip: bool}
     */
    public function actions(): array
    {
        return [
            'edit' => $this->canEdit(),
            'duplicate' => $this->canDuplicate(),
            'delete' => $this->canDelete(),
            'confirm' => $this->canConfirm(),
            'skip' => $this->canSkip(),
        ];
    }
}
