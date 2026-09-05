import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { schemaResolver } from '@/lib/form-resolver'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form'
import { transactionSchema, TransactionFormValues } from '@/schemas/transactions'
import { useAccounts, useCategories, useFormValuesChange, useTransactionPartyDefaults } from '@/hooks'
import { cn, formatCurrency, formatDateLocal, isDateInFuture } from '@/lib/utils'
import { Plus, Trash2, X } from 'lucide-react'
import {
    CategorySelect,
    FieldHelp,
    FormWrapper,
    MoneyAccountFields,
    TagSelect,
    TransactionTypeTabs,
} from '@/components/shared'

type BalancePreview = {
    currentBalance: number
    newBalance: number
    insufficientFunds?: boolean
    currency: Parameters<typeof formatCurrency>[1]
}

function BalancePair({ preview, label }: { preview: BalancePreview; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono">
                {formatCurrency(preview.currentBalance, preview.currency)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={cn(
                'font-mono',
                preview.insufficientFunds
                    ? 'text-destructive'
                    : preview.newBalance > preview.currentBalance && 'text-green-600'
            )}>
                {formatCurrency(preview.newBalance, preview.currency)}
            </span>
        </span>
    )
}

function TransactionBalanceHint({
    from,
    to,
    isPending,
    isUndated,
}: {
    from: BalancePreview | null
    to: BalancePreview | null
    isPending: boolean
    isUndated: boolean
}) {
    const { t } = useTranslation('forms')

    return (
        <div className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {isPending ? (
                <span className="text-muted-foreground">
                    {isUndated ? t('transactions.noDateHint') : t('transactions.pendingHint')}
                </span>
            ) : (
                <>
                    {from && <BalancePair preview={from} label={t('transactions.balance')} />}
                    {to && <BalancePair preview={to} label={t('transactions.toBalance')} />}
                    {from?.insufficientFunds && (
                        <span className="font-medium text-destructive">{t('transactions.insufficientFunds')}</span>
                    )}
                </>
            )}
        </div>
    )
}

const SOURCE_SIGN = { income: 1, expense: -1, transfer: -1 } as const

type BalanceImpact = {
    type?: keyof typeof SOURCE_SIGN
    amount: number
    accountId?: number | null
    toAccountId?: number | null
    toAmount?: number
}

function impactOn(
    accountId: number,
    tx: BalanceImpact,
    side: 'source' | 'destination',
): number {
    if (side === 'destination') {
        return tx.type === 'transfer' && tx.toAccountId === accountId
            ? (tx.toAmount ?? tx.amount)
            : 0
    }

    return tx.accountId === accountId && tx.type
        ? SOURCE_SIGN[tx.type] * tx.amount
        : 0
}

function projectedBalance(
    current: number,
    accountId: number,
    next: BalanceImpact,
    posted: BalanceImpact | null,
    side: 'source' | 'destination',
): number {
    return current
        - (posted ? impactOn(accountId, posted, side) : 0)
        + impactOn(accountId, next, side)
}

interface TransactionFormProps {
    defaultValues?: Partial<TransactionFormValues>
    onSubmit: (data: TransactionFormValues) => void
    onTypeChange?: (type: TransactionFormValues['type']) => void
    onValuesChange?: (data: TransactionFormValues) => void
    isSubmitting?: boolean
    submitLabel?: string
    formId?: string
    hideSubmit?: boolean
    isEdit?: boolean
    originalAffectsBalance?: boolean
    onPreviewChange?: (preview: ReactNode) => void
}

export function TransactionForm({
    defaultValues,
    onSubmit,
    onTypeChange,
    onValuesChange,
    isSubmitting,
    submitLabel,
    formId,
    hideSubmit,
    isEdit,
    originalAffectsBalance,
    onPreviewChange,
}: TransactionFormProps) {
    const { t } = useTranslation(['common', 'forms'])
    const { data: accounts } = useAccounts({ active: true, exclude_debts: true })
    const { data: categories } = useCategories()

    const formDefaults = useMemo(() => {
        const today = formatDateLocal()
        return {
            type: defaultValues?.type ?? 'expense' as const,
            account_id: defaultValues?.account_id ?? 0,
            to_account_id: defaultValues?.to_account_id ?? null,
            category_id: defaultValues?.category_id ?? null,
            amount: defaultValues?.amount ?? 0,
            to_amount: defaultValues?.to_amount ?? null,
            description: defaultValues?.description ?? '',
            date: defaultValues?.date !== undefined ? (defaultValues.date ?? '') : today,
            items: defaultValues?.items ?? [],
            tag_ids: defaultValues?.tag_ids ?? [],
        }
    }, [defaultValues])

    const form = useForm<TransactionFormValues>({
        resolver: schemaResolver<TransactionFormValues>(transactionSchema),
        defaultValues: formDefaults,
    })

    useFormValuesChange(form, onValuesChange)

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    })

    const transactionType = useWatch({ control: form.control, name: 'type' })
    const accountId = useWatch({ control: form.control, name: 'account_id' })
    const items = useWatch({ control: form.control, name: 'items' })
    const amount = useWatch({ control: form.control, name: 'amount' })
    const date = useWatch({ control: form.control, name: 'date' })
    const dateRequired = Boolean(originalAffectsBalance)
    const isPendingDate = !date || isDateInFuture(date)
    const toAccountId = useWatch({ control: form.control, name: 'to_account_id' })
    const toAmount = useWatch({ control: form.control, name: 'to_amount' })
    // Filter categories based on transaction type and sort by popularity
    const filteredCategories = useMemo(() => {
        return (categories?.filter(c => c.type === transactionType) ?? [])
            .sort((a, b) => (b.transactionsCount ?? 0) - (a.transactionsCount ?? 0))
    }, [categories, transactionType])

    useTransactionPartyDefaults(form, accounts, categories)

    // Calculate items total
    const itemsTotal = items?.reduce((sum, item) => {
        const qty = Number(item?.quantity) || 0
        const price = Number(item?.price_per_unit) || 0
        return sum + qty * price
    }, 0) ?? 0

    // Sync amount with items total
    useEffect(() => {
        if (items && items.length > 0 && itemsTotal > 0) {
            form.setValue('amount', itemsTotal, { shouldValidate: false })
        }
    }, [itemsTotal, items, form])

    // Reset category when type changes
    useEffect(() => {
        if (transactionType === 'transfer') {
            form.setValue('category_id', null)
        }
    }, [transactionType, form])

    // Refs for fast navigation
    const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map())

    const addItem = useCallback(() => {
        append({ name: '', quantity: 1, price_per_unit: 0 })
        // Focus on new row's name field after render
        setTimeout(() => {
            const inputs = document.querySelectorAll('[data-item-name]')
            const lastInput = inputs[inputs.length - 1] as HTMLInputElement
            lastInput?.focus()
        }, 0)
    }, [append])

    const handleKeyDown = useCallback((
        e: KeyboardEvent<HTMLInputElement>,
        index: number,
        field: 'name' | 'quantity' | 'price_per_unit'
    ) => {
        // Enter on last field of row or Tab on price adds new row
        if (e.key === 'Enter' && field === 'price_per_unit') {
            e.preventDefault()
            addItem()
        }

        // Backspace on empty name removes row
        if (e.key === 'Backspace' && field === 'name') {
            const value = (e.target as HTMLInputElement).value
            if (value === '' && fields.length > 1) {
                e.preventDefault()
                remove(index)
                // Focus previous row
                setTimeout(() => {
                    const inputs = document.querySelectorAll('[data-item-name]')
                    const prevInput = inputs[Math.max(0, index - 1)] as HTMLInputElement
                    prevInput?.focus()
                }, 0)
            }
        }

        // Arrow down - next row same field
        if (e.key === 'ArrowDown' && index < fields.length - 1) {
            e.preventDefault()
            const nextInput = document.querySelector(
                `[data-item-${field}][data-index="${index + 1}"]`
            ) as HTMLInputElement
            nextInput?.focus()
        }

        // Arrow up - previous row same field
        if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault()
            const prevInput = document.querySelector(
                `[data-item-${field}][data-index="${index - 1}"]`
            ) as HTMLInputElement
            prevInput?.focus()
        }
    }, [addItem, remove, fields.length])

    const selectedAccount = accounts?.find(a => a.id === Number(accountId))
    const selectedToAccount = accounts?.find(a => a.id === Number(toAccountId))
    const sameTransferCurrency = Boolean(
        selectedAccount
        && selectedToAccount
        && selectedAccount.currencyId === selectedToAccount.currencyId
    )

    useEffect(() => {
        if (transactionType === 'transfer' && sameTransferCurrency) {
            form.setValue('to_amount', amount ? Number(amount) : null, { shouldValidate: false })
        }
    }, [transactionType, sameTransferCurrency, amount, form])

    const original = useMemo((): BalanceImpact | null => {
        if (!isEdit || !originalAffectsBalance) return null
        return {
            type: defaultValues?.type,
            amount: Number(defaultValues?.amount) || 0,
            accountId: defaultValues?.account_id,
            toAccountId: defaultValues?.to_account_id ?? null,
            toAmount: Number(defaultValues?.to_amount) || Number(defaultValues?.amount) || 0,
        }
    }, [
        isEdit,
        originalAffectsBalance,
        defaultValues?.type,
        defaultValues?.amount,
        defaultValues?.account_id,
        defaultValues?.to_account_id,
        defaultValues?.to_amount,
    ])

    const nextImpact = useMemo((): BalanceImpact => ({
        type: transactionType,
        amount: Number(amount) || 0,
        accountId: Number(accountId) || null,
        toAccountId: Number(toAccountId) || null,
        toAmount: Number(toAmount) || Number(amount) || 0,
    }), [transactionType, amount, accountId, toAccountId, toAmount])

    const balancePreview = useMemo(() => {
        if (!selectedAccount) return null

        const currentBalance = selectedAccount.currentBalance
        const newBalance = projectedBalance(currentBalance, selectedAccount.id, nextImpact, original, 'source')
        const insufficientFunds = (transactionType === 'expense' || transactionType === 'transfer') && newBalance < 0

        return {
            currentBalance,
            newBalance,
            insufficientFunds,
            currency: selectedAccount.currency,
        }
    }, [selectedAccount, nextImpact, original, transactionType])

    const toBalancePreview = useMemo(() => {
        if (!selectedToAccount || transactionType !== 'transfer') return null

        const currentBalance = selectedToAccount.currentBalance
        const newBalance = projectedBalance(currentBalance, selectedToAccount.id, nextImpact, original, 'destination')

        return {
            currentBalance,
            newBalance,
            currency: selectedToAccount.currency,
        }
    }, [selectedToAccount, nextImpact, original, transactionType])

    const balanceHint = (
        <TransactionBalanceHint
            from={balancePreview}
            to={toBalancePreview}
            isPending={isPendingDate}
            isUndated={!date}
        />
    )

    useLayoutEffect(() => {
        onPreviewChange?.(balanceHint)
    }, [onPreviewChange, balancePreview, toBalancePreview, isPendingDate, date])

    return (
        <FormWrapper>
        <Form {...form}>
            <form
                id={formId}
                onSubmit={form.handleSubmit((data) => {
                    if (balancePreview?.insufficientFunds) {
                        return
                    }
                    if (dateRequired && !data.date) {
                        form.setError('date', { message: t('validation.dateRequired') })
                        return
                    }
                    onSubmit(data)
                })}
                className="space-y-6"
            >
                <TransactionTypeTabs
                    value={transactionType}
                    onChange={(value) => {
                        form.setValue('type', value)
                        onTypeChange?.(value)
                    }}
                />

                {!onPreviewChange && balanceHint}

                <MoneyAccountFields
                    control={form.control}
                    isTransfer={transactionType === 'transfer'}
                    accountId={accountId}
                    fromCurrencySymbol={selectedAccount?.currency?.symbol}
                    toCurrencySymbol={selectedToAccount?.currency?.symbol}
                    amountDisabled={Boolean(items && items.length > 0)}
                    toAmountReadOnly={sameTransferCurrency}
                />

                <div className="grid grid-cols-2 gap-4">
                    {transactionType !== 'transfer' && (
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>{t('fields.category')}</FormLabel>
                                    <CategorySelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        type={transactionType as 'income' | 'expense'}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="min-w-0">
                                <FormLabel className="gap-1.5">
                                    {t('fields.date')}
                                    {!dateRequired && (
                                        <FieldHelp>{t('forms:transactions.dateOptionalHelp')}</FieldHelp>
                                    )}
                                </FormLabel>
                                <div className="flex items-center gap-1">
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value || ''}
                                            required={dateRequired}
                                        />
                                    </FormControl>
                                    {!dateRequired && field.value && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0 text-muted-foreground"
                                            onClick={() => field.onChange('')}
                                            aria-label={t('actions.clear')}
                                            title={t('actions.clear')}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.description')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('forms:transactions.notesPlaceholder')}
                                    className="resize-none h-20"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tag_ids"
                    render={({ field }) => (
                        <TagSelect
                            value={field.value ?? []}
                            onChange={field.onChange}
                            asFormItem
                        />
                    )}
                />

                {/* Items (Expense only typically, but allow for Income) */}
                {transactionType !== 'transfer' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <FormLabel>{t('forms:transactions.items')}</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                            >
                                <Plus className="size-4 mr-1" />
                                {t('forms:transactions.addItem')}
                            </Button>
                        </div>

                        {fields.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-2 font-medium">{t('fields.name')}</th>
                                            <th className="text-left p-2 font-medium w-20">{t('forms:transactions.qty')}</th>
                                            <th className="text-left p-2 font-medium w-28">{t('forms:transactions.price')}</th>
                                            <th className="text-right p-2 font-medium w-24">{t('forms:transactions.total')}</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field, index) => {
                                            const qty = Number(items?.[index]?.quantity) || 0
                                            const price = Number(items?.[index]?.price_per_unit) || 0
                                            const total = qty * price

                                            return (
                                                <tr key={field.id} className="border-t">
                                                    <td className="p-1">
                                                        <Input
                                                            {...form.register(`items.${index}.name`)}
                                                            placeholder={t('forms:transactions.itemName')}
                                                            className="h-8 border-0 shadow-none focus-visible:ring-1"
                                                            data-item-name
                                                            data-index={index}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'name')}
                                                        />
                                                    </td>
                                                    <td className="p-1">
                                                        <Input
                                                            {...form.register(`items.${index}.quantity`)}
                                                            type="number"
                                                            step="1"
                                                            min={1}
                                                            placeholder="1"
                                                            className="h-8 border-0 shadow-none focus-visible:ring-1"
                                                            data-item-quantity
                                                            data-index={index}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                                        />
                                                    </td>
                                                    <td className="p-1">
                                                        <Input
                                                            {...form.register(`items.${index}.price_per_unit`)}
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            placeholder="0.00"
                                                            className="h-8 border-0 shadow-none focus-visible:ring-1"
                                                            data-item-price_per_unit
                                                            data-index={index}
                                                            onKeyDown={(e) => handleKeyDown(e, index, 'price_per_unit')}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-right font-mono text-muted-foreground">
                                                        {formatCurrency(total, selectedAccount?.currency, { showSymbol: false })}
                                                    </td>
                                                    <td className="p-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() => remove(index)}
                                                            className="text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot className="border-t bg-muted/30">
                                        <tr>
                                            <td colSpan={5} className="p-2 text-right font-medium">
                                                {t('forms:transactions.total')}:{' '}
                                                <span className="font-mono font-semibold">
                                                    {formatCurrency(itemsTotal, selectedAccount?.currency, { showSymbol: false })}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {fields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                                {t('forms:transactions.noItems')}
                            </p>
                        )}

                        <FormField
                            control={form.control}
                            name="items"
                            render={() => <FormMessage />}
                        />
                    </div>
                )}

                {!hideSubmit && (
                    <Button type="submit" disabled={isSubmitting || balancePreview?.insufficientFunds} className="w-full">
                        {isSubmitting ? t('actions.saving') : (submitLabel ?? t('actions.save'))}
                    </Button>
                )}
            </form>
        </Form>
        </FormWrapper>
    )
}
