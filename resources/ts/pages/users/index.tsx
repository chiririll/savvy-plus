import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createUserColumns } from '@/components/features/users'
import { useUsers, useDeleteUser } from '@/hooks'
import { useUser as useCurrentUser } from '@/stores/auth'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

export default function UsersPage() {
    const { t } = useTranslation('pages')
    const currentUser = useCurrentUser()
    const { data: users, isLoading } = useUsers()
    const deleteUser = useDeleteUser()
    const isReadOnly = useReadOnly()

    const columns = createUserColumns(
        (id) => deleteUser.mutate(id),
        currentUser?.id,
        isReadOnly
    )

    return (
        <ListPage
            title={t('users.title')}
            description={t('users.description')}
            createLink="/users/create"
            createLabel={t('users.create')}
            data={users ?? []}
            columns={columns}
            isLoading={isLoading}
        />
    )
}
