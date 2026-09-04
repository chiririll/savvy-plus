import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { BudgetFormDialog, createBudgetColumns } from '@/components/features/budgets'
import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import type { Budget } from '@/types'
import type { BudgetFormData } from '@/schemas'

export default function BudgetsPage() {
    const { t } = useTranslation('pages')
    const { data: budgets, isLoading } = useBudgets()
    const deleteBudget = useDeleteBudget()
    const createBudget = useCreateBudget()
    const updateBudget = useUpdateBudget()
    const isReadOnly = useReadOnly()
    const items = budgets ?? []
    const form = useResourceFormDialog<Budget, BudgetFormData>({
        items,
        isLoading,
        create: createBudget,
        update: updateBudget,
    })

    const columns = createBudgetColumns({
        onDelete: (id) => deleteBudget.mutate(id),
        onEdit: form.openEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('budgets.title')}
                description={t('budgets.description')}
                createLabel={t('budgets.create')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <BudgetFormDialog
                budget={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
