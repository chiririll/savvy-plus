import { useQueryStates, parseAsInteger, parseAsString, parseAsArrayOf, parseAsStringLiteral } from 'nuqs'
import type { TransactionFilters } from '@/types'

export const transactionSearchParams = {
    type: parseAsStringLiteral(['income', 'expense', 'transfer'] as const),
    sortBy: parseAsStringLiteral(['date', 'amount'] as const).withDefault('date'),
    sortDir: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
    page: parseAsInteger.withDefault(1),
    categoryIds: parseAsArrayOf(parseAsInteger).withDefault([]),
    tagIds: parseAsArrayOf(parseAsInteger).withDefault([]),
    startDate: parseAsString,
    endDate: parseAsString,
    status: parseAsStringLiteral(['pending'] as const),
}

export function useTransactionListFilters() {
    const [params, setParams] = useQueryStates(transactionSearchParams)

    const filters: TransactionFilters = {
        per_page: 20,
        page: params.page,
        type: params.type ?? undefined,
        sort_by: params.sortBy,
        sort_direction: params.sortDir,
        category_ids: params.categoryIds.length > 0 ? params.categoryIds : undefined,
        tag_ids: params.tagIds.length > 0 ? params.tagIds : undefined,
        start_date: params.startDate ?? undefined,
        end_date: params.endDate ?? undefined,
        status: params.status ?? undefined,
    }

    const activeFiltersCount = [
        params.categoryIds.length > 0,
        params.tagIds.length > 0,
        params.startDate,
        params.endDate,
    ].filter(Boolean).length

    return {
        params,
        filters,
        activeFiltersCount,
        setPage: (page: number) => setParams({ page }),
        setType: (type: 'income' | 'expense' | 'transfer' | null) => setParams({ type, page: 1 }),
        setStatus: (status: 'pending' | null) => setParams({ status, page: 1 }),
        setSort: (sortBy: 'date' | 'amount', sortDir: 'asc' | 'desc') =>
            setParams({ sortBy, sortDir, page: 1 }),
        setDateRange: (field: 'startDate' | 'endDate', value: string) =>
            setParams({ [field]: value || null, page: 1 }),
        toggleCategory: (id: number) => {
            const next = params.categoryIds.includes(id)
                ? params.categoryIds.filter((categoryId) => categoryId !== id)
                : [...params.categoryIds, id]
            setParams({ categoryIds: next.length ? next : null, page: 1 })
        },
        toggleTag: (id: number) => {
            const next = params.tagIds.includes(id)
                ? params.tagIds.filter((tagId) => tagId !== id)
                : [...params.tagIds, id]
            setParams({ tagIds: next.length ? next : null, page: 1 })
        },
        clearFilters: () => setParams({
            categoryIds: null,
            tagIds: null,
            startDate: null,
            endDate: null,
            page: 1,
        }),
    }
}

export type TransactionListFilters = ReturnType<typeof useTransactionListFilters>
