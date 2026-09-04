import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { RowActions } from '@/components/shared'
import { Category } from '@/types'
import i18n from '@/lib/i18n'

export const createCategoryColumns = (
    onDelete: (id: number) => void,
    typeCounts: { income: number; expense: number },
    isReadOnly?: boolean,
    onEdit?: (category: Category) => void
): ColumnDef<Category>[] => [
    {
        accessorKey: 'name',
        header: () => i18n.t('pages:categories.columns.category'),
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div
                    className="flex items-center justify-center size-10 rounded-lg text-lg"
                    style={{ backgroundColor: row.original.color }}
                >
                    {row.original.icon}
                </div>
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                        {i18n.t(`pages:categories.types.${row.original.type}`)}
                    </p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'type',
        header: () => i18n.t('pages:categories.columns.type'),
        cell: ({ row }) => (
            <Badge
                variant="secondary"
                className={
                    row.original.type === 'income'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                }
            >
                {i18n.t(`pages:categories.types.${row.original.type}`)}
            </Badge>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            const isLastOfType = typeCounts[row.original.type] <= 1

            return (
                <RowActions
                    onEdit={onEdit ? () => onEdit(row.original) : undefined}
                    onDelete={() => onDelete(row.original.id)}
                    deleteTitle={i18n.t('pages:categories.deleteTitle')}
                    deleteDescription={i18n.t('pages:categories.deleteDescription', { name: row.original.name })}
                    deleteDisabled={isLastOfType}
                    deleteDisabledLabel={i18n.t('actions.cannotDeleteLast')}
                    isReadOnly={isReadOnly}
                />
            )
        },
    },
]
