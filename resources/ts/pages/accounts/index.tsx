import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { AccountFormDialog, createAccountColumns } from '@/components/features/accounts'
import { useAccounts, useCreateAccount, useDeleteAccount, useReorderAccounts, useUpdateAccount, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import type { Account } from '@/types'
import type { AccountFormData } from '@/schemas'

export default function AccountsPage() {
    const { t } = useTranslation('pages')
    const { data: accounts, isLoading } = useAccounts({ exclude_debts: true })
    const deleteAccount = useDeleteAccount()
    const createAccount = useCreateAccount()
    const updateAccount = useUpdateAccount()
    const reorderAccounts = useReorderAccounts()
    const isReadOnly = useReadOnly()
    const items = accounts ?? []
    const form = useResourceFormDialog<Account, AccountFormData>({
        items,
        isLoading,
        create: createAccount,
        update: updateAccount,
    })

    const columns = createAccountColumns({
        onDelete: (id) => deleteAccount.mutate(id),
        onEdit: form.openEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('accounts.title')}
                description={t('accounts.description')}
                createLabel={t('accounts.create')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
                onReorder={isReadOnly ? undefined : (reordered) => {
                    reorderAccounts.mutate(reordered.map((account) => account.id))
                }}
            />

            <AccountFormDialog
                account={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
