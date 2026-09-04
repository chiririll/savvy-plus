import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ListPage } from '@/components/shared'
import { BudgetFormDialog, createBudgetColumns } from '@/components/features/budgets'
import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import type { Budget, BudgetFormData } from '@/types'

export default function BudgetsPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: budgets, isLoading } = useBudgets()
    const deleteBudget = useDeleteBudget()
    const createBudget = useCreateBudget()
    const updateBudget = useUpdateBudget()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formBudget, setFormBudget] = useState<Budget | null>(null)

    const items = budgets ?? []

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormBudget(null)
            setFormOpen(true)
            setSearchParams((prev) => {
                prev.delete('create')
                return prev
            }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    useEffect(() => {
        const editId = searchParams.get('edit')
        if (!editId) return

        const found = items.find((budget) => String(budget.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormBudget(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormBudget(null)
        setFormOpen(true)
    }

    const handleEdit = (budget: Budget) => {
        setFormBudget(budget)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: BudgetFormData) => {
        if (formBudget) {
            updateBudget.mutate(
                { id: formBudget.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createBudget.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const columns = createBudgetColumns({
        onDelete: (id) => deleteBudget.mutate(id),
        onEdit: handleEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('budgets.title')}
                description={t('budgets.description')}
                createLabel={t('budgets.create')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <BudgetFormDialog
                budget={formBudget}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createBudget.isPending || updateBudget.isPending}
            />
        </>
    )
}
