import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Page, PageHeader, DataTable, ServerPagination } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
    createTransactionColumns,
    TransactionFiltersPanel,
    TransactionItemsRow,
    UpcomingPendingStrip,
    useTransactionDeepLink,
} from '@/components/features/transactions'
import {
    useTransactions,
    useDeleteTransaction,
    useDuplicateTransaction,
    useConfirmTransaction,
    useSkipTransaction,
    useCategories,
    useTags,
    useTransactionListFilters,
} from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { addDaysLocal } from '@/lib/utils'

export default function TransactionsPage() {
    const { t } = useTranslation('pages')
    const list = useTransactionListFilters()
    const { data, isLoading } = useTransactions(list.filters)
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
    const transactions = data?.data ?? []
    const { openCreate, openEdit } = useTransactionDeepLink(data?.data)

    const handleCreate = () => {
        openCreate(list.params.type ? { type: list.params.type } : undefined)
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
    const showHighlight = !list.params.status && highlight.length > 0
    const meta = data?.meta

    return (
        <Page title={t('transactions.title')}>
            <PageHeader
                title={t('transactions.title')}
                description={t('transactions.description')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                createLabel={t('transactions.create')}
            />

            <TransactionFiltersPanel
                list={list}
                categories={categories}
                tags={tags}
                afterStatus={showHighlight ? (
                    <UpcomingPendingStrip
                        transactions={highlight}
                        isReadOnly={isReadOnly}
                        onConfirm={(id) => confirmTransaction.mutate(id)}
                        onSkip={(id) => skipTransaction.mutate(id)}
                    />
                ) : undefined}
            />

            <DataTable
                data={transactions}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={list.params.status === 'pending' ? t('transactions.emptyPendingTitle') : t('transactions.emptyTitle')}
                emptyDescription={list.params.status === 'pending' ? t('transactions.emptyPendingDescription') : t('transactions.emptyDescription')}
                emptyAction={
                    !isReadOnly ? (
                        <Button onClick={handleCreate}>
                            <Plus className="size-4" />
                            {t('transactions.create')}
                        </Button>
                    ) : undefined
                }
                renderSubComponent={TransactionItemsRow}
                getRowCanExpand={(row) => (row.original.itemsCount ?? row.original.items?.length ?? 0) > 1}
                manualPagination
            />

            {meta && (
                <ServerPagination
                    meta={meta}
                    onPageChange={list.setPage}
                    infoLabel={t('transactions.itemLabel')}
                />
            )}
        </Page>
    )
}
