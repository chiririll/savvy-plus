<?php

namespace App\Services;

readonly class BackupInspection
{
    /**
     * @param  list<string>  $pendingMigrations
     * @param  list<string>  $unknownMigrations
     */
    public function __construct(
        public array $pendingMigrations,
        public array $unknownMigrations,
    ) {}

    public function compatible(): bool
    {
        return $this->unknownMigrations === [];
    }

    public function needsMigration(): bool
    {
        return $this->compatible() && $this->pendingMigrations !== [];
    }

    /**
     * @return array{
     *     valid: true,
     *     compatible: bool,
     *     pendingCount: int,
     *     pendingMigrations: list<string>,
     *     unknownCount: int,
     *     unknownMigrations: list<string>
     * }
     */
    public function toArray(): array
    {
        return [
            'valid' => true,
            'compatible' => $this->compatible(),
            'pendingCount' => count($this->pendingMigrations),
            'pendingMigrations' => $this->pendingMigrations,
            'unknownCount' => count($this->unknownMigrations),
            'unknownMigrations' => $this->unknownMigrations,
        ];
    }
}
