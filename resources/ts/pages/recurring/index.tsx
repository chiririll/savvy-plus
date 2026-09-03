import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ListPage } from '@/components/shared'
import { createRecurringColumns, RecurringFormDialog } from '@/components/features/recurring'
import { useCreateRecurring, useDeleteRecurring, useRecurring, useUpdateRecurring } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { RecurringFormData } from '@/schemas'
import { RecurringTransaction } from '@/types'

export default function RecurringPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: recurring, isLoading } = useRecurring()
    const deleteRecurring = useDeleteRecurring()
    const createRecurring = useCreateRecurring()
    const updateRecurring = useUpdateRecurring()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formRecurring, setFormRecurring] = useState<RecurringTransaction | null>(null)

    const items = recurring ?? []

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormRecurring(null)
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

        const found = items.find((item) => String(item.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormRecurring(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormRecurring(null)
        setFormOpen(true)
    }

    const handleEdit = (item: RecurringTransaction) => {
        setFormRecurring(item)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: RecurringFormData) => {
        if (formRecurring) {
            updateRecurring.mutate(
                { id: formRecurring.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createRecurring.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const columns = createRecurringColumns({
        onDelete: (id) => deleteRecurring.mutate(id),
        onEdit: handleEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('recurring.title')}
                description={t('recurring.description')}
                createLabel={t('recurring.create')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <RecurringFormDialog
                recurring={formRecurring}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createRecurring.isPending || updateRecurring.isPending}
            />
        </>
    )
}
