import { useState } from 'react'
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    Banknote,
    Check,
    Copy,
    HandCoins,
    SkipForward,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { RowActions } from '@/components/shared'
import { useIsMobile, useLongPress } from '@/hooks'
import { cn, formatCurrency } from '@/lib/utils'
import { displayTransactionDescription, transactionAmountAppearance, transactionSubtitle } from '@/lib/transaction-description'
import { Transaction } from '@/types'
import { SkipTransactionAlert } from './SkipTransactionAlert'
import { TransactionItemsRow } from './TransactionItemsRow'

const TYPE_ICONS = {
    income: ArrowDownLeft,
    expense: ArrowUpRight,
    transfer: ArrowLeftRight,
    debt_payment: Banknote,
    debt_collection: HandCoins,
    debt_lend: HandCoins,
    debt_borrow: Banknote,
} as const

const TYPE_ICON_TONES = {
    income: 'bg-green-100 text-green-600 dark:bg-green-950/40',
    expense: 'bg-red-100 text-red-600 dark:bg-red-950/40',
    transfer: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40',
    debt_payment: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40',
    debt_collection: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40',
    debt_lend: 'bg-red-100 text-red-600 dark:bg-red-950/40',
    debt_borrow: 'bg-green-100 text-green-600 dark:bg-green-950/40',
} as const

interface TransactionRowProps {
    transaction: Transaction
    onDelete?: (id: number) => void
    onDuplicate?: (id: number) => void
    onConfirm?: (transaction: Transaction) => void
    onSkip?: (id: number) => void
    onEdit?: (transaction: Transaction) => void
    isReadOnly?: boolean
    showActions?: boolean
}

export function TransactionRow({
    transaction,
    onDelete,
    onDuplicate,
    onConfirm,
    onSkip,
    onEdit,
    isReadOnly,
    showActions = true,
}: TransactionRowProps) {
    const { t } = useTranslation(['common', 'pages'])
    const isMobile = useIsMobile()
    const [expanded, setExpanded] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const itemsCount = transaction.itemsCount ?? transaction.items?.length ?? 0
    const canExpand = itemsCount > 1
    const { sign, className } = transactionAmountAppearance(transaction.type, transaction.status)
    const isTransfer = transaction.type === 'transfer'
    const TypeIcon = TYPE_ICONS[transaction.type]
    const { edit, duplicate, delete: canRemove, confirm, skip } = transaction.actions
    const canEdit = edit && !!onEdit
    const canConfirm = !isReadOnly && confirm && !!onConfirm
    const canSkip = !isReadOnly && skip && !!onSkip
    const canDuplicate = !isReadOnly && duplicate && !!onDuplicate
    const canDelete = !isReadOnly && canRemove && !!onDelete
    const hasActions = showActions && (canEdit || canConfirm || canSkip || canDuplicate || canDelete)
    const subtitle = transactionSubtitle(transaction)

    const longPress = useLongPress({ enabled: hasActions && isMobile })

    const handleOpen = () => {
        if (canEdit) {
            onEdit(transaction)
        }
    }

    return (
        <div className="min-w-0">
            <div
                className={cn(
                    'relative flex min-w-0 items-center gap-2.5 rounded-lg py-2 sm:gap-3 sm:px-1.5',
                    canEdit && 'cursor-pointer hover:bg-muted/60',
                    isMobile && hasActions && 'select-none [-webkit-touch-callout:none]',
                )}
                {...(isMobile && hasActions ? longPress.handlers : {})}
                onClick={() => {
                    if (longPress.consume()) {
                        setMenuOpen(true)
                        return
                    }
                    handleOpen()
                }}
                onContextMenu={(event) => {
                    if (!isMobile || !hasActions) {
                        return
                    }
                    event.preventDefault()
                    longPress.mark()
                    setMenuOpen(true)
                }}
                onKeyDown={canEdit ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleOpen()
                    }
                } : undefined}
                role={canEdit ? 'button' : undefined}
                tabIndex={canEdit ? 0 : undefined}
            >
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full text-base',
                        !transaction.category?.color && TYPE_ICON_TONES[transaction.type],
                    )}
                    style={transaction.category?.color
                        ? { backgroundColor: `${transaction.category.color}20` }
                        : undefined}
                >
                    {transaction.category?.icon ? (
                        <span aria-hidden>{transaction.category.icon}</span>
                    ) : (
                        <TypeIcon className="size-4" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate font-semibold">
                            {displayTransactionDescription(transaction)}
                        </p>
                        {transaction.status === 'skipped' && (
                            <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">
                                {t('pages:transactions.status.skipped')}
                            </Badge>
                        )}
                        {transaction.status === 'pending' && (
                            <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">
                                {t('pages:transactions.status.pending')}
                            </Badge>
                        )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                        {subtitle}
                        {canExpand && (
                            <button
                                type="button"
                                className="ml-1.5 text-primary hover:underline"
                                aria-expanded={expanded}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setExpanded((value) => !value)
                                }}
                            >
                                ({t('pages:transactions.items.count', { count: itemsCount })})
                            </button>
                        )}
                    </p>
                </div>

                <div className="min-w-0 shrink-0 text-right">
                    <p className={cn(
                        'font-mono font-semibold',
                        className,
                        transaction.status === 'pending' && 'opacity-60',
                    )}>
                        {sign}{formatCurrency(transaction.amount, transaction.account.currency)}
                    </p>
                    {isTransfer && transaction.toAmount != null && transaction.toAccount && (
                        <p className="font-mono text-xs text-muted-foreground">
                            {transaction.status === 'skipped' ? '' : '+'}
                            {formatCurrency(transaction.toAmount, transaction.toAccount.currency)}
                        </p>
                    )}
                </div>

                {hasActions && (
                    <div
                        className={cn(!isMobile && '-mr-1 shrink-0')}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <RowActions
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                            showTrigger={!isMobile}
                            onEdit={canEdit ? () => onEdit(transaction) : undefined}
                            onDelete={canDelete ? () => onDelete(transaction.id) : undefined}
                            deleteTitle={t('pages:transactions.deleteTitle')}
                            deleteDescription={t('pages:transactions.deleteDescription')}
                        >
                            {canConfirm && (
                                <DropdownMenuItem onClick={() => onConfirm(transaction)}>
                                    <Check className="mr-2 size-4" />
                                    {t('actions.confirm')}
                                </DropdownMenuItem>
                            )}
                            {canSkip && (
                                <SkipTransactionAlert
                                    onConfirm={() => onSkip(transaction.id)}
                                    trigger={
                                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                            <SkipForward className="mr-2 size-4" />
                                            {t('actions.skip')}
                                        </DropdownMenuItem>
                                    }
                                />
                            )}
                            {canDuplicate && (
                                <DropdownMenuItem onClick={() => onDuplicate(transaction.id)}>
                                    <Copy className="mr-2 size-4" />
                                    {t('actions.duplicate')}
                                </DropdownMenuItem>
                            )}
                        </RowActions>
                    </div>
                )}
            </div>

            {expanded && canExpand && (
                <TransactionItemsRow transaction={transaction} />
            )}
        </div>
    )
}
