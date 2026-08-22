import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { UserForm } from '@/components/features/users'
import { useUser, useUpdateUser } from '@/hooks'

export default function UserEditPage() {
    const { t } = useTranslation('pages')
    const { id } = useParams<{ id: string }>()
    const { data: user, isLoading } = useUser(id!)
    const updateUser = useUpdateUser('/users')

    return (
        <FormPage title={t('users.editTitle')} backLink="/users" isLoading={isLoading}>
            <UserForm
                defaultValues={user}
                onSubmit={(data) => updateUser.mutate({ id: id!, data })}
                isSubmitting={updateUser.isPending}
                isEdit
            />
        </FormPage>
    )
}
