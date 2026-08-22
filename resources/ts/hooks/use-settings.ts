import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api'
import { Settings } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['settings']

export function useSettings() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: settingsApi.get,
    })
}

export function useUpdateSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.settings.updated'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.settings.updateFailed'))
        },
    })
}
