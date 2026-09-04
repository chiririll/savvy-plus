import type { ReactNode } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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

interface RowActionsProps {
    onEdit?: () => void
    onDelete?: () => void
    deleteTitle?: string
    deleteDescription?: string
    deleteDisabled?: boolean
    deleteDisabledLabel?: string
    isReadOnly?: boolean
    leading?: ReactNode
    children?: ReactNode
}

export function RowActions({
    onEdit,
    onDelete,
    deleteTitle,
    deleteDescription,
    deleteDisabled,
    deleteDisabledLabel,
    isReadOnly,
    leading,
    children,
}: RowActionsProps) {
    const { t } = useTranslation()
    const canDelete = Boolean(onDelete) && !isReadOnly

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {leading}
                {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="mr-2 size-4" />
                        {t('actions.edit')}
                    </DropdownMenuItem>
                )}
                {children}
                {canDelete && (
                    <>
                        {(onEdit || leading || children) && <DropdownMenuSeparator />}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                    disabled={deleteDisabled}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    {deleteDisabled
                                        ? (deleteDisabledLabel ?? t('actions.delete'))
                                        : t('actions.delete')}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{deleteTitle ?? t('actions.delete')}</AlertDialogTitle>
                                    {deleteDescription && (
                                        <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
                                    )}
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {t('actions.delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
