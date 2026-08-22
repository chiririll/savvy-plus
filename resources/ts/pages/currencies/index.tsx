import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createCurrencyColumns } from '@/components/features/currencies'
import { useCurrencies, useDeleteCurrency, useSetBaseCurrency } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

export default function CurrenciesPage() {
    const { t } = useTranslation('pages')
    const { data: currencies, isLoading } = useCurrencies()
    const deleteCurrency = useDeleteCurrency()
    const setBaseCurrency = useSetBaseCurrency()
    const isReadOnly = useReadOnly()

    const columns = createCurrencyColumns({
        onDelete: (id) => deleteCurrency.mutate(id),
        onSetBase: (id) => setBaseCurrency.mutate(id),
        isSettingBase: setBaseCurrency.isPending,
        currencyCount: currencies?.length ?? 0,
        isReadOnly,
    })

    return (
        <ListPage
            title={t('currencies.title')}
            description={t('currencies.description')}
            createLink="/currencies/create"
            createLabel={t('currencies.create')}
            data={currencies ?? []}
            columns={columns}
            isLoading={isLoading}
        />
    )
}
