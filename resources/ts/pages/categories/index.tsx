import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { CategoryFormDialog, createCategoryColumns } from '@/components/features/categories'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { Category } from '@/types'
import { CategoryFormData } from '@/schemas'

export default function CategoriesPage() {
    const { t } = useTranslation('pages')
    const { data: categories, isLoading } = useCategories()
    const deleteCategory = useDeleteCategory()
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()
    const isReadOnly = useReadOnly()
    const items = categories ?? []
    const form = useResourceFormDialog<Category, CategoryFormData>({
        items,
        isLoading,
        create: createCategory,
        update: updateCategory,
    })

    const typeCounts = useMemo(() => ({
        income: items.filter((category) => category.type === 'income').length,
        expense: items.filter((category) => category.type === 'expense').length,
    }), [items])

    const columns = createCategoryColumns(
        (id) => deleteCategory.mutate(id),
        typeCounts,
        isReadOnly,
        form.openEdit
    )

    return (
        <>
            <ListPage
                title={t('categories.title')}
                description={t('categories.description')}
                createLabel={t('categories.create')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <CategoryFormDialog
                category={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
