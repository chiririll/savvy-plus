import { ColumnDef } from '@tanstack/react-table'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RowActions } from '@/components/shared'
import { Currency } from '@/types'
import i18n from '@/lib/i18n'

interface ColumnOptions {
    onDelete: (id: number) => void
    onSetBase: (id: number) => void
    onEdit: (currency: Currency) => void
    isSettingBase?: boolean
    currencyCount: number
    isReadOnly?: boolean
}

export const createCurrencyColumns = ({
    onDelete,
    onSetBase,
    onEdit,
    isSettingBase,
    currencyCount,
    isReadOnly,
}: ColumnOptions): ColumnDef<Currency>[] => [
    {
        accessorKey: 'code',
        header: () => i18n.t('pages:currencies.columns.code'),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{row.original.code}</span>
                {row.original.isBase && (
                    <Badge variant="secondary" className="gap-1">
                        <Star className="size-3 fill-current" />
                        {i18n.t('pages:currencies.columns.base')}
                    </Badge>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'name',
        header: () => i18n.t('pages:currencies.columns.name'),
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.name}</p>
                <p className="text-xs text-muted-foreground">
                    Symbol: {row.original.symbol}
                </p>
            </div>
        ),
    },
    {
        accessorKey: 'rate',
        header: () => i18n.t('pages:currencies.columns.rate'),
        cell: ({ row }) => (
            <div className="font-mono">
                {row.original.isBase ? (
                    <span className="text-muted-foreground">1.000000</span>
                ) : (
                    <span>{row.original.rate.toFixed(6)}</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'decimals',
        header: () => i18n.t('pages:currencies.columns.decimals'),
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.decimals}</span>
        ),
    },
    {
        id: 'isBase',
        header: () => i18n.t('pages:currencies.columns.base'),
        cell: ({ row }) => (
            <Switch
                checked={row.original.isBase}
                disabled={row.original.isBase || isSettingBase || isReadOnly}
                onCheckedChange={() => onSetBase(row.original.id)}
            />
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            const isLast = currencyCount <= 1
            const cannotDelete = row.original.isBase || isLast

            return (
                <RowActions
                    onEdit={() => onEdit(row.original)}
                    onDelete={() => onDelete(row.original.id)}
                    deleteTitle={i18n.t('pages:currencies.deleteTitle')}
                    deleteDescription={i18n.t('pages:currencies.deleteDescription', { name: row.original.name })}
                    deleteDisabled={cannotDelete}
                    deleteDisabledLabel={isLast ? i18n.t('actions.cannotDeleteLast') : i18n.t('actions.delete')}
                    isReadOnly={isReadOnly}
                />
            )
        },
    },
]
