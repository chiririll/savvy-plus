import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { debtsApi } from '@/api'
import { DebtFormData, DebtPaymentFormData } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'
import { getApiErrorMessage } from '@/lib/api-error'

const QUERY_KEY = ['debts']

export function useDebts(params?: { include_completed?: boolean }) {
    return useQuery({
        queryKey: params ? [...QUERY_KEY, params] : QUERY_KEY,
        queryFn: () => debtsApi.getAll(params),
    })
}

export function useDebtsWithSummary(params?: { include_completed?: boolean }) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'with-summary', params],
        queryFn: () => debtsApi.getAllWithSummary(params),
    })
}

export function useDebtSummary() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'summary'],
        queryFn: () => debtsApi.getSummary(),
    })
}

export function useDebt(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => debtsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateDebt(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: DebtFormData) => debtsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            toast.success(i18n.t('toasts.debt.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.debt.createFailed')))
        },
    })
}

export function useUpdateDebt(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<DebtFormData> }) =>
            debtsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success(i18n.t('toasts.debt.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.debt.updateFailed')))
        },
    })
}

export function useDeleteDebt() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => debtsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success(i18n.t('toasts.debt.deleted'))
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.debt.deleteFailed')))
        },
    })
}

export function useDebtPayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ debtId, data }: { debtId: string | number; data: DebtPaymentFormData }) =>
            debtsApi.makePayment(debtId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            toast.success(i18n.t('toasts.debt.payment'))
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.debt.paymentFailed')))
        },
    })
}

export function useDebtCollection() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ debtId, data }: { debtId: string | number; data: DebtPaymentFormData }) =>
            debtsApi.collectPayment(debtId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            toast.success(i18n.t('toasts.debt.collection'))
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.debt.collectionFailed')))
        },
    })
}

export function useReopenDebt() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => debtsApi.reopen(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.debt.reopened'))
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.debt.reopenFailed')))
        },
    })
}
