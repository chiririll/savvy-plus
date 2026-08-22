import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { CurrencyForm } from '@/components/features/currencies'
import { useCreateCurrency, useSettings } from '@/hooks'

export default function CurrencyCreatePage() {
    const { t } = useTranslation('pages')
    const { data: settings } = useSettings()
    const createCurrency = useCreateCurrency('/currencies')

    return (
        <FormPage title={t('currencies.createTitle')} backLink="/currencies">
            <CurrencyForm
                onSubmit={(data) => createCurrency.mutate(data)}
                isSubmitting={createCurrency.isPending}
                submitLabel="Create"
                autoUpdateEnabled={settings?.auto_update_currencies}
            />
        </FormPage>
    )
}
