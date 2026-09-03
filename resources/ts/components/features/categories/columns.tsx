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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row.original)}>
                                <Pencil className="mr-2 size-4" />
                                {i18n.t('actions.edit')}
                            </DropdownMenuItem>
                        )}
                        {!isReadOnly && (
                        <>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isLastOfType}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    {isLastOfType ? i18n.t('actions.cannotDeleteLast') : i18n.t('actions.delete')}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{i18n.t('pages:categories.deleteTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {i18n.t('pages:categories.deleteDescription', { name: row.original.name })}
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
            )
        },
    },
]
