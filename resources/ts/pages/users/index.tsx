import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createUserColumns, UserFormDialog, UserPasswordLinkDialog } from '@/components/features/users'
import { useUsers, useDeleteUser, useCreateUser, useUpdateUser, useIssuePasswordToken } from '@/hooks'
import { useUser as useCurrentUser } from '@/stores/auth'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { User } from '@/types/users'
import { CreateUserFormData, UpdateUserFormData } from '@/schemas/users'

function setPasswordUrl(token: string): string {
    return `${window.location.origin}/set-password/${token}`
}

export default function UsersPage() {
    const { t } = useTranslation('pages')
    const currentUser = useCurrentUser()
    const { data: users, isLoading } = useUsers()
    const deleteUser = useDeleteUser()
    const createUser = useCreateUser()
    const updateUser = useUpdateUser()
    const issueToken = useIssuePasswordToken()
    const isReadOnly = useReadOnly()

    const [formOpen, setFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [linkUrl, setLinkUrl] = useState<string | null>(null)

    const openCreate = () => {
        setEditingUser(null)
        setFormOpen(true)
    }

    const openEdit = (user: User) => {
        setEditingUser(user)
        setFormOpen(true)
    }

    const showLink = (token?: string) => {
        if (!token) return
        setFormOpen(false)
        setLinkUrl(setPasswordUrl(token))
    }

    const handleSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
        if (editingUser) {
            const { password, ...rest } = data
            updateUser.mutate(
                { id: editingUser.id, data: { ...rest, password: password || undefined } },
                { onSuccess: () => setFormOpen(false) },
            )
            return
        }

        const createData = data as CreateUserFormData
        createUser.mutate(
            {
                name: createData.name,
                email: createData.email,
                role: createData.role,
                password: createData.setPassword ? createData.password : undefined,
            },
            {
                onSuccess: (user) => {
                    if (user.token) {
                        showLink(user.token)
                    } else {
                        setFormOpen(false)
                    }
                },
            },
        )
    }

    const handleReset = (user: User) => {
        issueToken.mutate(user.id, {
            onSuccess: (result) => showLink(result.token),
        })
    }

    const columns = createUserColumns(
        (id) => deleteUser.mutate(id),
        openEdit,
        handleReset,
        currentUser?.id,
        isReadOnly
    )

    return (
        <>
            <ListPage
                title={t('users.title')}
                description={t('users.description')}
                createLabel={t('users.create')}
                onCreateClick={isReadOnly ? undefined : openCreate}
                data={users ?? []}
                columns={columns}
                isLoading={isLoading}
            />

            <UserFormDialog
                user={editingUser}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleSubmit}
                isSubmitting={createUser.isPending || updateUser.isPending}
            />

            <UserPasswordLinkDialog
                url={linkUrl}
                open={linkUrl !== null}
                onOpenChange={(open) => {
                    if (!open) setLinkUrl(null)
                }}
            />
        </>
    )
}
