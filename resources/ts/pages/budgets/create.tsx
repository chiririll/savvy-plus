import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { BudgetForm } from '@/components/features/budgets'
import { useCreateBudget } from '@/hooks'

export default function BudgetCreatePage() {
    const { t } = useTranslation('pages')
    const createBudget = useCreateBudget('/budgets')

    return (
        <FormPage title={t('budgets.createTitle')} backLink="/budgets">
            <BudgetForm
                onSubmit={(data) => createBudget.mutate(data)}
                isSubmitting={createBudget.isPending}
                submitLabel="Create"
            />
        </FormPage>
    )
}
