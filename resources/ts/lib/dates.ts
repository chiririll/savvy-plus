/** Parse an ISO date key (YYYY-MM-DD) without UTC timezone shift. */
export function parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, (month || 1) - 1, day || 1)
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

export function isDateInFuture(date: string): boolean {
    return date > formatDateLocal()
}
