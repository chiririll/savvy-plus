import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { accountsApi } from '@/api'
import { Account, AccountFormData } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'
import { getApiErrorMessage } from '@/lib/api-error'

const QUERY_KEY = ['accounts']

export function useAccounts(params?: { active?: boolean; exclude_debts?: boolean }) {
    return useQuery({
        queryKey: params ? [...QUERY_KEY, params] : QUERY_KEY,
        queryFn: () => accountsApi.getAll(params),
    })
}

export function useTotalBalance() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'summary'],
        queryFn: () => accountsApi.getAllWithSummary({ active: true }),
        select: (data) => data.summary,
    })
}

export function useBalanceHistory(params?: { start_date?: string; end_date?: string }) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'balance-history', params],
        queryFn: () => accountsApi.getBalanceHistory(params),
    })
}

export function useBalanceComparison() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'balance-comparison'],
        queryFn: () => accountsApi.getBalanceComparison(),
    })
}

export function useAccount(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => accountsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateAccount(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: AccountFormData) => accountsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.account.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.account.createFailed'))
        },
    })
}

export function useUpdateAccount(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<AccountFormData> }) =>
            accountsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.account.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.account.updateFailed'))
        },
    })
}

export function useReorderAccounts() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (ids: number[]) => accountsApi.reorder(ids),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const previous = queryClient.getQueriesData({ queryKey: QUERY_KEY })

            queryClient.setQueriesData<Account[]>({ queryKey: QUERY_KEY }, (old) => {
                if (!Array.isArray(old)) {
                    return old
                }

                const byId = new Map(old.map((account) => [account.id, account]))
                const reordered = ids
                    .map((id) => byId.get(id))
                    .filter((account): account is Account => account !== undefined)
                const rest = old.filter((account) => !ids.includes(account.id))

                return [...reordered, ...rest]
            })

            return { previous }
        },
        onError: (error, _ids, context) => {
            context?.previous.forEach(([key, data]: [QueryKey, unknown]) => {
                queryClient.setQueryData(key, data)
            })
            toast.error(getApiErrorMessage(error, i18n.t('toasts.account.reorderFailed')))
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        },
    })
}

export function useDeleteAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => accountsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.account.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.account.deleteFailed'))
        },
    })
}
