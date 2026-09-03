import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useQueryStates, parseAsInteger, parseAsString, parseAsArrayOf, parseAsStringLiteral } from 'nuqs'
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Filter, ArrowUpDown, X } from 'lucide-react'
import { Row } from '@tanstack/react-table'
import { Page, PageHeader, DataTable, ServerPagination } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { createTransactionColumns, UpcomingPendingCard, useTransactionFormDialog } from '@/components/features/transactions'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTransactions, useTransaction, useDeleteTransaction, useDuplicateTransaction, useConfirmTransaction, useSkipTransaction, useCategories, useTags } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { TransactionType, Transaction } from '@/types'
import { addDaysLocal, cn, formatCurrency } from '@/lib/utils'

const TYPE_FILTERS: { value: TransactionType | null; labelKey: string; icon?: typeof ArrowDownLeft }[] = [
    { value: null, labelKey: 'all' },
    { value: 'income', labelKey: 'income', icon: ArrowDownLeft },
    { value: 'expense', labelKey: 'expense', icon: ArrowUpRight },
    { value: 'transfer', labelKey: 'transfer', icon: ArrowLeftRight },
]

const SORT_OPTIONS = [
    { value: 'date:desc', labelKey: 'dateNewest' },
    { value: 'date:asc', labelKey: 'dateOldest' },
    { value: 'amount:desc', labelKey: 'amountHigh' },
    { value: 'amount:asc', labelKey: 'amountLow' },
] as const

