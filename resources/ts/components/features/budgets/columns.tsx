import { Link } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Budget } from '@/types'
import { formatCurrency } from '@/lib/utils'
import i18n from '@/lib/i18n'

export const createBudgetColumns = (
    onDelete: (id: number) => void,
    isReadOnly?: boolean
): ColumnDef<Budget>[] => [
    {
        accessorKey: 'name',
        header: () => i18n.t('pages:budgets.columns.budget'),
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.name}</p>
                <p className="text-xs text-muted-foreground">
                    {row.original.isGlobal
                        ? i18n.t('pages:budgets.allExpenses')
                        : row.original.categories.map(c => c.name).join(', ') || i18n.t('pages:budgets.noCategories')}
                </p>
            </div>
        ),
    },
    {
        accessorKey: 'amount',
        header: () => i18n.t('pages:budgets.columns.limit'),
        cell: ({ row }) => (
            <span className="font-mono font-medium">
                {formatCurrency(row.original.amount, row.original.currency)}
            </span>
        ),
    },
    {
        accessorKey: 'period',
        header: () => i18n.t('pages:budgets.columns.period'),
        cell: ({ row }) => (
            <Badge variant="outline">
                {i18n.t(`pages:budgets.periods.${row.original.period}`, { defaultValue: row.original.period })}
            </Badge>
        ),
    },
    {
        accessorKey: 'progress',
        header: () => i18n.t('pages:budgets.columns.progress'),
        cell: ({ row }) => {
            const progress = row.original.progress
            if (!progress) return null

            const isExceeded = progress.is_exceeded
            const percent = Math.min(progress.percent, 100)
            return (
                <div className="w-44 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>{i18n.t('pages:budgets.spent', { amount: formatCurrency(progress.spent, row.original.currency) })}</span>
                        <span className={isExceeded ? 'text-red-600 font-medium' : ''}>
                            {progress.percent.toFixed(0)}%
                        </span>
                    </div>
                    <Progress
                        value={percent}
                        className={`h-2 ${isExceeded ? '[&>div]:bg-red-500' : ''}`}
                    />
                    <p className="text-xs text-muted-foreground">
                        {isExceeded
                            ? i18n.t('pages:budgets.exceededBy', { amount: formatCurrency(progress.spent - row.original.amount, row.original.currency) })
                            : i18n.t('pages:budgets.remaining', { amount: formatCurrency(progress.remaining, row.original.currency) })}
                    </p>
                </div>
            )
        },
    },
    {
        accessorKey: 'isActive',
        header: () => i18n.t('pages:budgets.columns.status'),
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                {row.original.isActive
                    ? i18n.t('pages:budgets.status.active')
                    : i18n.t('pages:budgets.status.inactive')}
            </Badge>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link to={`/budgets/${row.original.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
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
                                <Trash2 className="mr-2 h-4 w-4" />
                                {i18n.t('actions.delete')}
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{i18n.t('pages:budgets.deleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {i18n.t('pages:budgets.deleteDescription')}
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
