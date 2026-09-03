import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { TransactionFormValues } from '@/schemas/transactions'
import { TransactionForm } from './TransactionForm'

const FORM_ID = 'transaction-form'

interface TransactionFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: TransactionFormValues) => void
    isSubmitting?: boolean
    defaultValues?: Partial<TransactionFormValues>
}

export function TransactionFormDialog({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
    defaultValues,
}: TransactionFormDialogProps) {
    const { t } = useTranslation('pages')
    const { draft, onValuesChange, formKey } = useCreateFormDraft<TransactionFormValues>({
        enabled: true,
        open,
        isSubmitting,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('transactions.createTitle')}
            description={t('transactions.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            className="sm:max-w-xl"
        >
            <TransactionForm
                key={formKey}
                defaultValues={draft ?? defaultValues}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
