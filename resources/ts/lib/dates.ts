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
