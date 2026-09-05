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
import { getTransactionSchema, TransactionFormValues } from '@/schemas/transactions'
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
const RATE_DECIMALS = 6

function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

function catalogTransferRate(fromRate?: number | null, toRate?: number | null): number | null {
    const from = Number(fromRate)
    const to = Number(toRate)
    if (!(from > 0) || !(to > 0)) return null
    return roundTo(from / to, RATE_DECIMALS)
}

function derivedTransferRate(amount: number, toAmount: number): number | null {
    if (!(amount > 0) || !(toAmount > 0)) return null
    return roundTo(toAmount / amount, RATE_DECIMALS)
}

function storedTransferRate(rate?: number | null): number | null {
    const value = Number(rate)
    return value > 0 ? roundTo(value, RATE_DECIMALS) : null
}

function resolveOpeningTransferRate(values?: Partial<TransactionFormValues>): number | null {
    if (values?.type && values.type !== 'transfer') return null
    return derivedTransferRate(Number(values?.amount) || 0, Number(values?.to_amount) || 0)
        ?? storedTransferRate(values?.exchange_rate)
}

function resolveTransferRate(options: {
    sameCurrency: boolean
    amount: number
    toAmount: number
    storedRate?: number | null
    fromRate?: number | null
    toRate?: number | null
}): number {
    if (options.sameCurrency) return 1
    return derivedTransferRate(options.amount, options.toAmount)
        ?? storedTransferRate(options.storedRate)
        ?? catalogTransferRate(options.fromRate, options.toRate)
        ?? 1
}

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
    open?: boolean
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
    open = true,
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
            exchange_rate: resolveOpeningTransferRate(defaultValues),
            description: defaultValues?.description ?? '',
            date: defaultValues?.date !== undefined ? (defaultValues.date ?? '') : today,
            items: defaultValues?.items ?? [],
            tag_ids: defaultValues?.tag_ids ?? [],
        }
    }, [defaultValues])

    const form = useForm<TransactionFormValues>({
        resolver: schemaResolver<TransactionFormValues>(
            getTransactionSchema({ rejectFutureDate: Boolean(originalAffectsBalance) }),
        ),
        defaultValues: formDefaults,
    })

    useFormValuesChange(
        form,
        onValuesChange
            ? (data) => onValuesChange({ ...data, exchange_rate: null })
            : undefined,
    )

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
    const today = formatDateLocal()
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
    const rateEditable = Boolean(
        transactionType === 'transfer'
        && selectedAccount
        && selectedToAccount
        && !sameTransferCurrency
    )
    const destDecimals = selectedToAccount?.currency?.decimals ?? 2
    const transferPairKey = `${accountId ?? ''}:${toAccountId ?? ''}`
    const lastTransferPairRef = useRef<string | null>(null)
    const editingRateRef = useRef(false)
    const skipRateFromAmountRef = useRef(false)
    const formDefaultsRef = useRef(formDefaults)
    formDefaultsRef.current = formDefaults

    useEffect(() => {
        if (!open) return
        lastTransferPairRef.current = null
        editingRateRef.current = false
        skipRateFromAmountRef.current = false
        form.reset(formDefaultsRef.current)
    }, [open, form])

    const applyReceiveFromRate = useCallback((rate: number) => {
        const sourceAmount = Number(form.getValues('amount')) || 0
        if (!(sourceAmount > 0) || !(rate > 0)) return
        skipRateFromAmountRef.current = true
        form.setValue('to_amount', roundTo(sourceAmount * rate, destDecimals), { shouldValidate: false })
    }, [form, destDecimals])

    const commitTransferRate = useCallback(() => {
        editingRateRef.current = false
        if (!rateEditable) return

        let rate = Number(form.getValues('exchange_rate'))
        if (!(rate > 0)) {
            const sourceAmount = Number(form.getValues('amount')) || 0
            const destAmount = Number(form.getValues('to_amount')) || 0
            rate = derivedTransferRate(sourceAmount, destAmount)
                ?? catalogTransferRate(selectedAccount?.currency?.rate, selectedToAccount?.currency?.rate)
                ?? 1
            form.setValue('exchange_rate', rate, { shouldValidate: false })
        }

        applyReceiveFromRate(rate)
    }, [rateEditable, form, selectedAccount?.currency?.rate, selectedToAccount?.currency?.rate, applyReceiveFromRate])

    useEffect(() => {
        if (transactionType !== 'transfer') {
            lastTransferPairRef.current = null
            return
        }

        if (!selectedAccount || !selectedToAccount) {
            return
        }

        const prevPair = lastTransferPairRef.current
        lastTransferPairRef.current = transferPairKey
        const pairChanged = prevPair !== null && prevPair !== transferPairKey
        const isInit = prevPair === null

        if (sameTransferCurrency) {
            form.setValue('exchange_rate', 1, { shouldValidate: false })
            form.setValue('to_amount', amount ? Number(amount) : null, { shouldValidate: false })
            return
        }

        if (pairChanged) {
            const rate = catalogTransferRate(selectedAccount.currency?.rate, selectedToAccount.currency?.rate) ?? 1
            form.setValue('exchange_rate', rate, { shouldValidate: false })
            applyReceiveFromRate(rate)
            return
        }

        if (isInit) {
            const sourceAmount = Number(amount) || 0
            const destAmount = Number(toAmount) || 0
            const rate = resolveTransferRate({
                sameCurrency: false,
                amount: sourceAmount,
                toAmount: destAmount,
                storedRate: defaultValues?.exchange_rate,
                fromRate: selectedAccount.currency?.rate,
                toRate: selectedToAccount.currency?.rate,
            })
            form.setValue('exchange_rate', rate, { shouldValidate: false })
            if (sourceAmount > 0 && !(destAmount > 0)) {
                applyReceiveFromRate(rate)
            }
            return
        }

        if (editingRateRef.current || skipRateFromAmountRef.current) {
            skipRateFromAmountRef.current = false
            return
        }

        const sourceAmount = Number(amount) || 0
        const destAmount = Number(toAmount) || 0
        if (sourceAmount > 0 && destAmount > 0) {
            const nextRate = derivedTransferRate(sourceAmount, destAmount)
            const currentRate = Number(form.getValues('exchange_rate'))
            if (nextRate && Math.abs((currentRate || 0) - nextRate) >= 1 / 10 ** RATE_DECIMALS / 2) {
                form.setValue('exchange_rate', nextRate, { shouldValidate: false })
            }
            return
        }

        if (sourceAmount > 0 && !(destAmount > 0)) {
            const currentRate = Number(form.getValues('exchange_rate'))
            const rate = currentRate > 0
                ? currentRate
                : catalogTransferRate(selectedAccount.currency?.rate, selectedToAccount.currency?.rate) ?? 1
            if (!(currentRate > 0)) {
                form.setValue('exchange_rate', rate, { shouldValidate: false })
            }
            applyReceiveFromRate(rate)
        }
    }, [
        transactionType,
        sameTransferCurrency,
        amount,
        toAmount,
        transferPairKey,
        selectedAccount,
        selectedToAccount,
        defaultValues?.exchange_rate,
        form,
        applyReceiveFromRate,
    ])

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
                    if (transactionType === 'transfer' && rateEditable) {
                        commitTransferRate()
                    }
                    const next = form.getValues()
                    onSubmit({
                        ...data,
                        to_amount: next.to_amount,
                        exchange_rate: next.exchange_rate,
                    })
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

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    {transactionType === 'transfer' && (
                        <FormField
                            control={form.control}
                            name="exchange_rate"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>
                                        {t('forms:transactions.transferRate')}
                                        {selectedAccount?.currency?.code && selectedToAccount?.currency?.code && (
                                            <span className="text-muted-foreground ml-1">
                                                ({selectedAccount.currency.code} → {selectedToAccount.currency.code})
                                            </span>
                                        )}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.000001"
                                            min={0}
                                            placeholder="1"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(event) => {
                                                editingRateRef.current = true
                                                field.onChange(event.target.value === '' ? null : Number(event.target.value))
                                            }}
                                            onFocus={() => {
                                                editingRateRef.current = true
                                            }}
                                            onBlur={() => {
                                                field.onBlur()
                                                commitTransferRate()
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault()
                                                    event.currentTarget.blur()
                                                }
                                            }}
                                            readOnly={!rateEditable}
                                            disabled={!rateEditable}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

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
                                            max={dateRequired ? today : undefined}
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
