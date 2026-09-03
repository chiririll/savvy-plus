<?php

namespace App\DTOs;

use App\Enums\DebtType;

readonly class DebtData
{
    public function __construct(
        public string $name,
        public DebtType $debtType,
        public float $amount,
        public ?int $currencyId = null,
        public ?int $accountId = null,
        public ?string $date = null,
        public ?string $dueDate = null,
        public ?string $counterparty = null,
        public ?string $description = null,
        public string $origin = 'existing',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            debtType: $data['debt_type'] instanceof DebtType
                ? $data['debt_type']
                : DebtType::from($data['debt_type']),
            amount: (float) $data['amount'],
            currencyId: isset($data['currency_id']) ? (int) $data['currency_id'] : null,
            accountId: isset($data['account_id']) ? (int) $data['account_id'] : null,
            date: $data['date'] ?? null,
            dueDate: $data['due_date'] ?? null,
            counterparty: $data['counterparty'] ?? null,
            description: $data['description'] ?? null,
            origin: $data['origin'] ?? 'existing',
        );
    }

    public function isNewOperation(): bool
    {
        return $this->origin === 'new';
    }
}
