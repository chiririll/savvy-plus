<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BackupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'filename' => $this->filename,
            'size' => $this->size,
            'note' => $this->note,
            'schemaVersion' => $this->app_version,
            'schemaStatus' => $this->schema_status ?? $this->schemaStatus()->value,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
