import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ListPage } from '@/components/shared'
import { CurrencyFormDialog, createCurrencyColumns } from '@/components/features/currencies'
import { useCreateCurrency, useCurrencies, useDeleteCurrency, useSetBaseCurrency, useUpdateCurrency } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { CurrencyFormData } from '@/schemas'
import type { Currency } from '@/types'

export default function CurrenciesPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: currencies, isLoading } = useCurrencies()
    const deleteCurrency = useDeleteCurrency()
    const setBaseCurrency = useSetBaseCurrency()
    const createCurrency = useCreateCurrency()
    const updateCurrency = useUpdateCurrency()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formCurrency, setFormCurrency] = useState<Currency | null>(null)

    const items = currencies ?? []

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormCurrency(null)
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

        const found = items.find((currency) => String(currency.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormCurrency(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormCurrency(null)
        setFormOpen(true)
    }

    const handleEdit = (currency: Currency) => {
        setFormCurrency(currency)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: CurrencyFormData) => {
        if (formCurrency) {
            updateCurrency.mutate(
                { id: formCurrency.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createCurrency.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const columns = createCurrencyColumns({
        onDelete: (id) => deleteCurrency.mutate(id),
        onSetBase: (id) => setBaseCurrency.mutate(id),
        onEdit: handleEdit,
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
                onCreateClick={isReadOnly ? undefined : handleCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <CurrencyFormDialog
                currency={formCurrency}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createCurrency.isPending || updateCurrency.isPending}
            />
        </>
    )
}
