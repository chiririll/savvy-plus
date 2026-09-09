import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { ListPage } from '@/components/shared'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryFormDialog, createCategoryColumns } from '@/components/features/categories'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { Category, CategoryType } from '@/types'
import { CategoryFormData } from '@/schemas'

const categoryTypeParam = parseAsStringLiteral(['income', 'expense'] as const).withDefault('expense')

export default function CategoriesPage() {
    const { t } = useTranslation('pages')
    const [type, setType] = useQueryState('type', categoryTypeParam)
    const { data: categories, isLoading } = useCategories()
    const deleteCategory = useDeleteCategory()
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()
    const isReadOnly = useReadOnly()
    const items = categories ?? []
    const visibleItems = useMemo(
        () => items.filter((category) => category.type === type),
        [items, type],
    )
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
                data={visibleItems}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={type === 'income' ? t('categories.emptyIncomeTitle') : t('categories.emptyExpenseTitle')}
                emptyDescription={type === 'income' ? t('categories.emptyIncomeDescription') : t('categories.emptyExpenseDescription')}
                toolbar={(
                    <Tabs
                        value={type}
                        onValueChange={(value) => {
                            void setType(value as CategoryType)
                        }}
                        className="w-full max-w-full"
                    >
                        <TabsList className="grid h-auto w-full grid-cols-2 sm:inline-flex sm:h-9 sm:w-fit">
                            <TabsTrigger value="income" className="min-w-0">
                                {t('categories.tabs.income')}
                            </TabsTrigger>
                            <TabsTrigger value="expense" className="min-w-0">
                                {t('categories.tabs.expenses')}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            />

            <CategoryFormDialog
                category={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
                defaultType={type}
            />
        </>
    )
}
