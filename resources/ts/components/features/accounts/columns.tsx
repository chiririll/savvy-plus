import { Link } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Account } from '@/types'
import { ACCOUNT_TYPE_CONFIG } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import i18n from '@/lib/i18n'

export const createAccountColumns = (
    onDelete: (id: number) => void,
    isReadOnly?: boolean
): ColumnDef<Account>[] => [
    {
        accessorKey: 'name',
        header: () => i18n.t('pages:accounts.columns.account'),
        cell: ({ row }) => {
            const config = ACCOUNT_TYPE_CONFIG[row.original.type]
            const Icon = config.icon

            return (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.currency?.code ?? i18n.t('na')}
                        </p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'type',
        header: () => i18n.t('pages:accounts.columns.type'),
        cell: ({ row }) => {
            const config = ACCOUNT_TYPE_CONFIG[row.original.type]
            return (
                <Badge variant="secondary" className={config.color}>
                    {i18n.t(`pages:accounts.types.${row.original.type}`)}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'currentBalance',
        header: () => i18n.t('pages:accounts.columns.balance'),
        cell: ({ row }) => (
            <div className="font-mono text-right">
                <p className={row.original.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(row.original.currentBalance, row.original.currency)}
                </p>
                {row.original.initialBalance !== row.original.currentBalance && (
                    <p className="text-xs text-muted-foreground">
                        {i18n.t('pages:accounts.initial', {
                            amount: formatCurrency(row.original.initialBalance, row.original.currency),
                        })}
                    </p>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'isActive',
        header: () => i18n.t('pages:accounts.columns.status'),
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                {row.original.isActive
                    ? i18n.t('pages:accounts.status.active')
                    : i18n.t('pages:accounts.status.inactive')}
            </Badge>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link to={`/accounts/${row.original.id}/edit`}>
                            <Pencil className="mr-2 size-4" />
                            {i18n.t('actions.edit')}
                        </Link>
                    </DropdownMenuItem>
                    {!isReadOnly && (
                    <>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                {i18n.t('actions.delete')}
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{i18n.t('pages:accounts.deleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {i18n.t('pages:accounts.deleteDescription', { name: row.original.name })}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{i18n.t('actions.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(row.original.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {i18n.t('actions.delete')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
]
