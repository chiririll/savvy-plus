import { api } from './client'
import { createCrudApi } from './crud'
import { RecurringTransaction } from '@/types'
import { RecurringFormData } from '@/schemas'

export const recurringApi = {
    ...createCrudApi<RecurringTransaction, RecurringFormData>('/recurring'),

    getUpcoming: () =>
        api.get<RecurringTransaction[]>('/recurring-upcoming'),
}
