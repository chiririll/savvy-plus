import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { categoriesApi } from '@/api'
import { CategoryFormData, CategoryType } from '@/types'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['categories']

export function useCategories(type?: CategoryType) {
    return useQuery({
        queryKey: type ? [...QUERY_KEY, type] : QUERY_KEY,
        queryFn: () => type ? categoriesApi.getByType(type) : categoriesApi.getAll(),
    })
}

export function useCategorySummary(params: {
    type: 'income' | 'expense'
    start_date?: string
    end_date?: string
}) {
    return useQuery({
        queryKey: [...QUERY_KEY, 'summary', params],
        queryFn: () => categoriesApi.getSummary(params),
        enabled: !!params.type,
    })
}

export function useCategory(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => categoriesApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateCategory(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: CategoryFormData) => categoriesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.category.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.category.createFailed'))
        },
    })
}

export function useUpdateCategory(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<CategoryFormData> }) =>
            categoriesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.category.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.category.updateFailed'))
        },
    })
}

export function useDeleteCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.category.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.category.deleteFailed'))
        },
    })
}
