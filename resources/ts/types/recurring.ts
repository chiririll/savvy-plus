import { BaseEntity } from './api'
import { Account } from './accounts'
import { Category } from './categories'
import { Tag } from './tags'

import type { TransactionType } from './transactions'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type RecurringTransactionType = Extract<TransactionType, 'income' | 'expense' | 'transfer'>

export interface RecurringTransaction extends BaseEntity {
    type: RecurringTransactionType
    accountId: number
    toAccountId?: number
    categoryId?: number
    amount: number
    toAmount?: number
    description?: string
    frequency: RecurringFrequency
    frequencyLabel: string
    interval: number
    dayOfWeek?: number
    dayOfMonth?: number
    startDate: string
    endDate?: string
    nextRunDate: string
    lastRunDate?: string
    isActive: boolean
    account: Account
    toAccount?: Account
    category?: Category
    tags: Tag[]
}
