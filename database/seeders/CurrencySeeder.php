<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Services\CurrencyApiService;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        // Fallback rates: "1 currency = X USD" (for multiplication to get base amount)
        $currencies = [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'decimals' => 2, 'is_base' => true, 'rate' => 1.000000],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'decimals' => 2, 'is_base' => false, 'rate' => 1.08],
        ];

        // Сначала сбрасываем базовую валюту для всех
        Currency::query()->update(['is_base' => false]);

        foreach ($currencies as $currency) {
            Currency::updateOrCreate(
                ['code' => $currency['code']],
                $currency
            );
        }

        $this->command->info('Created ' . count($currencies) . ' currencies.');

        // Автоматическое обновление курсов через API
        try {
            $apiService = app(CurrencyApiService::class);
            $result = $apiService->updateRates();

            $this->command->info("Currency rates: {$result['message']}");
        } catch (\Exception $e) {
            $this->command->warn("Could not update rates from API: {$e->getMessage()}");
            $this->command->info('Using fallback rates.');
        }
    }
}
