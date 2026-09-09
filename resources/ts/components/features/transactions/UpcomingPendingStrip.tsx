import { useTranslation } from 'react-i18next'
import { Transaction } from '@/types'
import { UpcomingPendingCard } from './UpcomingPendingCard'

interface UpcomingPendingStripProps {
    transactions: Transaction[]
    isReadOnly?: boolean
    onConfirm: (transaction: Transaction) => void
    onSkip: (id: number) => void
}

export function UpcomingPendingStrip({
    transactions,
    isReadOnly,
    onConfirm,
    onSkip,
}: UpcomingPendingStripProps) {
    const { t } = useTranslation('pages')

    if (transactions.length === 0) {
        return null
    }

    return (
        <div className="mb-4 min-w-0">
            <p className="text-sm font-medium mb-2">{t('transactions.upcomingTitle')}</p>
            <div className="overflow-x-auto overscroll-x-contain pb-3">
                <div className="flex w-max gap-2">
                    {transactions.map((transaction) => (
                        <UpcomingPendingCard
                            key={transaction.id}
                            transaction={transaction}
                            isReadOnly={isReadOnly}
                            onConfirm={onConfirm}
                            onSkip={onSkip}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
