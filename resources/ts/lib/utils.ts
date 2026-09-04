import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export { formatCurrency, formatCurrencyCompact } from '@/lib/currency'
export { formatDateLocal, formatYearMonth, addDaysLocal, isDateInFuture } from '@/lib/dates'
export { toggleIdInArray } from '@/lib/ids'
