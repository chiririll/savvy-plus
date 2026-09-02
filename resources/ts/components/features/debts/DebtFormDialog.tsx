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
import { Debt, DebtFormData } from '@/types'
import { DebtForm } from './DebtForm'

const FORM_ID = 'debt-form'

interface DebtFormDialogProps {
    debt?: Debt | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: DebtFormData) => void
    isSubmitting?: boolean
}

function toFormValues(debt: Debt): Partial<DebtFormData> {
    return {
        name: debt.name,
        debt_type: debt.debtType,
        currency_id: debt.currencyId,
        amount: debt.targetAmount,
        due_date: debt.dueDate ?? '',
        counterparty: debt.counterparty ?? '',
        description: debt.description ?? '',
    }
}

export function DebtFormDialog({
    debt,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: DebtFormDialogProps) {
    const { t } = useTranslation(['pages', 'common'])
    const isReadOnly = useReadOnly()
    const isEdit = !!debt

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('debts.editTitle') : t('debts.createTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('debts.description')}
                    </DialogDescription>
                </DialogHeader>

                <DebtForm
                    key={debt?.id ?? 'create'}
                    mode={isEdit ? 'edit' : 'create'}
                    defaultValues={debt ? toFormValues(debt) : undefined}
                    onSubmit={onSubmit}
                    isSubmitting={isSubmitting}
                    formId={FORM_ID}
                    hideSubmit
                />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common:actions.cancel')}
                    </Button>
                    {!isReadOnly && (
                        <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
                            {isSubmitting
                                ? t('common:actions.saving')
                                : isEdit
                                    ? t('common:actions.save')
                                    : t('common:actions.create')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
