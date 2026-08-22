import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createRecurringColumns } from '@/components/features/recurring'
import { useRecurring, useDeleteRecurring, useSkipRecurring } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

export default function RecurringPage() {
    const { t } = useTranslation('pages')
    const { data: recurring, isLoading } = useRecurring()
    const deleteRecurring = useDeleteRecurring()
    const skipRecurring = useSkipRecurring()
    const isReadOnly = useReadOnly()

    const columns = createRecurringColumns({
        onDelete: (id) => deleteRecurring.mutate(id),
        onSkip: (id) => skipRecurring.mutate(id),
        isReadOnly,
    })

    return (
        <ListPage
            title={t('recurring.title')}
            description={t('recurring.description')}
            createLink="/recurring/create"
            createLabel={t('recurring.create')}
            data={recurring ?? []}
            columns={columns}
            isLoading={isLoading}
        />
    )
}
