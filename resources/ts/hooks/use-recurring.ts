import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { recurringApi } from '@/api'
import { RecurringFormData } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['recurring']

export function useRecurring() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => recurringApi.getAll(),
    })
}

export function useRecurringById(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => recurringApi.getById(id),
        enabled: !!id,
    })
}

export function useUpcomingRecurring() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'upcoming'],
        queryFn: () => recurringApi.getUpcoming(),
    })
}

export function useCreateRecurring(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: RecurringFormData) => recurringApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.recurring.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.recurring.createFailed'))
        },
    })
}

export function useUpdateRecurring(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<RecurringFormData> }) =>
            recurringApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.recurring.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.recurring.updateFailed'))
        },
    })
}

export function useDeleteRecurring() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => recurringApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.recurring.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.recurring.deleteFailed'))
        },
    })
}
