import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { RecurringForm } from '@/components/features/recurring'
import { useCreateRecurring } from '@/hooks'

export default function RecurringCreatePage() {
    const { t } = useTranslation('pages')
    const createRecurring = useCreateRecurring('/recurring')

    return (
        <FormPage title={t('recurring.createTitle')} backLink="/recurring">
            <RecurringForm
                onSubmit={(data) => createRecurring.mutate(data)}
                isSubmitting={createRecurring.isPending}
                submitLabel="Create"
            />
        </FormPage>
    )
}
