import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createRecurringColumns, RecurringFormDialog } from '@/components/features/recurring'
import { useCreateRecurring, useDeleteRecurring, useRecurring, useUpdateRecurring, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { RecurringFormData } from '@/schemas'
import { RecurringTransaction } from '@/types'

export default function RecurringPage() {
    const { t } = useTranslation('pages')
    const { data: recurring, isLoading } = useRecurring()
    const deleteRecurring = useDeleteRecurring()
    const createRecurring = useCreateRecurring()
    const updateRecurring = useUpdateRecurring()
    const isReadOnly = useReadOnly()
    const items = recurring ?? []
    const form = useResourceFormDialog<RecurringTransaction, RecurringFormData>({
        items,
        isLoading,
        create: createRecurring,
        update: updateRecurring,
    })

    const columns = createRecurringColumns({
        onDelete: (id) => deleteRecurring.mutate(id),
        onEdit: form.openEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('recurring.title')}
                description={t('recurring.description')}
                createLabel={t('recurring.create')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <RecurringFormDialog
                recurring={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
