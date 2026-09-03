import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { Debt, DebtFormData } from '@/types'
import { DebtForm } from './DebtForm'

const FORM_ID = 'debt-form'

interface DebtFormDialogProps {
    debt?: Debt | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: DebtFormData) => void
    isSubmitting?: boolean
}

function toFormValues(debt: Debt): Partial<DebtFormData> {
    return {
        name: debt.name,
        debt_type: debt.debtType,
        currency_id: debt.currencyId,
        amount: debt.targetAmount,
        due_date: debt.dueDate ?? '',
        counterparty: debt.counterparty ?? '',
        description: debt.description ?? '',
    }
}

export function DebtFormDialog({
    debt,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: DebtFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!debt
    const { draft, onValuesChange, formKey } = useCreateFormDraft<DebtFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: debt?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('debts.editTitle') : t('debts.createTitle')}
            description={t('debts.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <DebtForm
                key={formKey}
                mode={isEdit ? 'edit' : 'create'}
                defaultValues={debt ? toFormValues(debt) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
