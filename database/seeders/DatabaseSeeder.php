<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $seeders = [
            CurrencySeeder::class,
            CategorySeeder::class,
            TagSeeder::class,
        ];

        if (filter_var(env('SEED_DEMO', false), FILTER_VALIDATE_BOOLEAN)) {
            $seeders[] = DemoSeeder::class;
        }

        $this->call($seeders);
    }
}