function TransactionItems({ row }: { row: Row<Transaction> }) {
    const { t } = useTranslation('pages')
    const items = row.original.items
    const currency = row.original.account.currency
    if (!items || items.length === 0) return null

    return (
        <div className="px-4 py-3 ml-10">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-muted-foreground text-xs">
                        <th className="text-left font-medium pb-2">{t('transactions.items.item')}</th>
                        <th className="text-right font-medium pb-2 w-20">{t('transactions.items.qty')}</th>
                        <th className="text-right font-medium pb-2 w-24">{t('transactions.items.price')}</th>
                        <th className="text-right font-medium pb-2 w-24">{t('transactions.items.total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id ?? idx} className="border-t border-border/50">
                            <td className="py-1.5">{item.name}</td>
                            <td className="py-1.5 text-right font-mono">{item.quantity}</td>
                            <td className="py-1.5 text-right font-mono">{formatCurrency(item.pricePerUnit, currency, { showSymbol: false })}</td>
                            <td className="py-1.5 text-right font-mono font-medium">{formatCurrency(item.totalPrice, currency, { showSymbol: false })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const transactionSearchParams = {
    type: parseAsStringLiteral(['income', 'expense', 'transfer'] as const),
    sortBy: parseAsStringLiteral(['date', 'amount'] as const).withDefault('date'),
    sortDir: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
    page: parseAsInteger.withDefault(1),
    categoryIds: parseAsArrayOf(parseAsInteger).withDefault([]),
    tagIds: parseAsArrayOf(parseAsInteger).withDefault([]),
    startDate: parseAsString,
    endDate: parseAsString,
    status: parseAsStringLiteral(['pending'] as const),
}

export default function TransactionsPage() {
    const { t } = useTranslation('pages')
    const [params, setParams] = useQueryStates(transactionSearchParams)
    const [searchParams, setSearchParams] = useSearchParams()
    const [filtersOpen, setFiltersOpen] = useState(false)
    const { openCreate, openEdit } = useTransactionFormDialog()
    const editId = searchParams.get('edit')
    const { data: editTransaction, isError: editNotFound } = useTransaction(editId ?? '')

    const filters = {
        per_page: 20,
        page: params.page,
        type: params.type ?? undefined,
        sort_by: params.sortBy,
        sort_direction: params.sortDir,
        category_ids: params.categoryIds.length > 0 ? params.categoryIds : undefined,
        tag_ids: params.tagIds.length > 0 ? params.tagIds : undefined,
        start_date: params.startDate ?? undefined,
        end_date: params.endDate ?? undefined,
        status: params.status ?? undefined,
    }

    const { data, isLoading } = useTransactions(filters)
    const { data: upcomingPending } = useTransactions({
        status: 'pending',
        end_date: addDaysLocal(new Date(), 7),
        sort_by: 'date',
        sort_direction: 'asc',
        per_page: 20,
    })
    const deleteTransaction = useDeleteTransaction()
    const duplicateTransaction = useDuplicateTransaction()
    const confirmTransaction = useConfirmTransaction()
    const skipTransaction = useSkipTransaction()
    const { data: categories } = useCategories()
    const { data: tags } = useTags()
    const isReadOnly = useReadOnly()

    useEffect(() => {
        if (searchParams.get('create') !== '1') {
            return
        }

        const type = searchParams.get('type')
        const accountId = searchParams.get('account_id')
        const amount = searchParams.get('amount')
        const description = searchParams.get('description')

        openCreate({
            type: type === 'income' || type === 'expense' || type === 'transfer' ? type : undefined,
            account_id: accountId ? Number(accountId) : undefined,
            amount: amount ? Number(amount) : undefined,
            description: description ?? undefined,
        })

        setSearchParams((prev) => {
            prev.delete('create')
            prev.delete('account_id')
            prev.delete('amount')
            prev.delete('description')
            prev.delete('type')
            return prev
        }, { replace: true })
    }, [openCreate, searchParams, setSearchParams])

    useEffect(() => {
        if (!editId) {
            return
        }

        const found = (data?.data ?? []).find((item) => String(item.id) === editId)
        const transaction = found ?? editTransaction
        if (!transaction && !editNotFound) {
            return
        }

        if (transaction) {
            openEdit(transaction)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [data?.data, editId, editNotFound, editTransaction, openEdit, setSearchParams])

    const handleCreate = () => {
        openCreate(params.type ? { type: params.type } : undefined)
    }

    const columns = createTransactionColumns({
        onDelete: (id) => deleteTransaction.mutate(id),
        onDuplicate: (id) => duplicateTransaction.mutate(id),
        onConfirm: (id) => confirmTransaction.mutate(id),
        onSkip: (id) => skipTransaction.mutate(id),
        onEdit: openEdit,
        isReadOnly,
    })
    const highlight = upcomingPending?.data ?? []
    const showHighlight = !params.status && highlight.length > 0

    const transactions = data?.data ?? []
    const meta = data?.meta

    const activeFiltersCount = [
        params.categoryIds.length > 0,
        params.tagIds.length > 0,
        params.startDate,
        params.endDate,
    ].filter(Boolean).length

    const clearFilters = () => {
        setParams({
            categoryIds: null,
            tagIds: null,
            startDate: null,
            endDate: null,
            page: 1,
        })
    }

    const toggleCategory = (id: number) => {
        const current = params.categoryIds
        const newIds = current.includes(id)
            ? current.filter(c => c !== id)
            : [...current, id]
        setParams({ categoryIds: newIds.length ? newIds : null, page: 1 })
    }

    const toggleTag = (id: number) => {
        const current = params.tagIds
        const newIds = current.includes(id)
            ? current.filter(t => t !== id)
            : [...current, id]
        setParams({ tagIds: newIds.length ? newIds : null, page: 1 })
    }

    // Filter categories based on selected type
    const filteredCategories = categories?.filter(c =>
        !params.type || params.type === 'transfer' || c.type === params.type
    ) ?? []

    return (
        <Page title={t('transactions.title')}>
            <PageHeader
                title={t('transactions.title')}
                description={t('transactions.description')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                createLabel={t('transactions.create')}
            />

            <Tabs
                value={params.status ?? 'all'}
                onValueChange={(value) => setParams({ status: value === 'pending' ? 'pending' : null, page: 1 })}
                className="mb-4"
            >
                <TabsList>
                    <TabsTrigger value="all">{t('common:actions.all')}</TabsTrigger>
                    <TabsTrigger value="pending">{t('transactions.tabs.pending')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {showHighlight && (
                <div className="mb-4 min-w-0">
                    <p className="text-sm font-medium mb-2">{t('transactions.upcomingTitle')}</p>
                    <div className="overflow-x-auto overscroll-x-contain pb-3">
                        <div className="flex w-max gap-2">
                            {highlight.map((transaction) => (
                                <UpcomingPendingCard
                                    key={transaction.id}
                                    transaction={transaction}
                                    isReadOnly={isReadOnly}
                                    onConfirm={(id) => confirmTransaction.mutate(id)}
                                    onSkip={(id) => skipTransaction.mutate(id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Type Filter & Sort */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex gap-2">
                    {TYPE_FILTERS.map(({ value, labelKey, icon: Icon }) => (
                        <Button
                            key={labelKey}
                            variant={params.type === value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setParams({ type: value, page: 1 })}
                        >
                            {Icon && <Icon className="size-4 mr-1" />}
                            {labelKey === 'all' ? t('common:actions.all') : t(`transactions.types.${labelKey}`)}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={`${params.sortBy}:${params.sortDir}`}
                        onValueChange={(val) => {
                            const [sortBy, sortDir] = val.split(':') as ['date' | 'amount', 'asc' | 'desc']
                            setParams({ sortBy, sortDir, page: 1 })
                        }}
                    >
                        <SelectTrigger className="w-[180px] h-9">
                            <ArrowUpDown className="size-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {t(`transactions.sort.${opt.labelKey}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Advanced Filters */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-4">
                <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="size-4 mr-2" />
                            {t('transactions.filters')}
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="size-4 mr-1" />
                            {t('transactions.clear')}
                        </Button>
                    )}
                </div>
                <CollapsibleContent className="mt-4 space-y-4">
                    <Card>
                        <CardContent className="pt-4 space-y-4">
                            {/* Date Range */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">{t('transactions.dateRange')}</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={params.startDate ?? ''}
                                        onChange={(e) => setParams({
                                            startDate: e.target.value || null,
                                            page: 1
                                        })}
                                        className="w-auto"
                                    />
                                    <span className="text-muted-foreground">{t('transactions.to')}</span>
                                    <Input
                                        type="date"
                                        value={params.endDate ?? ''}
                                        onChange={(e) => setParams({
                                            endDate: e.target.value || null,
                                            page: 1
                                        })}
                                        className="w-auto"
                                    />
                                </div>
                            </div>

                            {/* Categories */}
                            {filteredCategories.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t('transactions.categories')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {filteredCategories.map((category) => {
                                            const isSelected = params.categoryIds.includes(category.id)
                                            return (
                                                <Badge
                                                    key={category.id}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={cn(
                                                        'cursor-pointer transition-colors',
                                                        isSelected ? 'hover:bg-primary/80' : 'hover:bg-muted'
                                                    )}
                                                    onClick={() => toggleCategory(category.id)}
                                                >
                                                    {category.icon} {category.name}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {tags && tags.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">{t('transactions.tags')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => {
                                            const isSelected = params.tagIds.includes(tag.id)
                                            return (
                                                <Badge
                                                    key={tag.id}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={cn(
                                                        'cursor-pointer transition-colors',
                                                        isSelected ? 'hover:bg-primary/80' : 'hover:bg-muted'
                                                    )}
                                                    onClick={() => toggleTag(tag.id)}
                                                >
                                                    #{tag.name}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <DataTable
                data={transactions}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={params.status === 'pending' ? t('transactions.emptyPendingTitle') : t('transactions.emptyTitle')}
                emptyDescription={params.status === 'pending' ? t('transactions.emptyPendingDescription') : t('transactions.emptyDescription')}
                emptyAction={
                    !isReadOnly ? (
                        <Button onClick={handleCreate}>
                            <Plus className="size-4" />
                            {t('transactions.create')}
                        </Button>
                    ) : undefined
                }
                renderSubComponent={TransactionItems}
                getRowCanExpand={(row) => (row.original.itemsCount ?? row.original.items?.length ?? 0) > 1}
                manualPagination
            />

            {meta && (
                <ServerPagination
                    meta={meta}
                    onPageChange={(page) => setParams({ page })}
                    infoLabel={t('transactions.itemLabel')}
                />
            )}

        </Page>
    )
}
