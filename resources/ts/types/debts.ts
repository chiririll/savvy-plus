import { BaseEntity } from './api'
import { Currency } from './currencies'

export type DebtType = 'i_owe' | 'owed_to_me'

export interface Debt extends BaseEntity {
    name: string
    type: 'debt'
    debtType: DebtType
    debtTypeLabel: string
    currencyId: number
    targetAmount: number
    currentBalance: number
    remainingDebt: number
    paymentProgress: number
    dueDate?: string
    counterparty?: string
    description?: string
    isPaidOff: boolean
    isActive: boolean
    currency?: Currency
}

export type DebtOrigin = 'new' | 'existing'

export interface DebtFormData {
    origin?: DebtOrigin
    name: string
    debt_type: DebtType
    currency_id?: number
    account_id?: number
    date?: string
    amount: number
    due_date?: string
    counterparty?: string
    description?: string
}

export interface DebtPaymentFormData {
    account_id: number
    amount: number
    date: string
    description?: string
}

export interface DebtSummary {
    total_i_owe: number
    total_owed_to_me: number
    net_debt: number
    debts_count: number
    currency: string | null
    decimals: number
}

export interface DebtsResponse {
    data: Debt[]
    summary?: DebtSummary
}
