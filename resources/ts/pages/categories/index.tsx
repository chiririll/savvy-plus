import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ListPage } from '@/components/shared'
import { CategoryFormDialog, createCategoryColumns } from '@/components/features/categories'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { Category } from '@/types'
import { CategoryFormData } from '@/schemas'

export default function CategoriesPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: categories, isLoading } = useCategories()
    const deleteCategory = useDeleteCategory()
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formCategory, setFormCategory] = useState<Category | null>(null)

    const items = categories ?? []

    const typeCounts = useMemo(() => ({
        income: items.filter(c => c.type === 'income').length,
        expense: items.filter(c => c.type === 'expense').length,
    }), [items])

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormCategory(null)
            setFormOpen(true)
            setSearchParams((prev) => {
                prev.delete('create')
                return prev
            }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    useEffect(() => {
        const editId = searchParams.get('edit')
        if (!editId) return

        const found = items.find((category) => String(category.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormCategory(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormCategory(null)
        setFormOpen(true)
    }

    const handleEdit = (category: Category) => {
        setFormCategory(category)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: CategoryFormData) => {
        if (formCategory) {
            updateCategory.mutate(
                { id: formCategory.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createCategory.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const columns = createCategoryColumns(
        (id) => deleteCategory.mutate(id),
        typeCounts,
        isReadOnly,
        handleEdit
    )

    return (
        <>
            <ListPage
                title={t('categories.title')}
                description={t('categories.description')}
                createLabel={t('categories.create')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <CategoryFormDialog
                category={formCategory}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createCategory.isPending || updateCategory.isPending}
            />
        </>
    )
}
