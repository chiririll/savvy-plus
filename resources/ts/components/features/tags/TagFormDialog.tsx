import { useTranslation } from 'react-i18next'
import { EntityFormDialog } from '@/components/shared'
import { Tag } from '@/types'
import { TagFormData } from '@/schemas'
import { TagForm } from './TagForm'

const FORM_ID = 'tag-form'

interface TagFormDialogProps {
    tag?: Tag | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: TagFormData) => void
    isSubmitting?: boolean
}

export function TagFormDialog({
    tag,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: TagFormDialogProps) {
    const { t } = useTranslation('pages')

    return (
        <EntityFormDialog<Tag, TagFormData, TagFormData>
            entity={tag}
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            formId={FORM_ID}
            title={tag ? t('tags.editTitle') : t('tags.createTitle')}
            description={t('tags.description')}
            toFormValues={(item) => ({ name: item.name })}
        >
            {({ formKey, formProps }) => <TagForm key={formKey} {...formProps} />}
        </EntityFormDialog>
    )
}
