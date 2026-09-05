<?php

namespace App\Http\Requests\Transaction;

trait NormalizesNullableDate
{
    protected function normalizeNullableDate(): void
    {
        if (array_key_exists('date', $this->all()) && $this->input('date') === '') {
            $this->merge(['date' => null]);
        }
    }
}
