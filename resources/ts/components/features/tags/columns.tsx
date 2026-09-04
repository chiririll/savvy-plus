import { ColumnDef } from '@tanstack/react-table'
import { Tag } from '@/types'
import { RowActions } from '@/components/shared'
import i18n from '@/lib/i18n'

export function createTagColumns(
    onDelete: (id: number) => void,
    isReadOnly?: boolean,
    onEdit?: (tag: Tag) => void
): ColumnDef<Tag>[] {
    return [
        {
            accessorKey: 'name',
            header: () => i18n.t('pages:tags.columns.name'),
            cell: ({ row }) => (
                <span className="font-medium">#{row.original.name}</span>
            ),
        },
        {
            accessorKey: 'transactionsCount',
            header: () => i18n.t('pages:tags.columns.transactions'),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.transactionsCount ?? 0}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <RowActions
                    onEdit={onEdit ? () => onEdit(row.original) : undefined}
                    onDelete={() => onDelete(row.original.id)}
                    deleteTitle={i18n.t('pages:tags.deleteTitle')}
                    deleteDescription={i18n.t('pages:tags.deleteDescription', { name: row.original.name })}
                    isReadOnly={isReadOnly}
                />
            ),
        },
    ]
}
