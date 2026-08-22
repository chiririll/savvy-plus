import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { DebtForm } from '@/components/features/debts'
import { useCreateDebt } from '@/hooks'

export default function DebtCreatePage() {
    const { t } = useTranslation('pages')
    const createDebt = useCreateDebt('/debts')

    return (
        <FormPage title={t('debts.createTitle')} backLink="/debts">
            <DebtForm
                onSubmit={(data) => createDebt.mutate(data)}
                isSubmitting={createDebt.isPending}
                submitLabel={t('common:actions.create')}
            />
        </FormPage>
    )
}
