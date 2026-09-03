import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { Budget, BudgetFormData } from '@/types'
import { BudgetForm } from './BudgetForm'

const FORM_ID = 'budget-form'

interface BudgetFormDialogProps {
    budget?: Budget | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: BudgetFormData) => void
    isSubmitting?: boolean
}

function toFormValues(budget: Budget): Partial<BudgetFormData> {
    return {
        name: budget.name,
        amount: budget.amount,
        currency_id: budget.currencyId,
        period: budget.period,
        start_date: budget.startDate,
        end_date: budget.endDate,
        is_global: budget.isGlobal,
        notify_at_percent: budget.notifyAtPercent,
        is_active: budget.isActive,
        category_ids: budget.categories.map((category) => category.id),
        tag_ids: budget.tags?.map((tag) => tag.id) ?? [],
    }
}

export function BudgetFormDialog({
    budget,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: BudgetFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!budget
    const { draft, onValuesChange, formKey } = useCreateFormDraft<BudgetFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: budget?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('budgets.editTitle') : t('budgets.createTitle')}
            description={t('budgets.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <BudgetForm
                key={formKey}
                defaultValues={budget ? toFormValues(budget) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
