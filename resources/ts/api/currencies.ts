import { api } from './client'
import { createCrudApi } from './crud'
import { Currency, CurrencyCatalogItem, CurrencyFormData } from '@/types'

const crud = createCrudApi<Currency, CurrencyFormData>('/currencies')

export const currenciesApi = {
    ...crud,

    getCatalog: () =>
        api.get<CurrencyCatalogItem[]>('/currencies/catalog'),

    setBase: (id: number | string) =>
        api.post<Currency>(`/currencies/${id}/set-base`),
}
