import { useCallback, useEffect, useRef, useState } from 'react'
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
    const createDraftRef = useRef<Partial<DebtFormData> | undefined>(undefined)
    const [createEpoch, setCreateEpoch] = useState(0)
    const wasSubmitting = useRef(false)

    const persistCreateDraft = useCallback((values: DebtFormData) => {
        if (!debt) {
            createDraftRef.current = values
        }
    }, [debt])

    useEffect(() => {
        if (wasSubmitting.current && !isSubmitting && !open && !debt) {
            createDraftRef.current = undefined
            setCreateEpoch((epoch) => epoch + 1)
        }
        wasSubmitting.current = !!isSubmitting
    }, [isSubmitting, open, debt])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4 pr-12 border-b">
                    <DialogTitle>
                        {isEdit ? t('debts.editTitle') : t('debts.createTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('debts.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    <DebtForm
                        key={debt?.id ?? `create-${createEpoch}`}
                        mode={isEdit ? 'edit' : 'create'}
                        defaultValues={debt ? toFormValues(debt) : createDraftRef.current}
                        onSubmit={onSubmit}
                        onValuesChange={isEdit ? undefined : persistCreateDraft}
                        isSubmitting={isSubmitting}
                        formId={FORM_ID}
                        hideSubmit
                    />
                </div>

                <DialogFooter className="shrink-0 px-6 py-4 border-t">
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
