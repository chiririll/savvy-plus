import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { AccountForm } from '@/components/features/accounts'
import { useCreateAccount } from '@/hooks'

export default function AccountCreatePage() {
    const { t } = useTranslation('pages')
    const createAccount = useCreateAccount('/accounts')

    return (
        <FormPage title={t('accounts.createTitle')} backLink="/accounts">
            <AccountForm
                onSubmit={(data) => createAccount.mutate(data)}
                isSubmitting={createAccount.isPending}
                submitLabel="Create"
            />
        </FormPage>
    )
}
