import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { TransactionFormValues } from '@/schemas/transactions'
import { Transaction } from '@/types'
import { TransactionForm } from './TransactionForm'

const FORM_ID = 'transaction-form'

interface TransactionFormDialogProps {
    transaction?: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: TransactionFormValues) => void
    isSubmitting?: boolean
    defaultValues?: Partial<TransactionFormValues>
}

export function toTransactionFormValues(transaction: Transaction): Partial<TransactionFormValues> {
    return {
        type: transaction.type as TransactionFormValues['type'],
        account_id: transaction.account.id,
        to_account_id: transaction.toAccount?.id ?? null,
        category_id: transaction.category?.id ?? null,
        amount: transaction.amount,
        to_amount: transaction.toAmount ?? null,
        exchange_rate: transaction.exchangeRate ?? null,
        description: transaction.description ?? '',
        date: transaction.date,
        items: transaction.items?.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price_per_unit: item.pricePerUnit,
        })) ?? [],
        tag_ids: transaction.tags?.map((tag) => tag.id) ?? [],
    }
}

export function TransactionFormDialog({
    transaction,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
    defaultValues,
}: TransactionFormDialogProps) {
    const { t } = useTranslation('pages')
    const [preview, setPreview] = useState<ReactNode>(null)
    const isEdit = !!transaction
    const { draft, onValuesChange, formKey } = useCreateFormDraft<TransactionFormValues>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: transaction?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('transactions.editTitle') : t('transactions.createTitle')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
            className="sm:max-w-xl"
            headerExtra={preview}
        >
            <TransactionForm
                key={formKey}
                defaultValues={transaction ? toTransactionFormValues(transaction) : (draft ?? defaultValues)}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                onPreviewChange={setPreview}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
