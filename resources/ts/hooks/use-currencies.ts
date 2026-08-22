import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { currenciesApi } from '@/api'
import { useCurrenciesStore } from '@/stores/currencies'
import { Currency, CurrencyFormData } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['currencies']

export function useCurrencies() {
    const query = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const data = await currenciesApi.getAll()
            useCurrenciesStore.getState().setAll(data)
            return data
        },
    })

    const synced = useRef<Currency[] | undefined>(undefined)

    if (query.data && query.data !== synced.current) {
        synced.current = query.data
        useCurrenciesStore.getState().setAll(query.data)
    }

    return query
}

export function useCurrencyCatalog(enabled = true) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'catalog'],
        queryFn: currenciesApi.getCatalog,
        enabled,
        staleTime: 60 * 60 * 1000,
    })
}

export function useCurrency(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => currenciesApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateCurrency(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: CurrencyFormData) => currenciesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.currency.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.currency.createFailed'))
        },
    })
}

export function useUpdateCurrency(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<CurrencyFormData> }) =>
            currenciesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.currency.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.currency.updateFailed'))
        },
    })
}

export function useDeleteCurrency() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => currenciesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.currency.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.currency.deleteFailed'))
        },
    })
}

export function useSetBaseCurrency() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => currenciesApi.setBase(id),
        onSuccess: () => {
            queryClient.invalidateQueries()
            toast.success(i18n.t('toasts.currency.baseUpdated'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.currency.baseFailed'))
        },
    })
}
