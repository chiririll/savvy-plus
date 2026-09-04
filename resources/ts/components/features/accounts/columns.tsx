import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { RowActions } from '@/components/shared'
import { Account } from '@/types'
import { ACCOUNT_TYPE_CONFIG } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import i18n from '@/lib/i18n'

interface ColumnOptions {
    onDelete: (id: number) => void
    onEdit: (account: Account) => void
    isReadOnly?: boolean
}

export const createAccountColumns = ({
    onDelete,
    onEdit,
    isReadOnly,
}: ColumnOptions): ColumnDef<Account>[] => [
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
            <RowActions
                onEdit={() => onEdit(row.original)}
                onDelete={() => onDelete(row.original.id)}
                deleteTitle={i18n.t('pages:accounts.deleteTitle')}
                deleteDescription={i18n.t('pages:accounts.deleteDescription', { name: row.original.name })}
                isReadOnly={isReadOnly}
            />
        ),
    },
]
