import { useEffect, useId, useState, type FormEvent } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateLocal, isDateInFuture, isDateOverdue, parseDateKey } from '@/lib/dates'
import { intlLocale } from '@/lib/i18n'
import { Transaction } from '@/types'

type ApplyDateChoice = 'today' | 'original' | 'other'

interface ApplyDeferredDateDialogProps {
    transaction: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (date: string) => void
    isSubmitting?: boolean
}

function formatStoredDate(date: string): string {
    return parseDateKey(date).toLocaleDateString(intlLocale())
}

export function ApplyDeferredDateDialog({
    transaction,
    open,
    onOpenChange,
    onConfirm,
    isSubmitting,
}: ApplyDeferredDateDialogProps) {
    const { t } = useTranslation('pages')
    const { t: tCommon } = useTranslation('common')
    const groupId = useId()
    const originalDate = transaction?.date ?? null
    const originalIsUsable = Boolean(originalDate) && !isDateInFuture(originalDate)
    const today = formatDateLocal()
    const [choice, setChoice] = useState<ApplyDateChoice>('today')
    const [customDate, setCustomDate] = useState(today)

    useEffect(() => {
        if (!open) {
            return
        }

        setChoice('today')
        setCustomDate(formatDateLocal())
    }, [open, transaction?.id])

    const selectedDate = choice === 'today'
        ? today
        : choice === 'original'
            ? originalDate
            : customDate

    const canSubmit = Boolean(selectedDate)
        && !isDateInFuture(selectedDate)
        && !(choice === 'original' && !originalIsUsable)
        && !isSubmitting

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (!selectedDate || isDateInFuture(selectedDate)) {
            return
        }
        onConfirm(selectedDate)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>{t('transactions.applyTitle')}</DialogTitle>
                        <DialogDescription>{t('transactions.applyDescription')}</DialogDescription>
                    </DialogHeader>

                    <fieldset className="grid gap-3">
                        <legend className="sr-only">{t('transactions.applyDescription')}</legend>

                        <label className="flex items-start gap-3 rounded-md border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                            <input
                                type="radio"
                                name={groupId}
                                value="today"
                                checked={choice === 'today'}
                                onChange={() => setChoice('today')}
                                className="mt-1"
                            />
                            <span>
                                <span className="block text-sm font-medium">{t('transactions.applyToday')}</span>
                                <span className="text-xs text-muted-foreground">
                                    {formatStoredDate(formatDateLocal())}
                                </span>
                            </span>
                        </label>

                        {originalIsUsable ? (
                            <label className="flex items-start gap-3 rounded-md border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                                <input
                                    type="radio"
                                    name={groupId}
                                    value="original"
                                    checked={choice === 'original'}
                                    onChange={() => setChoice('original')}
                                    className="mt-1"
                                />
                                <span>
                                    <span className="block text-sm font-medium">
                                        {t(isDateOverdue(originalDate)
                                            ? 'transactions.applyOverdue'
                                            : 'transactions.applyOriginal')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatStoredDate(originalDate)}
                                    </span>
                                </span>
                            </label>
                        ) : null}

                        <label className="flex items-start gap-3 rounded-md border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                            <input
                                type="radio"
                                name={groupId}
                                value="other"
                                checked={choice === 'other'}
                                onChange={() => setChoice('other')}
                                className="mt-1"
                            />
                            <span className="grid min-w-0 flex-1 gap-2">
                                <span className="text-sm font-medium">{t('transactions.applyOther')}</span>
                                {choice === 'other' && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor={`${groupId}-custom`}>{tCommon('fields.date')}</Label>
                                        <Input
                                            id={`${groupId}-custom`}
                                            type="date"
                                            value={customDate}
                                            onChange={(event) => setCustomDate(event.target.value)}
                                            max={today}
                                            required
                                        />
                                    </div>
                                )}
                            </span>
                        </label>
                    </fieldset>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {tCommon('actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={!canSubmit}>
                            {isSubmitting ? tCommon('actions.saving') : tCommon('actions.confirm')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
