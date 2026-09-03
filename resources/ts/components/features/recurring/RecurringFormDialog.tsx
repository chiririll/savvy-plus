import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { RecurringFormData } from '@/schemas'
import { RecurringTransaction } from '@/types'
import { RecurringForm } from './RecurringForm'

const FORM_ID = 'recurring-form'

interface RecurringFormDialogProps {
    recurring?: RecurringTransaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: RecurringFormData) => void
    isSubmitting?: boolean
}

function toFormValues(recurring: RecurringTransaction): Partial<RecurringFormData> {
    return {
        type: recurring.type,
        account_id: recurring.accountId,
        to_account_id: recurring.toAccountId,
        category_id: recurring.categoryId,
        amount: recurring.amount,
        to_amount: recurring.toAmount,
        description: recurring.description,
        frequency: recurring.frequency,
        interval: recurring.interval,
        day_of_week: recurring.dayOfWeek,
        day_of_month: recurring.dayOfMonth,
        start_date: recurring.startDate,
        end_date: recurring.endDate,
        is_active: recurring.isActive,
        tag_ids: recurring.tags.map((tag) => tag.id),
    }
}

export function RecurringFormDialog({
    recurring,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: RecurringFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!recurring
    const { draft, onValuesChange, formKey } = useCreateFormDraft<RecurringFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: recurring?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('recurring.editTitle') : t('recurring.createTitle')}
            description={t('recurring.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <RecurringForm
                key={formKey}
                defaultValues={recurring ? toFormValues(recurring) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
