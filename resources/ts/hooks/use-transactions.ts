import { useQuery } from '@tanstack/react-query'
import { transactionsApi } from '@/api'
import { Transaction, TransactionFilters } from '@/types'
import { TransactionFormData } from '@/schemas'
import { useResourceItem, useResourceMutation } from './use-crud'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['transactions']
const TRANSACTION_INVALIDATE = [
    QUERY_KEY,
    ['accounts'],
    ['budgets'],
    ['categories'],
    ['reports'],
] as const
const TRANSACTION_CONFIRM_INVALIDATE = [
    ...TRANSACTION_INVALIDATE,
    ['recurring'],
] as const

export function useTransactions(filters?: TransactionFilters & { with_summary?: boolean }) {
    return useQuery({
        queryKey: filters ? [...QUERY_KEY, filters] : QUERY_KEY,
        queryFn: () => transactionsApi.getAll(filters),
    })
}

export function useTransaction(id: string | number) {
    return useResourceItem(QUERY_KEY, () => transactionsApi.getById(id), id)
}

export function useCreateTransaction(redirectTo?: string) {
    return useResourceMutation({
        mutationFn: (data: TransactionFormData) => transactionsApi.create(data),
        invalidateKeys: [...TRANSACTION_INVALIDATE],
        successMessage: (transaction: Transaction) =>
            transaction.status === 'pending'
                ? i18n.t('toasts.transaction.pendingCreated')
                : i18n.t('toasts.transaction.created'),
        redirectTo,
    })
}

export function useUpdateTransaction(redirectTo?: string) {
    return useResourceMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<TransactionFormData> }) =>
            transactionsApi.update(id, data),
        invalidateKeys: [...TRANSACTION_INVALIDATE],
        successMessage: i18n.t('toasts.transaction.updated'),
        redirectTo,
    })
}

export function useDeleteTransaction() {
    return useResourceMutation({
        mutationFn: (id: string | number) => transactionsApi.delete(id),
        invalidateKeys: [...TRANSACTION_INVALIDATE],
        successMessage: i18n.t('toasts.transaction.deleted'),
    })
}

export function useDuplicateTransaction() {
    return useResourceMutation({
        mutationFn: (id: string | number) => transactionsApi.duplicate(id),
        invalidateKeys: [...TRANSACTION_INVALIDATE],
        successMessage: i18n.t('toasts.transaction.duplicated'),
    })
}

export function useConfirmTransaction() {
    return useResourceMutation({
        mutationFn: (id: string | number) => transactionsApi.confirm(id),
        invalidateKeys: [...TRANSACTION_CONFIRM_INVALIDATE],
        successMessage: i18n.t('toasts.transaction.confirmed'),
    })
}

export function useSkipTransaction() {
    return useResourceMutation({
        mutationFn: (id: string | number) => transactionsApi.skip(id),
        invalidateKeys: [...TRANSACTION_CONFIRM_INVALIDATE],
        successMessage: i18n.t('toasts.transaction.skipped'),
    })
}

export function useTransactionSummary(filters?: TransactionFilters) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'summary', filters],
        queryFn: () => transactionsApi.getSummary(filters),
    })
}
