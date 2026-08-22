import { ColumnDef } from '@tanstack/react-table'
import { Tag } from '@/types'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import i18n from '@/lib/i18n'

export function createTagColumns(
    onDelete: (id: number) => void,
    isReadOnly?: boolean
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
            cell: ({ row }) => {
                const tag = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link to={`/tags/${tag.id}/edit`}>
                                    <Pencil className="mr-2 size-4" />
                                    {i18n.t('actions.edit')}
                                </Link>
                            </DropdownMenuItem>
                            {!isReadOnly && (
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
                                        <AlertDialogTitle>{i18n.t('pages:tags.deleteTitle')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {i18n.t('pages:tags.deleteDescription', { name: tag.name })}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{i18n.t('actions.cancel')}</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(tag.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {i18n.t('actions.delete')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}
