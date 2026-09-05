<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'toAmount' => $this->when($this->to_amount !== null, (float) $this->to_amount),
            'exchangeRate' => $this->when($this->exchange_rate !== null, (float) $this->exchange_rate),
            'description' => $this->localizedDescription(),
            'date' => $this->date?->format('Y-m-d'),
            'status' => $this->status->value,
            'recurringTransactionId' => $this->recurring_transaction_id,
            'actions' => $this->kind()->actions(),
            'account' => new AccountResource($this->whenLoaded('account')),
            'toAccount' => new AccountResource($this->whenLoaded('toAccount')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'items' => TransactionItemResource::collection($this->whenLoaded('items')),
            'itemsCount' => $this->whenCounted('items'),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'createdAt' => $this->created_at,
        ];
    }

    private function localizedDescription(): ?string
    {
        $description = $this->description;

        if (! is_string($description) || $description === '') {
            return $description;
        }

        if (! preg_match('/^messages\.[a-z0-9_.]+$/i', $description)) {
            return $description;
        }

        $name = $this->toAccount?->name ?? $this->account?->name ?? '';
        $translated = __($description, ['name' => $name]);

        return $translated === $description ? null : $translated;
    }
}
