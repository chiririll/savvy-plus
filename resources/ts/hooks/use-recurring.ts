import { useQuery } from '@tanstack/react-query'
import { recurringApi } from '@/api'
import { RecurringFormData } from '@/types'
import { useResourceItem, useResourceMutation } from './use-crud'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['recurring']

export function useRecurring() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => recurringApi.getAll(),
    })
}

export function useRecurringById(id: string | number) {
    return useResourceItem(QUERY_KEY, () => recurringApi.getById(id), id)
}

export function useUpcomingRecurring() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'upcoming'],
        queryFn: () => recurringApi.getUpcoming(),
    })
}

export function useCreateRecurring(redirectTo?: string) {
    return useResourceMutation({
        mutationFn: (data: RecurringFormData) => recurringApi.create(data),
        invalidateKeys: [QUERY_KEY],
        successMessage: i18n.t('toasts.recurring.created'),
        redirectTo,
    })
}

export function useUpdateRecurring(redirectTo?: string) {
    return useResourceMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<RecurringFormData> }) =>
            recurringApi.update(id, data),
        invalidateKeys: [QUERY_KEY],
        successMessage: i18n.t('toasts.recurring.updated'),
        redirectTo,
    })
}

export function useDeleteRecurring() {
    return useResourceMutation({
        mutationFn: (id: string | number) => recurringApi.delete(id),
        invalidateKeys: [QUERY_KEY],
        successMessage: i18n.t('toasts.recurring.deleted'),
    })
}
