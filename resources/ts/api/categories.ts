import { apiClient } from './client'
import { createCrudApi } from './crud'
import { toQueryString } from '@/lib/query-string'
import { Category, CategoryFormData, CategorySummaryResponse } from '@/types'

export const categoriesApi = {
    ...createCrudApi<Category, CategoryFormData>('/categories'),

    getSummary: async (params: {
        type: 'income' | 'expense'
        start_date?: string
        end_date?: string
    }): Promise<CategorySummaryResponse> => {
        const response = await apiClient.get(`/categories-summary${toQueryString(params)}`)
        return response.data
    },
}
