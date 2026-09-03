import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCreateTransactionDialog } from '@/components/features/transactions'

const TRANSACTION_TYPES = [
    { type: 'income', icon: ArrowDownLeft, className: 'text-green-600' },
    { type: 'expense', icon: ArrowUpRight, className: 'text-red-600' },
    { type: 'transfer', icon: ArrowLeftRight, className: 'text-blue-600' },
] as const

export function CreateTransactionMenu() {
    const { t } = useTranslation('nav')
    const { openCreate } = useCreateTransactionDialog()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">{t('newTransaction')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {TRANSACTION_TYPES.map(({ type, icon: Icon, className }) => (
                    <DropdownMenuItem
                        key={type}
                        onClick={() => openCreate({ type })}
                    >
                        <Icon className={`size-4 mr-2 ${className}`} />
                        {t(type)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
