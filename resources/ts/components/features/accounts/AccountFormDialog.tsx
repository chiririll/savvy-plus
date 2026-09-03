import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { AccountFormValues, encodeAccountCurrency } from '@/schemas'
import { Account, AccountFormData } from '@/types'
import { AccountForm } from './AccountForm'

const FORM_ID = 'account-form'

interface AccountFormDialogProps {
    account?: Account | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: AccountFormData) => void
    isSubmitting?: boolean
}

function toFormValues(account: Account): Partial<AccountFormValues> {
    return {
        name: account.name,
        type: account.type === 'debt' ? 'bank' : account.type,
        currency: encodeAccountCurrency({ id: account.currencyId }),
        initial_balance: account.initialBalance,
        is_active: account.isActive,
    }
}

export function AccountFormDialog({
    account,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: AccountFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!account
    const { draft, onValuesChange, formKey } = useCreateFormDraft<AccountFormValues>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: account?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('accounts.editTitle') : t('accounts.createTitle')}
            description={t('accounts.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <AccountForm
                key={formKey}
                defaultValues={account ? toFormValues(account) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
