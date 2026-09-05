<?php

namespace Database\Seeders;

use App\Models\AutomationRule;
use App\Models\Category;
use App\Models\RecurringTransaction;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * @var list<array{name: string, type: string, icon: string, color: string}>
     */
    private const CATEGORIES = [
        ['name' => '#RENT', 'type' => 'expense', 'icon' => '🏢', 'color' => '#94a3b8'],
        ['name' => '#HOUSING', 'type' => 'expense', 'icon' => '🏠', 'color' => '#a78bfa'],
        ['name' => '#UTILITIES', 'type' => 'expense', 'icon' => '⚡', 'color' => '#fbbf24'],
        ['name' => '#GROCERIES', 'type' => 'expense', 'icon' => '🛒', 'color' => '#4ade80'],
        ['name' => '#TRANSPORT', 'type' => 'expense', 'icon' => '🚗', 'color' => '#60a5fa'],
        ['name' => '#HEALTH', 'type' => 'expense', 'icon' => '🏥', 'color' => '#f87171'],
        ['name' => '#DINING', 'type' => 'expense', 'icon' => '🍽️', 'color' => '#fb923c'],
        ['name' => '#ENTERTAINMENT', 'type' => 'expense', 'icon' => '🎮', 'color' => '#f472b6'],
        ['name' => '#SHOPPING', 'type' => 'expense', 'icon' => '🛍️', 'color' => '#2dd4bf'],
        ['name' => '#PERSONAL_CARE', 'type' => 'expense', 'icon' => '✨', 'color' => '#e879f9'],
        ['name' => '#GIFTS', 'type' => 'expense', 'icon' => '🎁', 'color' => '#fb7185'],
        ['name' => '#TRAVEL', 'type' => 'expense', 'icon' => '✈️', 'color' => '#38bdf8'],
        ['name' => '#OTHER', 'type' => 'expense', 'icon' => '📌', 'color' => '#94a3b8'],

        ['name' => '#SALARY', 'type' => 'income', 'icon' => '💵', 'color' => '#4ade80'],
        ['name' => '#FREELANCE', 'type' => 'income', 'icon' => '💻', 'color' => '#60a5fa'],
        ['name' => '#INVESTMENTS', 'type' => 'income', 'icon' => '📈', 'color' => '#a78bfa'],
        ['name' => '#GIFTS_RECEIVED', 'type' => 'income', 'icon' => '🎀', 'color' => '#f472b6'],
        ['name' => '#REFUNDS', 'type' => 'income', 'icon' => '↩️', 'color' => '#2dd4bf'],
        ['name' => '#OTHER_INCOME', 'type' => 'income', 'icon' => '💰', 'color' => '#94a3b8'],
    ];

    /**
     * Legacy English names → new keys. Several old names can map to one key.
     *
     * @var array<string, array<string, string>>
     */
    private const LEGACY = [
        'expense' => [
            'Food & Groceries' => '#GROCERIES',
            'Food' => '#GROCERIES',
            'Transport' => '#TRANSPORT',
            'Housing' => '#HOUSING',
            'Utilities' => '#UTILITIES',
            'Healthcare' => '#HEALTH',
            'Entertainment' => '#ENTERTAINMENT',
            'Subscriptions' => '#ENTERTAINMENT',
            'Shopping' => '#SHOPPING',
            'Education' => '#OTHER',
            'Restaurants & Cafes' => '#DINING',
            'Personal Care' => '#PERSONAL_CARE',
            'Gifts' => '#GIFTS',
            'Travel' => '#TRAVEL',
            'Other Expenses' => '#OTHER',
        ],
        'income' => [
            'Salary' => '#SALARY',
            'Freelance' => '#FREELANCE',
            'Investments' => '#INVESTMENTS',
            'Gifts Received' => '#GIFTS_RECEIVED',
            'Refunds' => '#REFUNDS',
            'Other Income' => '#OTHER_INCOME',
        ],
    ];

    public function run(): void
    {
        $this->remapLegacy();

        $defaults = collect(self::CATEGORIES)->keyBy('name');

        foreach (self::CATEGORIES as $category) {
            Category::updateOrCreate(
                ['name' => $category['name'], 'type' => $category['type']],
                $category
            );
        }

        foreach ($defaults as $name => $category) {
            Category::query()
                ->where('name', $name)
                ->where('type', $category['type'])
                ->update([
                    'icon' => $category['icon'],
                    'color' => $category['color'],
                ]);
        }
    }

    private function remapLegacy(): void
    {
        foreach (self::LEGACY as $type => $map) {
            $byTarget = [];
            foreach ($map as $from => $to) {
                $byTarget[$to][] = $from;
            }

            foreach ($byTarget as $key => $legacyNames) {
                $target = Category::query()->where('name', $key)->where('type', $type)->first();
                $sources = Category::query()->where('type', $type)->whereIn('name', $legacyNames)->get();

                if (! $target && $sources->isEmpty()) {
                    continue;
                }

                if (! $target) {
                    $first = $sources->shift();
                    $first?->update(['name' => $key]);
                    $target = $first;
                }

                if (! $target) {
                    continue;
                }

                foreach ($sources as $source) {
                    if ($source->id === $target->id) {
                        continue;
                    }

                    $this->mergeCategory($source, $target);
                }
            }
        }
    }

    private function mergeCategory(Category $from, Category $to): void
    {
        Transaction::query()->where('category_id', $from->id)->update(['category_id' => $to->id]);
        RecurringTransaction::query()->where('category_id', $from->id)->update(['category_id' => $to->id]);

        $fromBudgetIds = DB::table('budget_category')->where('category_id', $from->id)->pluck('budget_id');
        $toBudgetIds = DB::table('budget_category')->where('category_id', $to->id)->pluck('budget_id');
        $overlap = $fromBudgetIds->intersect($toBudgetIds);

        if ($overlap->isNotEmpty()) {
            DB::table('budget_category')
                ->where('category_id', $from->id)
                ->whereIn('budget_id', $overlap)
                ->delete();
        }

        DB::table('budget_category')->where('category_id', $from->id)->update(['category_id' => $to->id]);

        $this->remapAutomationCategory($from->id, $to->id);

        $from->delete();
    }

    private function remapAutomationCategory(int $fromId, int $toId): void
    {
        foreach (AutomationRule::query()->get() as $rule) {
            $actions = $this->replaceCategoryId($rule->actions ?? [], $fromId, $toId);
            $conditions = $this->replaceCategoryId($rule->conditions ?? [], $fromId, $toId);

            if ($actions !== $rule->actions || $conditions !== $rule->conditions) {
                $rule->update([
                    'actions' => $actions,
                    'conditions' => $conditions,
                ]);
            }
        }
    }

    private function replaceCategoryId(mixed $node, int $fromId, int $toId): mixed
    {
        if (! is_array($node)) {
            return $node;
        }

        if (array_key_exists('category_id', $node) && (int) $node['category_id'] === $fromId) {
            $node['category_id'] = $toId;
        }

        if (($node['field'] ?? null) === 'category_id' && (int) ($node['value'] ?? 0) === $fromId) {
            $node['value'] = $toId;
        }

        foreach ($node as $key => $value) {
            if (is_array($value)) {
                $node[$key] = $this->replaceCategoryId($value, $fromId, $toId);
            }
        }

        return $node;
    }
}
