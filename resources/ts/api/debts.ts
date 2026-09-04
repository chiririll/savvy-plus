import { api, apiClient } from './client'
import { createCrudApi } from './crud'
import { toQueryString } from '@/lib/query-string'
import { Debt, DebtFormData, DebtPaymentFormData, DebtSummary, DebtsResponse } from '@/types'
import { Transaction } from '@/types'

const ENDPOINT = '/debts'
const crud = createCrudApi<Debt, DebtFormData>(ENDPOINT)

export const debtsApi = {
    ...crud,

    getAll: (params?: { include_completed?: boolean }) =>
        crud.getAll(params),

    getAllWithSummary: async (params?: { include_completed?: boolean }): Promise<DebtsResponse> => {
        const response = await apiClient.get(`${ENDPOINT}${toQueryString({
            with_summary: true,
            include_completed: params?.include_completed,
        })}`)
        return response.data
    },

    makePayment: (debtId: number | string, data: DebtPaymentFormData) =>
        api.post<Transaction, DebtPaymentFormData>(`${ENDPOINT}/${debtId}/payment`, data),

    collectPayment: (debtId: number | string, data: DebtPaymentFormData) =>
        api.post<Transaction, DebtPaymentFormData>(`${ENDPOINT}/${debtId}/collect`, data),

    reopen: (id: number | string) =>
        api.post<Debt, Record<string, never>>(`${ENDPOINT}/${id}/reopen`, {}),

    getSummary: async (): Promise<DebtSummary> => {
        const response = await apiClient.get(`${ENDPOINT}-summary`)
        return response.data
    },
}
