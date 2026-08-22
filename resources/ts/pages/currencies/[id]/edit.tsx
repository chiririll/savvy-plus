import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { CurrencyForm } from '@/components/features/currencies'
import { useCurrency, useUpdateCurrency, useSettings } from '@/hooks'

export default function CurrencyEditPage() {
    const { t } = useTranslation('pages')
    const { id } = useParams<{ id: string }>()
    const { data: currency, isLoading } = useCurrency(id!)
    const { data: settings } = useSettings()
    const updateCurrency = useUpdateCurrency('/currencies')

    return (
        <FormPage title={t('currencies.editTitle')} backLink="/currencies" isLoading={isLoading}>
            <CurrencyForm
                defaultValues={currency}
                onSubmit={(data) => updateCurrency.mutate({ id: id!, data })}
                isSubmitting={updateCurrency.isPending}
                isEditing
                autoUpdateEnabled={settings?.auto_update_currencies}
                isBase={currency?.isBase}
            />
        </FormPage>
    )
}
