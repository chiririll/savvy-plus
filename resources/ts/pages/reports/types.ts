import type { CashFlowGroupBy } from '@/api/reports'
import { formatDateLocal, formatYearMonth } from '@/lib/dates'

export type PeriodType = 'last_30_days' | 'month' | 'quarter' | 'year' | 'ytd' | 'custom'
export type CompareType = 'none' | 'previous_period' | 'same_period_last_year'
export type ReportTab = 'overview' | 'cashflow' | 'expenses' | 'income' | 'networth'

export interface ReportFilters {
    periodType: PeriodType
    selectedMonth: string
    selectedQuarter: string
    selectedYear: string
    customStartDate: string
    customEndDate: string
    compareWith: CompareType
    accountIds: number[]
    categoryIds: number[]
    tagIds: number[]
}

const now = new Date()

export const DEFAULT_FILTERS: ReportFilters = {
    periodType: 'last_30_days',
    selectedMonth: formatYearMonth(now),
    selectedQuarter: `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`,
    selectedYear: now.getFullYear().toString(),
    customStartDate: formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)),
    customEndDate: formatDateLocal(now),
    compareWith: 'previous_period',
    accountIds: [],
    categoryIds: [],
    tagIds: [],
}

export function defaultGroupBy(filters: ReportFilters): CashFlowGroupBy {
    switch (filters.periodType) {
        case 'last_30_days':
        case 'month':
            return 'day'
        case 'quarter':
            return 'week'
        case 'year':
            return 'month'
        case 'ytd':
            return 'week'
        case 'custom': {
            const start = new Date(filters.customStartDate)
            const end = new Date(filters.customEndDate)
            const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
            if (days <= 45) return 'day'
            if (days <= 185) return 'week'
            return 'month'
        }
        default:
            return 'day'
    }
}

export const TABS: ReportTab[] = ['overview', 'cashflow', 'expenses', 'income', 'networth']
