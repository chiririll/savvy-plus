import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { User } from '@/types/users'
import { CreateUserFormData, UpdateUserFormData } from '@/schemas/users'
import { UserForm } from './UserForm'

const FORM_ID = 'user-form'

interface UserFormDialogProps {
    user?: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: CreateUserFormData | UpdateUserFormData) => void
    isSubmitting?: boolean
}

export function UserFormDialog({
    user,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: UserFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!user
    const { draft, onValuesChange, formKey } = useCreateFormDraft<CreateUserFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: user?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('users.editTitle') : t('users.createTitle')}
            description={isEdit ? t('users.editDescription') : t('users.createDescription')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <UserForm
                key={formKey}
                defaultValues={user
                    ? { id: user.id, name: user.name, email: user.email, role: user.role }
                    : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                isEdit={isEdit}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
