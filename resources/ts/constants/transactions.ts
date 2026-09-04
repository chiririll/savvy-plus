import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'

export const TRANSACTION_TYPE_OPTIONS = [
    { value: 'income', icon: ArrowDownLeft, color: 'text-green-600' },
    { value: 'expense', icon: ArrowUpRight, color: 'text-red-600' },
    { value: 'transfer', icon: ArrowLeftRight, color: 'text-blue-600' },
] as const

export const TRANSACTION_TYPES = TRANSACTION_TYPE_OPTIONS.map((option) => option.value)
