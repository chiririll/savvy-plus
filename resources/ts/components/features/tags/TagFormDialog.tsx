import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { Tag, TagFormData } from '@/types'
import { TagForm } from './TagForm'

const FORM_ID = 'tag-form'

interface TagFormDialogProps {
    tag?: Tag | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: TagFormData) => void
    isSubmitting?: boolean
}

function toFormValues(tag: Tag): Partial<TagFormData> {
    return {
        name: tag.name,
    }
}

export function TagFormDialog({
    tag,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: TagFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!tag
    const { draft, onValuesChange, formKey } = useCreateFormDraft<TagFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: tag?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('tags.editTitle') : t('tags.createTitle')}
            description={t('tags.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <TagForm
                key={formKey}
                defaultValues={tag ? toFormValues(tag) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
