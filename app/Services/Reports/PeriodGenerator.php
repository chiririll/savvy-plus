<?php

namespace App\Services\Reports;

use Carbon\Carbon;

class PeriodGenerator
{
    public function generate(Carbon $startDate, Carbon $endDate, string $groupBy): array
    {
        $periods = [];
        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            switch ($groupBy) {
                case 'day':
                    $periods[] = [
                        'key' => $current->toDateString(),
                        'label' => $this->dateLabel($current, 'M j'),
                    ];
                    $current->addDay();
                    break;

                case 'week':
                    $weekStart = $current->copy()->startOfWeek(Carbon::SUNDAY);
                    $periods[] = [
                        'key' => $weekStart->toDateString(),
                        'label' => __('messages.reports.week', ['date' => $this->dateLabel($weekStart, 'M j')]),
                    ];
                    $current->addWeek();
                    break;

                case 'month':
                    $periods[] = [
                        'key' => $current->copy()->startOfMonth()->toDateString(),
                        'label' => $this->dateLabel($current, "M 'y"),
                    ];
                    $current->addMonth();
                    break;

                default:
                    $periods[] = [
                        'key' => $current->toDateString(),
                        'label' => $this->dateLabel($current, 'M j'),
                    ];
                    $current->addDay();
                    break;
            }
        }

        return $periods;
    }

    public function getSqlFormat(string $groupBy): string
    {
        return match ($groupBy) {
            'week' => "DATE(transactions.date, '-' || strftime('%w', transactions.date) || ' days')",
            'month' => "DATE(transactions.date, 'start of month')",
            default => 'DATE(transactions.date)',
        };
    }

    public function getNextPeriod(Carbon $current, string $groupBy): Carbon
    {
        return match ($groupBy) {
            'week' => $current->copy()->addWeek()->startOfWeek(),
            'month' => $current->copy()->addMonth()->startOfMonth(),
            default => $current->copy()->addDay(),
        };
    }

    public function getPeriodEnd(Carbon $current, Carbon $maxEnd, string $groupBy): Carbon
    {
        return match ($groupBy) {
            'week' => $current->copy()->endOfWeek()->min($maxEnd),
            'month' => $current->copy()->endOfMonth()->min($maxEnd),
            default => $current->copy(),
        };
    }

    public function getPeriodLabel(Carbon $current, string $groupBy): string
    {
        return match ($groupBy) {
            'week' => __('messages.reports.week_num', [
                'week' => $current->weekOfYear,
                'date' => $this->dateLabel($current, "M 'y"),
            ]),
            'month' => $this->dateLabel($current, "M 'y"),
            default => $this->dateLabel($current, 'M j'),
        };
    }

    private function dateLabel(Carbon $date, string $format): string
    {
        return $date->copy()->locale(app()->getLocale())->translatedFormat($format);
    }
}
