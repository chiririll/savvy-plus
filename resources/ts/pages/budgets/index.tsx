import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createBudgetColumns } from '@/components/features/budgets'
import { useBudgets, useDeleteBudget } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

export default function BudgetsPage() {
    const { t } = useTranslation('pages')
    const { data: budgets, isLoading } = useBudgets()
    const deleteBudget = useDeleteBudget()
    const isReadOnly = useReadOnly()

    const columns = createBudgetColumns((id) => deleteBudget.mutate(id), isReadOnly)

    return (
        <ListPage
            title={t('budgets.title')}
            description={t('budgets.description')}
            createLink="/budgets/create"
            createLabel={t('budgets.create')}
            data={budgets ?? []}
            columns={columns}
            isLoading={isLoading}
        />
    )
}
