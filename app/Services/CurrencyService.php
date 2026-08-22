<?php

namespace App\Services;

use App\Models\Currency;
use DomainException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CurrencyService
{
    public function getAll(): Collection
    {
        return Currency::orderBy('code')->get();
    }

    public function findOrFail(int $id): Currency
    {
        return Currency::findOrFail($id);
    }

    public function getBase(): ?Currency
    {
        return Currency::getBase();
    }

    public function create(array $data): Currency
    {
        return DB::transaction(function () use ($data) {
            if (! empty($data['is_base'])) {
                $this->clearBaseCurrency();
                $data['rate'] = 1;
            }

            return Currency::create($data);
        });
    }

    public function update(Currency $currency, array $data): Currency
    {
        return DB::transaction(function () use ($currency, $data) {
            if (! empty($data['is_base']) && ! $currency->is_base) {
                $this->clearBaseCurrency();
                $data['rate'] = 1;
            }

            if ($currency->is_base && isset($data['is_base']) && ! $data['is_base']) {
                throw new DomainException(__('messages.currencies.cannot_unset_base'));
            }

            if ($currency->is_base && isset($data['rate']) && $data['rate'] != 1) {
                throw new DomainException(__('messages.currencies.base_rate_must_be_one'));
            }

            $currency->update($data);

            return $currency;
        });
    }

    public function delete(Currency $currency): void
    {
        if ($currency->accounts()->exists()) {
            throw new DomainException(__('messages.currencies.delete_in_use'));
        }

        if ($currency->is_base) {
            throw new DomainException(__('messages.currencies.delete_base'));
        }

        if (Currency::count() <= 1) {
            throw new DomainException(__('messages.currencies.delete_last'));
        }

        $currency->delete();
    }

    public function setAsBase(Currency $currency): Currency
    {
        return DB::transaction(function () use ($currency) {
            if ($currency->is_base) {
                return $currency;
            }

            $newBaseRate = $currency->rate;

            // Recalculate all currency rates relative to new base
            Currency::where('id', '!=', $currency->id)->each(function ($c) use ($newBaseRate) {
                $c->update(['rate' => $c->rate / $newBaseRate]);
            });

            $this->clearBaseCurrency();

            $currency->update([
                'is_base' => true,
                'rate' => 1,
            ]);

            return $currency;
        });
    }

    public function convert(float $amount, Currency $from, Currency $to): float
    {
        return $from->convertTo($amount, $to);
    }

    private function clearBaseCurrency(): void
    {
        Currency::where('is_base', true)->update(['is_base' => false]);
    }
}
