import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ListPage } from '@/components/shared'
import { AccountFormDialog, createAccountColumns } from '@/components/features/accounts'
import { useAccounts, useCreateAccount, useDeleteAccount, useReorderAccounts, useUpdateAccount } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import type { Account, AccountFormData } from '@/types'

export default function AccountsPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: accounts, isLoading } = useAccounts({ exclude_debts: true })
    const deleteAccount = useDeleteAccount()
    const createAccount = useCreateAccount()
    const updateAccount = useUpdateAccount()
    const reorderAccounts = useReorderAccounts()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formAccount, setFormAccount] = useState<Account | null>(null)

    const items = accounts ?? []

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormAccount(null)
            setFormOpen(true)
            setSearchParams((prev) => {
                prev.delete('create')
                return prev
            }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    useEffect(() => {
        const editId = searchParams.get('edit')
        if (!editId) return

        const found = items.find((account) => String(account.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormAccount(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormAccount(null)
        setFormOpen(true)
    }

    const handleEdit = (account: Account) => {
        setFormAccount(account)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: AccountFormData) => {
        if (formAccount) {
            updateAccount.mutate(
                { id: formAccount.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createAccount.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const handleReorder = (reordered: Account[]) => {
        reorderAccounts.mutate(reordered.map((account) => account.id))
    }

    const columns = createAccountColumns({
        onDelete: (id) => deleteAccount.mutate(id),
        onEdit: handleEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('accounts.title')}
                description={t('accounts.description')}
                createLabel={t('accounts.create')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
                onReorder={isReadOnly ? undefined : handleReorder}
            />

            <AccountFormDialog
                account={formAccount}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createAccount.isPending || updateAccount.isPending}
            />
        </>
    )
}
