/** Parse an ISO date key (YYYY-MM-DD) without UTC timezone shift. */
export function parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, (month || 1) - 1, day || 1)
}

export function formatYearMonth(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

export function formatDateLocal(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function addDaysLocal(date: Date, days: number): string {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return formatDateLocal(next)
}

export function isDateInFuture(date?: string | null): boolean {
    if (!date) {
        return false
    }

    return date > formatDateLocal()
}

export function isDateOverdue(date?: string | null): boolean {
    return Boolean(date && date < formatDateLocal())
}

/** Overdue → red, within the next 3 days → yellow, later or unset → muted. */
export function pendingDateClassName(dateKey?: string | null): string {
    if (!dateKey) {
        return 'text-muted-foreground'
    }

    const today = formatDateLocal()
    if (dateKey < today) {
        return 'text-red-600'
    }
    if (dateKey <= addDaysLocal(new Date(), 3)) {
        return 'text-yellow-600'
    }
    return 'text-muted-foreground'
}
