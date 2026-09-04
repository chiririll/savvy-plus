import { useTranslation } from 'react-i18next'
import { EntityFormDialog } from '@/components/shared'
import { useSettings } from '@/hooks'
import { CurrencyFormData } from '@/schemas'
import { Currency } from '@/types'
import { CurrencyForm } from './CurrencyForm'

const FORM_ID = 'currency-form'

interface CurrencyFormDialogProps {
    currency?: Currency | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: CurrencyFormData) => void
    isSubmitting?: boolean
}

export function CurrencyFormDialog({
    currency,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: CurrencyFormDialogProps) {
    const { t } = useTranslation('pages')
    const { data: settings } = useSettings()

    return (
        <EntityFormDialog<Currency, CurrencyFormData, CurrencyFormData>
            entity={currency}
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            formId={FORM_ID}
            title={currency ? t('currencies.editTitle') : t('currencies.createTitle')}
            description={t('currencies.description')}
            toFormValues={(item) => ({
                code: item.code,
                name: item.name,
                symbol: item.symbol,
                decimals: item.decimals,
                rate: item.rate,
            })}
        >
            {({ formKey, formProps, isEdit }) => (
                <CurrencyForm
                    key={formKey}
                    defaultValues={formProps.defaultValues}
                    onSubmit={onSubmit}
                    onValuesChange={formProps.onValuesChange}
                    isSubmitting={formProps.isSubmitting}
                    formId={formProps.formId}
                    hideSubmit
                    isEditing={isEdit}
                    autoUpdateEnabled={settings?.auto_update_currencies}
                    isBase={currency?.isBase}
                />
            )}
        </EntityFormDialog>
    )
}
