import i18n from '@/lib/i18n'
import type { Transaction } from '@/types'

const STORED_MESSAGE_KEY = /^messages\.[a-z0-9_.]+$/i

export function displayTransactionDescription(
    transaction: Pick<Transaction, 'description' | 'type' | 'category' | 'account' | 'toAccount'>
): string {
    const stored = transaction.description?.trim()
    if (stored && !STORED_MESSAGE_KEY.test(stored)) {
        return stored
    }

    const name = transaction.toAccount?.name ?? transaction.account.name

    switch (transaction.type) {
        case 'transfer':
            return transaction.toAccount
                ? `${transaction.account.name} → ${transaction.toAccount.name}`
                : transaction.account.name
        case 'debt_payment':
            return i18n.t('pages:transactions.fallback.payment', { name })
        case 'debt_collection':
            return i18n.t('pages:transactions.fallback.collection', { name })
        case 'debt_lend':
            return i18n.t('pages:transactions.fallback.lend', { name })
        case 'debt_borrow':
            return i18n.t('pages:transactions.fallback.borrow', { name })
        default:
            return transaction.category?.name || i18n.t(`pages:transactions.types.${transaction.type}`)
    }
}
