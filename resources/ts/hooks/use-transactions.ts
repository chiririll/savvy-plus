import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transactionsApi } from '@/api'
import { TransactionFormData, TransactionFilters } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['transactions']

export function useTransactions(filters?: TransactionFilters & { with_summary?: boolean }) {
    return useQuery({
        queryKey: filters ? [...QUERY_KEY, filters] : QUERY_KEY,
        queryFn: () => transactionsApi.getAll(filters),
    })
}

export function useTransaction(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => transactionsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateTransaction(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: TransactionFormData) => transactionsApi.create(data),
        onSuccess: (transaction) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            toast.success(
                transaction.status === 'pending'
                    ? i18n.t('toasts.transaction.pendingCreated')
                    : i18n.t('toasts.transaction.created')
            )
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.transaction.createFailed'))
        },
    })
}

export function useUpdateTransaction(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<TransactionFormData> }) =>
            transactionsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            toast.success(i18n.t('toasts.transaction.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.transaction.updateFailed'))
        },
    })
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => transactionsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            toast.success(i18n.t('toasts.transaction.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.transaction.deleteFailed'))
        },
    })
}

export function useDuplicateTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => transactionsApi.duplicate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            toast.success(i18n.t('toasts.transaction.duplicated'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.transaction.duplicateFailed'))
        },
    })
}

function invalidateTransactionQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['reports'] })
    queryClient.invalidateQueries({ queryKey: ['recurring'] })
}

export function useConfirmTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => transactionsApi.confirm(id),
        onSuccess: () => {
            invalidateTransactionQueries(queryClient)
            toast.success(i18n.t('toasts.transaction.confirmed'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.transaction.confirmFailed'))
        },
    })
}

export function useSkipTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => transactionsApi.skip(id),
        onSuccess: () => {
            invalidateTransactionQueries(queryClient)
            toast.success(i18n.t('toasts.transaction.skipped'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.transaction.skipFailed'))
        },
    })
}

export function useTransactionSummary(filters?: TransactionFilters) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'summary', filters],
        queryFn: () => transactionsApi.getSummary(filters),
    })
}
