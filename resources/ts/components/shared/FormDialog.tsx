import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

interface FormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    formId: string
    isSubmitting?: boolean
    isEdit?: boolean
    children: React.ReactNode
}

export function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    formId,
    isSubmitting,
    isEdit = false,
    children,
}: FormDialogProps) {
    const { t } = useTranslation('common')
    const isReadOnly = useReadOnly()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4 pr-12 border-b">
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                <DialogFooter className="shrink-0 px-6 py-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('actions.cancel')}
                    </Button>
                    {!isReadOnly && (
                        <Button type="submit" form={formId} disabled={isSubmitting}>
                            {isSubmitting
                                ? t('actions.saving')
                                : isEdit
                                    ? t('actions.save')
                                    : t('actions.create')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
