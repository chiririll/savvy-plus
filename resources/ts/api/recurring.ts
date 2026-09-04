import { api } from './client'
import { createCrudApi } from './crud'
import { RecurringTransaction, RecurringFormData } from '@/types'

export const recurringApi = {
    ...createCrudApi<RecurringTransaction, RecurringFormData>('/recurring'),

    getUpcoming: () =>
        api.get<RecurringTransaction[]>('/recurring-upcoming'),
}
