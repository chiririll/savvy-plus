import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { UserForm } from '@/components/features/users'
import { useCreateUser } from '@/hooks'

export default function UserCreatePage() {
    const { t } = useTranslation('pages')
    const createUser = useCreateUser('/users')

    return (
        <FormPage title={t('users.createTitle')} backLink="/users">
            <UserForm
                onSubmit={(data) => createUser.mutate(data)}
                isSubmitting={createUser.isPending}
                submitLabel={t('common:actions.create')}
            />
        </FormPage>
    )
}
