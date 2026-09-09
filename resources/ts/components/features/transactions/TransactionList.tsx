import { FileX, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty'
import { formatTransactionGroupHeading, groupByDateKey } from '@/lib/dates'
import { intlLocale } from '@/lib/i18n'
import { Transaction } from '@/types'
import { TransactionRow } from './TransactionRow'

interface TransactionListProps {
    transactions: Transaction[]
    isLoading?: boolean
    emptyTitle: string
    emptyDescription: string
    emptyAction?: React.ReactNode
    onCreate?: () => void
    createLabel?: string
    onDelete: (id: number) => void
    onDuplicate: (id: number) => void
    onConfirm?: (transaction: Transaction) => void
    onSkip?: (id: number) => void
    onEdit?: (transaction: Transaction) => void
    isReadOnly?: boolean
}

function TransactionListSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, group) => (
                <div key={group} className="space-y-1">
                    <Skeleton className="mb-2 h-4 w-28" />
                    {Array.from({ length: 3 }).map((__, row) => (
                        <div key={row} className="flex items-center gap-3 px-1.5 py-2">
                            <Skeleton className="size-10 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

export function TransactionList({
    transactions,
    isLoading,
    emptyTitle,
    emptyDescription,
    emptyAction,
    onCreate,
    createLabel,
    onDelete,
    onDuplicate,
    onConfirm,
    onSkip,
    onEdit,
    isReadOnly,
}: TransactionListProps) {
    const { t, i18n } = useTranslation('pages')
    const groups = groupByDateKey(transactions)

    if (isLoading) {
        return <TransactionListSkeleton />
    }

    if (transactions.length === 0) {
        return (
            <Empty className="border rounded-lg py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <FileX />
                    </EmptyMedia>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>{emptyDescription}</EmptyDescription>
                </EmptyHeader>
                {emptyAction ?? (
                    onCreate && !isReadOnly ? (
                        <Button onClick={onCreate}>
                            <Plus className="size-4" />
                            {createLabel}
                        </Button>
                    ) : undefined
                )}
            </Empty>
        )
    }

    return (
        <div className="space-y-5">
            {groups.map((group) => (
                <section key={group.date ?? 'undated'} className="min-w-0">
                    <h2 className="px-1.5 pb-1 text-sm font-semibold capitalize">
                        {formatTransactionGroupHeading(group.date, intlLocale(i18n.language), {
                            today: t('transactions.today'),
                            yesterday: t('transactions.yesterday'),
                            noDate: t('transactions.noDate'),
                        })}
                    </h2>
                    <div className="divide-y divide-border/60">
                        {group.items.map((transaction) => (
                            <TransactionRow
                                key={transaction.id}
                                transaction={transaction}
                                onDelete={onDelete}
                                onDuplicate={onDuplicate}
                                onConfirm={onConfirm}
                                onSkip={onSkip}
                                onEdit={onEdit}
                                isReadOnly={isReadOnly}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
