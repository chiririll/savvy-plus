import { ColumnDef } from '@tanstack/react-table'
import { Transaction } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/shared'
import { Copy, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ChevronRight, Banknote, HandCoins, Check, SkipForward } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { parseDateKey } from '@/lib/dates'
import { displayTransactionDescription, transactionAmountAppearance } from '@/lib/transaction-description'
import i18n, { intlLocale } from '@/lib/i18n'
import { SkipTransactionAlert } from './SkipTransactionAlert'

const TYPE_CONFIG = {
    income: { icon: ArrowDownLeft, color: 'text-green-600', bg: 'bg-green-100', label: 'Income' },
    expense: { icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-100', label: 'Expense' },
    transfer: { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Transfer' },
    debt_payment: { icon: Banknote, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Debt Payment' },
    debt_collection: { icon: HandCoins, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Debt Collection' },
    debt_lend: { icon: HandCoins, color: 'text-red-600', bg: 'bg-red-100', label: 'Debt Issued' },
    debt_borrow: { icon: Banknote, color: 'text-green-600', bg: 'bg-green-100', label: 'Loan Received' },
}

interface ColumnsOptions {
    onDelete: (id: number) => void
    onDuplicate: (id: number) => void
    onConfirm?: (transaction: Transaction) => void
    onSkip?: (id: number) => void
    onEdit?: (transaction: Transaction) => void
    isReadOnly?: boolean
}

export function createTransactionColumns({
    onDelete,
    onDuplicate,
    onConfirm,
    onSkip,
    onEdit,
    isReadOnly,
}: ColumnsOptions): ColumnDef<Transaction>[] {
    return [
        {
            id: 'expand',
            header: '',
            size: 32,
            cell: ({ row }) => {
                const itemsCount = row.original.itemsCount ?? row.original.items?.length ?? 0
                if (itemsCount <= 1) return null
                return (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => row.toggleExpanded()}
                        className="size-6"
                    >
                        <ChevronRight
                            className={cn(
                                'size-4 transition-transform',
                                row.getIsExpanded() && 'rotate-90'
                            )}
                        />
                    </Button>
                )
            },
        },
        {
            accessorKey: 'date',
            header: () => i18n.t('pages:transactions.columns.date'),
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm">
                        {row.original.date
                            ? parseDateKey(row.original.date).toLocaleDateString(intlLocale())
                            : i18n.t('pages:transactions.noDate')}
                    </span>
                    {row.original.status === 'skipped' && (
                        <Badge variant="secondary" className="w-fit text-xs">
                            {i18n.t('pages:transactions.status.skipped')}
                        </Badge>
                    )}
                    {row.original.status === 'pending' && (
                        <Badge variant="outline" className="w-fit text-xs">
                            {i18n.t('pages:transactions.status.pending')}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: () => i18n.t('pages:transactions.columns.type'),
            cell: ({ row }) => {
                const type = row.original.type
                const config = TYPE_CONFIG[type]
                const Icon = config.icon
                return (
                    <Badge variant="secondary" className={cn('gap-1', config.bg, config.color)}>
                        <Icon className="size-3" />
                        {i18n.t(`pages:transactions.types.${type}`, { defaultValue: config.label })}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'description',
            header: () => i18n.t('pages:transactions.columns.description'),
            cell: ({ row }) => {
                const { category, account, toAccount, type, itemsCount, tags } = row.original

                const getSubDescription = () => {
                    if (type === 'transfer') {
                        return <span>{account.name} → {toAccount?.name}</span>
                    }
                    if (type === 'debt_payment' || type === 'debt_lend') {
                        return <span>{account.name} → {toAccount?.name}</span>
                    }
                    if (type === 'debt_collection' || type === 'debt_borrow') {
                        return <span>{toAccount?.name} → {account.name}</span>
                    }
                    return (
                        <span>
                            {account.name}
                            {category && ` · ${category.icon} ${category.name}`}
                        </span>
                    )
                }

                return (
                    <div className="space-y-1">
                        <div className="font-medium">
                            {displayTransactionDescription(row.original)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {getSubDescription()}
                            {itemsCount != null && itemsCount > 0 && (
                                <span className="ml-2 text-primary">({i18n.t('pages:transactions.items.count', { count: itemsCount })})</span>
                            )}
                        </div>
                        {tags && tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                    <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                                        #{tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: 'amount',
            header: () => <div className="text-right">{i18n.t('pages:transactions.columns.amount')}</div>,
            cell: ({ row }) => {
                const { type, amount, toAmount, account, toAccount, status } = row.original
                const { sign, className } = transactionAmountAppearance(type, status)
                const isTransfer = type === 'transfer'

                return (
                    <div className="text-right space-y-1">
                        <div className={cn(
                            'font-mono font-semibold',
                            className,
                            status === 'pending' && 'opacity-60',
                        )}>
                            {sign}{formatCurrency(amount, account.currency)}
                        </div>
                        {isTransfer && toAmount && toAccount && (
                            <div className="text-xs text-muted-foreground font-mono">
                                → {status === 'skipped' ? '' : '+'}{formatCurrency(toAmount, toAccount.currency)}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const transaction = row.original
                const { edit, duplicate, delete: canRemove, confirm, skip } = transaction.actions
                const canEdit = edit && !!onEdit
                const canConfirm = !isReadOnly && confirm && !!onConfirm
                const canSkip = !isReadOnly && skip && !!onSkip
                const canDuplicate = !isReadOnly && duplicate
                const canDelete = !isReadOnly && canRemove

                if (!canEdit && !canConfirm && !canSkip && !canDuplicate && !canDelete) {
                    return null
                }

                return (
                    <RowActions
                        onEdit={canEdit ? () => onEdit(transaction) : undefined}
                        onDelete={canDelete ? () => onDelete(transaction.id) : undefined}
                        deleteTitle={i18n.t('pages:transactions.deleteTitle')}
                        deleteDescription={i18n.t('pages:transactions.deleteDescription')}
                    >
                        {canConfirm && (
                            <DropdownMenuItem onClick={() => onConfirm(transaction)}>
                                <Check className="mr-2 size-4" />
                                {i18n.t('actions.confirm')}
                            </DropdownMenuItem>
                        )}
                        {canSkip && (
                            <SkipTransactionAlert
                                onConfirm={() => onSkip(transaction.id)}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <SkipForward className="mr-2 size-4" />
                                        {i18n.t('actions.skip')}
                                    </DropdownMenuItem>
                                }
                            />
                        )}
                        {canDuplicate && (
                            <DropdownMenuItem onClick={() => onDuplicate(transaction.id)}>
                                <Copy className="mr-2 size-4" />
                                {i18n.t('actions.duplicate')}
                            </DropdownMenuItem>
                        )}
                    </RowActions>
                )
            },
        },
    ]
}
