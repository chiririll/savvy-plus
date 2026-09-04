import { useTranslation } from 'react-i18next'
import { EntityFormDialog } from '@/components/shared'
import { DebtFormData as DebtFormValues } from '@/schemas'
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

export function DebtFormDialog({
    debt,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: DebtFormDialogProps) {
    const { t } = useTranslation('pages')

    return (
        <EntityFormDialog<Debt, DebtFormData, DebtFormValues>
            entity={debt}
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            formId={FORM_ID}
            title={debt ? t('debts.editTitle') : t('debts.createTitle')}
            description={t('debts.description')}
            toFormValues={(item) => ({
                name: item.name,
                debt_type: item.debtType,
                currency_id: item.currencyId,
                amount: item.targetAmount,
                due_date: item.dueDate ?? '',
                counterparty: item.counterparty ?? '',
                description: item.description ?? '',
            })}
        >
            {({ formKey, formProps, isEdit }) => (
                <DebtForm
                    key={formKey}
                    defaultValues={formProps.defaultValues}
                    onSubmit={onSubmit}
                    onValuesChange={formProps.onValuesChange}
                    isSubmitting={formProps.isSubmitting}
                    formId={formProps.formId}
                    hideSubmit
                    mode={isEdit ? 'edit' : 'create'}
                />
            )}
        </EntityFormDialog>
    )
}
