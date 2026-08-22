import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { CategoryForm } from '@/components/features/categories'
import { useCreateCategory } from '@/hooks'

export default function CategoryCreatePage() {
    const { t } = useTranslation('pages')
    const createCategory = useCreateCategory('/categories')

    return (
        <FormPage title={t('categories.createTitle')} backLink="/categories">
            <CategoryForm
                onSubmit={(data) => createCategory.mutate(data)}
                isSubmitting={createCategory.isPending}
                submitLabel="Create"
            />
        </FormPage>
    )
}
