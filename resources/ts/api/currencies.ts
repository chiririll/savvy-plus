import { api } from './client'
import { createCrudApi } from './crud'
import { Currency, CurrencyCatalogItem } from '@/types'
import { CurrencyFormData } from '@/schemas'

const crud = createCrudApi<Currency, CurrencyFormData>('/currencies')

export const currenciesApi = {
    ...crud,

    getCatalog: () =>
        api.get<CurrencyCatalogItem[]>('/currencies/catalog'),

    setBase: (id: number | string) =>
        api.post<Currency>(`/currencies/${id}/set-base`),
}
