import { Wallet } from 'lucide-react'
import { useTotalBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function HeaderBalance() {
    const { data: balance, isLoading } = useTotalBalance()

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <Wallet className="size-4 text-muted-foreground" />
                <Skeleton className="h-4 w-20" />
            </div>
        )
    }

    if (!balance) return null

    return (
        <div className="flex items-center gap-2 text-sm">
            <Wallet className="size-4 text-muted-foreground" />
            <span className="font-mono font-medium">
                {formatCurrency(balance.total_balance ?? 0, balance.currency)}
            </span>
        </div>
    )
}
