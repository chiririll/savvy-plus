import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft, useSettings } from '@/hooks'
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

function toFormValues(currency: Currency): Partial<CurrencyFormData> {
    return {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimals: currency.decimals,
        rate: currency.rate,
    }
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
    const isEdit = !!currency
    const { draft, onValuesChange, formKey } = useCreateFormDraft<CurrencyFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: currency?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('currencies.editTitle') : t('currencies.createTitle')}
            description={t('currencies.description')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
        >
            <CurrencyForm
                key={formKey}
                defaultValues={currency ? toFormValues(currency) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                isEditing={isEdit}
                autoUpdateEnabled={settings?.auto_update_currencies}
                isBase={currency?.isBase}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
