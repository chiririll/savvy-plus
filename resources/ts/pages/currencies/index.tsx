import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { CurrencyFormDialog, createCurrencyColumns } from '@/components/features/currencies'
import { useCreateCurrency, useCurrencies, useDeleteCurrency, useSetBaseCurrency, useUpdateCurrency, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { CurrencyFormData } from '@/schemas'
import type { Currency } from '@/types'

export default function CurrenciesPage() {
    const { t } = useTranslation('pages')
    const { data: currencies, isLoading } = useCurrencies()
    const deleteCurrency = useDeleteCurrency()
    const setBaseCurrency = useSetBaseCurrency()
    const createCurrency = useCreateCurrency()
    const updateCurrency = useUpdateCurrency()
    const isReadOnly = useReadOnly()
    const items = currencies ?? []
    const form = useResourceFormDialog<Currency, CurrencyFormData>({
        items,
        isLoading,
        create: createCurrency,
        update: updateCurrency,
    })

    const columns = createCurrencyColumns({
        onDelete: (id) => deleteCurrency.mutate(id),
        onSetBase: (id) => setBaseCurrency.mutate(id),
        onEdit: form.openEdit,
        isSettingBase: setBaseCurrency.isPending,
        currencyCount: items.length,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('currencies.title')}
                description={t('currencies.description')}
                createLabel={t('currencies.create')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <CurrencyFormDialog
                currency={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
