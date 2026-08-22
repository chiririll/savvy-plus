/** App locale for currency formatting. Replace with the UI language when i18n lands. */
const LOCALE = 'en-US'

type CurrencyInput = {
    code?: string | null
} | string | null | undefined

type FormatCurrencyOptions = {
    showSymbol?: boolean
}

function resolveCurrencyCode(currency: CurrencyInput): string | undefined {
    const raw = typeof currency === 'string' ? currency : currency?.code
    const code = raw?.trim().toUpperCase()

    return code && /^[A-Z]{3}$/.test(code) ? code : undefined
}

function formatWithIntl(
    value: number,
    currency: CurrencyInput,
    options?: FormatCurrencyOptions & { compact?: boolean }
): string {
    const code = resolveCurrencyCode(currency)
    const showSymbol = options?.showSymbol ?? true
    const compact = options?.compact ?? false

    try {
        if (code && showSymbol) {
            return new Intl.NumberFormat(LOCALE, {
                style: 'currency',
                currency: code,
                ...(compact
                    ? { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }
                    : {}),
            }).format(value)
        }

        if (code) {
            const digits = new Intl.NumberFormat(LOCALE, {
                style: 'currency',
                currency: code,
            }).resolvedOptions()

            return new Intl.NumberFormat(LOCALE, {
                style: 'decimal',
                minimumFractionDigits: compact ? 0 : digits.minimumFractionDigits,
                maximumFractionDigits: compact ? 1 : digits.maximumFractionDigits,
                ...(compact ? { notation: 'compact', compactDisplay: 'short' } : {}),
            }).format(value)
        }
    } catch {
        // Unknown or invalid ISO code — fall through to a plain number.
    }

    return new Intl.NumberFormat(LOCALE, {
        style: 'decimal',
        minimumFractionDigits: compact ? 0 : 2,
        maximumFractionDigits: compact ? 1 : 2,
        ...(compact ? { notation: 'compact', compactDisplay: 'short' } : {}),
    }).format(value)
}

export function formatCurrency(
    value: number,
    currency?: CurrencyInput,
    options?: FormatCurrencyOptions
): string {
    return formatWithIntl(value, currency, options)
}

export function formatCurrencyCompact(
    value: number,
    currency?: CurrencyInput,
    options?: FormatCurrencyOptions
): string {
    return formatWithIntl(value, currency, { ...options, compact: true })
}
