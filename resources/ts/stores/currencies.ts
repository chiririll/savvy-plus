import { create } from 'zustand'
import type { Currency } from '@/types'

interface CurrenciesState {
    byCode: Record<string, Currency>
    setAll: (currencies: Currency[]) => void
}

export const useCurrenciesStore = create<CurrenciesState>((set) => ({
    byCode: {},
    setAll: (currencies) =>
        set({
            byCode: Object.fromEntries(
                currencies.map((currency) => [currency.code.toUpperCase(), currency])
            ),
        }),
}))

export function getCurrency(code?: string | null): Currency | undefined {
    if (!code) {
        return undefined
    }

    return useCurrenciesStore.getState().byCode[code.trim().toUpperCase()]
}
