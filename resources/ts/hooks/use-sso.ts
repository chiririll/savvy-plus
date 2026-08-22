import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'
import { ssoApi } from '@/api/sso'
import type { IdentityProviderFormData } from '@/types/sso'

const QUERY_KEY = ['identity-providers']
const PRESETS_KEY = ['sso-presets']
const PUBLIC_KEY = ['sso-providers']

export function useSsoProviders() {
    return useQuery({
        queryKey: PUBLIC_KEY,
        queryFn: () => ssoApi.providers(),
        staleTime: 60_000,
    })
}

export function useSsoPresets() {
    return useQuery({
        queryKey: PRESETS_KEY,
        queryFn: () => ssoApi.presets(),
        staleTime: Infinity,
    })
}

export function useIdentityProviders() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => ssoApi.list(),
    })
}

export function useIdentityProvider(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => ssoApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateIdentityProvider(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: IdentityProviderFormData) => ssoApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.sso.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.sso.createFailed'))
        },
    })
}

export function useUpdateIdentityProvider(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<IdentityProviderFormData> }) =>
            ssoApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.sso.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.sso.updateFailed'))
        },
    })
}

export function useDeleteIdentityProvider() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => ssoApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.sso.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.sso.deleteFailed'))
        },
    })
}

export function useTestIdentityProvider() {
    return useMutation({
        mutationFn: (id: string | number) => ssoApi.test(id),
        onSuccess: (result) => {
            if (result.status === 'ok') {
                toast.success(i18n.t('toasts.sso.testOk'))
            } else {
                toast.error(result.message || i18n.t('toasts.sso.testFailed'))
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.sso.testFailed'))
        },
    })
}
