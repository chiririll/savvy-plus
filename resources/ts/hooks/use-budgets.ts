import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { budgetsApi } from '@/api'
import { BudgetFormData } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['budgets']

export function useBudgets() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => budgetsApi.getAll(),
    })
}

export function useBudget(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => budgetsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateBudget(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: BudgetFormData) => budgetsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.budget.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.budget.createFailed'))
        },
    })
}

export function useUpdateBudget(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<BudgetFormData> }) =>
            budgetsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.budget.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.budget.updateFailed'))
        },
    })
}

export function useDeleteBudget() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => budgetsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.budget.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.budget.deleteFailed'))
        },
    })
}
