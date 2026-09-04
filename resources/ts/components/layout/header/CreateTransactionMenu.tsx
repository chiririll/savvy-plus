import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCreateTransactionDialog } from '@/components/features/transactions'
import { TRANSACTION_TYPE_OPTIONS } from '@/constants'

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
                {TRANSACTION_TYPE_OPTIONS.map(({ value, icon: Icon, color }) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => openCreate({ type: value })}
                    >
                        <Icon className={`size-4 mr-2 ${color}`} />
                        {t(value)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
