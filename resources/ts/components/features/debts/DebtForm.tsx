import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import { getDebtSchema, DebtFormData } from '@/schemas'
import { useCurrencies, useAccounts } from '@/hooks'
import { AccountSelect } from '@/components/shared/AccountSelect'
import { CurrencySelect } from '@/components/shared/CurrencySelect'
import { Banknote, HandCoins } from 'lucide-react'
import { FieldHelp, FormDialogFooterStart, FormWrapper } from '@/components/shared'
import { cn, formatCurrency, formatDateLocal } from '@/lib/utils'

interface DebtFormProps {
    defaultValues?: Partial<DebtFormData>
    onSubmit: (data: DebtFormData) => void
    onValuesChange?: (data: DebtFormData) => void
    isSubmitting?: boolean
    submitLabel?: string
    formId?: string
    hideSubmit?: boolean
    mode?: 'create' | 'edit'
}

const DEBT_TYPES = [
    {
        value: 'i_owe',
        icon: Banknote,
        color: 'text-red-600'
    },
    {
        value: 'owed_to_me',
        icon: HandCoins,
        color: 'text-green-600'
    },
] as const

function today(): string {
    return formatDateLocal()
}

export function DebtForm({
    defaultValues,
    onSubmit,
    onValuesChange,
    isSubmitting,
    submitLabel,
    formId,
    hideSubmit,
    mode = 'create',
}: DebtFormProps) {
    const { t } = useTranslation(['common', 'forms', 'pages'])
    const { data: currencies } = useCurrencies()
    const { data: accounts } = useAccounts({ active: true, exclude_debts: true })

    const form = useForm<DebtFormData>({
        resolver: zodResolver(getDebtSchema(mode)),
        defaultValues: {
            origin: 'new',
            name: '',
            debt_type: 'i_owe',
            currency_id: 0,
            account_id: 0,
            date: today(),
            amount: 0,
            due_date: '',
            counterparty: '',
            description: '',
            ...defaultValues,
        },
    })

    const origin = form.watch('origin') ?? 'new'
    const debtType = form.watch('debt_type')
    const accountId = form.watch('account_id')
    const currencyId = form.watch('currency_id')
    const amount = Number(form.watch('amount')) || 0
    const selectedAccount = accounts?.find((account) => account.id === Number(accountId))
    const selectedCurrency = currencies?.find((currency) => currency.id === Number(currencyId))
    const insufficientFunds = mode === 'create'
        && origin === 'new'
        && debtType === 'owed_to_me'
        && !!selectedAccount
        && amount > selectedAccount.currentBalance

    useEffect(() => {
        if (!onValuesChange) {
            return
        }

        const subscription = form.watch((value) => {
            onValuesChange(value as DebtFormData)
        })

        return () => subscription.unsubscribe()
    }, [form, onValuesChange])

    const showAccount = mode === 'create' && origin === 'new'
    const showCurrency = mode === 'edit' || origin === 'existing'
    const amountCurrencySymbol = showAccount
        ? selectedAccount?.currency?.symbol
        : selectedCurrency?.symbol

    return (
        <FormWrapper>
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    {DEBT_TYPES.map(({ value, icon: Icon, color }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => form.setValue('debt_type', value)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                                debtType === value
                                    ? 'bg-background shadow-sm'
                                    : 'hover:bg-background/50'
                            )}
                        >
                            <Icon className={cn('size-4', debtType === value && color)} />
                            {t(`pages:debts.types.${value}`)}
                        </button>
                    ))}
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.name')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('forms:debts.namePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {mode === 'create' && (
                    <FormDialogFooterStart>
                        <FormField
                            control={form.control}
                            name="origin"
                            render={({ field }) => (
                                <label className="flex items-center gap-2 text-sm font-normal leading-none">
                                    <Checkbox
                                        checked={field.value === 'new'}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked === true ? 'new' : 'existing')
                                        }}
                                    />
                                    <span>{t('forms:debts.createTransaction')}</span>
                                    <FieldHelp>
                                        {field.value === 'existing'
                                            ? t('forms:debts.originExistingHelp')
                                            : t('forms:debts.originNewHelp')}
                                    </FieldHelp>
                                </label>
                            )}
                        />
                    </FormDialogFooterStart>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem className="min-w-0">
                                <FormLabel>
                                    {t('fields.amount')}
                                    {amountCurrencySymbol && (
                                        <span className="text-muted-foreground ml-1">
                                            ({amountCurrencySymbol})
                                        </span>
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        placeholder="1000.00"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className={insufficientFunds ? 'text-destructive' : undefined}>
                                    {insufficientFunds && selectedAccount
                                        ? t('forms:debts.insufficientFunds', {
                                            available: formatCurrency(selectedAccount.currentBalance, selectedAccount.currency),
                                        })
                                        : t('forms:debts.amountHelp')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {showAccount && (
                        <FormField
                            control={form.control}
                            name="account_id"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>
                                        {debtType === 'i_owe'
                                            ? t('forms:debts.payment.accountReceiveInto')
                                            : t('forms:debts.payment.accountPayFrom')}
                                    </FormLabel>
                                    <AccountSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {showCurrency && (
                        <FormField
                            control={form.control}
                            name="currency_id"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>{t('fields.currency')}</FormLabel>
                                    <CurrencySelect
                                        value={field.value ? { source: 'existing', id: Number(field.value) } : null}
                                        onChange={(next) => {
                                            if (next.source === 'existing') {
                                                field.onChange(next.id)
                                            }
                                        }}
                                        allowCatalog={false}
                                        placeholder={t('forms:selectCurrency')}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <FormField
                    control={form.control}
                    name="counterparty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('forms:debts.counterparty')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('forms:debts.counterpartyPlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('forms:debts.counterpartyHelp')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className={cn('grid gap-4', mode === 'create' && origin === 'new' && 'sm:grid-cols-2')}>
                    {mode === 'create' && origin === 'new' && (
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:debts.issuedDate')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('forms:debts.dueDate')}</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.description')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('forms:debts.notesPlaceholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!hideSubmit && (
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? t('actions.saving') : (submitLabel ?? t('actions.save'))}
                    </Button>
                )}
            </form>
        </Form>
        </FormWrapper>
    )
}
