import { BaseEntity } from './api'
import { Currency } from './currencies'

// All account types including debt
export type AccountType = 'bank' | 'crypto' | 'cash' | 'debt'

// Regular account types (excluding debt) - for account creation
export type RegularAccountType = 'bank' | 'crypto' | 'cash'

export interface Account extends BaseEntity {
    name: string
    type: AccountType
    currencyId: number
    initialBalance: number
    currentBalance: number
    isActive: boolean
    sortOrder: number
    currency?: Currency
}
