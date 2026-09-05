<?php

namespace App\DTOs;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;

readonly class TransactionData
{
    public function __construct(
        public TransactionType $type,
        public int $accountId,
        public float $amount,
        public ?string $date,
        public ?int $toAccountId = null,
        public ?int $categoryId = null,
        public ?float $toAmount = null,
        public ?float $exchangeRate = null,
        public ?string $description = null,
        public ?array $items = null,
        public ?array $tagIds = null,
        public ?TransactionStatus $status = null,
        public ?int $recurringTransactionId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            type: TransactionType::from($data['type']),
            accountId: $data['account_id'],
            amount: $data['amount'],
            date: self::normalizeDate($data['date'] ?? null),
            toAccountId: $data['to_account_id'] ?? null,
            categoryId: $data['category_id'] ?? null,
            toAmount: $data['to_amount'] ?? null,
            exchangeRate: $data['exchange_rate'] ?? null,
            description: $data['description'] ?? null,
            items: $data['items'] ?? null,
            tagIds: $data['tag_ids'] ?? null,
            status: isset($data['status'])
                ? ($data['status'] instanceof TransactionStatus ? $data['status'] : TransactionStatus::from($data['status']))
                : null,
            recurringTransactionId: $data['recurring_transaction_id'] ?? null,
        );
    }

    public function hasItems(): bool
    {
        return ! empty($this->items);
    }

    private static function normalizeDate(mixed $date): ?string
    {
        if ($date === null || $date === '') {
            return null;
        }

        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        return (string) $date;
    }
}
