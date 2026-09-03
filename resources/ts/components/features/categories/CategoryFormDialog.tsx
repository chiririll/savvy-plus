import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
import { CategoryFormData } from '@/schemas'
import { Category } from '@/types'
import { CategoryForm } from './CategoryForm'

const FORM_ID = 'category-form'

interface CategoryFormDialogProps {
    category?: Category | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: CategoryFormData) => void
    isSubmitting?: boolean
}

function toFormValues(category: Category): Partial<CategoryFormData> {
    return {
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
    }
}

export function CategoryFormDialog({
    category,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: CategoryFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!category
    const { draft, onValuesChange, formKey } = useCreateFormDraft<CategoryFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: category?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('categories.editTitle') : t('categories.createTitle')}
            description={t('categories.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <CategoryForm
                key={formKey}
                defaultValues={category ? toFormValues(category) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
