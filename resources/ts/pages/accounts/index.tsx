import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createAccountColumns } from '@/components/features/accounts'
import { useAccounts, useDeleteAccount } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

export default function AccountsPage() {
    const { t } = useTranslation('pages')
    const { data: accounts, isLoading } = useAccounts({ exclude_debts: true })
    const deleteAccount = useDeleteAccount()
    const isReadOnly = useReadOnly()

    const columns = createAccountColumns((id) => deleteAccount.mutate(id), isReadOnly)

    return (
        <ListPage
            title={t('accounts.title')}
            description={t('accounts.description')}
            createLink="/accounts/create"
            createLabel={t('accounts.create')}
            data={accounts ?? []}
            columns={columns}
            isLoading={isLoading}
        />
    )
}
