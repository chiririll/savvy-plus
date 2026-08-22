import { Link } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
import { User } from '@/types/users'
import { getUserAvatarUrl, getUserInitials } from '@/lib/avatar'
import i18n from '@/lib/i18n'

export const createUserColumns = (
    onDelete: (id: number) => void,
    currentUserId?: number,
    isReadOnly?: boolean
): ColumnDef<User>[] => [
    {
        accessorKey: 'name',
        header: () => i18n.t('pages:users.columns.user'),
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar className="size-10">
                    <AvatarImage src={getUserAvatarUrl(row.original)} alt={row.original.name} />
                    <AvatarFallback>{getUserInitials(row.original)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'email',
        header: () => i18n.t('pages:users.columns.email'),
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.email}</span>
        ),
    },
    {
        accessorKey: 'role',
        header: () => i18n.t('pages:users.columns.role'),
        cell: ({ row }) => (
            <span>{i18n.t(`roles.${row.original.role}`)}</span>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
            const isCurrentUser = currentUserId === row.original.id

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to={`/users/${row.original.id}/edit`}>
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
                                    disabled={isCurrentUser}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    {isCurrentUser ? "Can't delete yourself" : i18n.t('actions.delete')}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{i18n.t('pages:users.deleteTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {i18n.t('pages:users.deleteDescription', { name: row.original.name })}
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
