import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
    FormDescription,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { debtSchema, DebtFormData } from '@/schemas'
import { useCurrencies } from '@/hooks'
import { Banknote, HandCoins } from 'lucide-react'
import { FormWrapper } from '@/components/shared/FormWrapper'

interface DebtFormProps {
    defaultValues?: Partial<DebtFormData>
    onSubmit: (data: DebtFormData) => void
    isSubmitting?: boolean
    submitLabel?: string
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

export function DebtForm({
    defaultValues,
    onSubmit,
    isSubmitting,
    submitLabel,
}: DebtFormProps) {
    const { t } = useTranslation(['common', 'forms', 'pages'])
    const { data: currencies, isLoading: currenciesLoading } = useCurrencies()

    const form = useForm<DebtFormData>({
        resolver: zodResolver(debtSchema),
        defaultValues: {
            name: '',
            debt_type: 'i_owe',
            currency_id: 0,
            amount: 0,
            due_date: '',
            counterparty: '',
            description: '',
            ...defaultValues,
        },
    })

    return (
        <FormWrapper>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
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

                <FormField
                    control={form.control}
                    name="debt_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.type')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('forms:selectDebtType')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {DEBT_TYPES.map((type) => {
                                        const Icon = type.icon
                                        return (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`size-4 ${type.color}`} />
                                                    <span>{t(`pages:debts.types.${type.value}`)}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {form.watch('debt_type') === 'i_owe'
                                    ? t('forms:debts.iOweHelp')
                                    : t('forms:debts.owedToMeHelp')
                                }
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="currency_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.currency')}</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value?.toString()}
                                disabled={currenciesLoading}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('forms:selectCurrency')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currencies?.map((currency) => (
                                        <SelectItem
                                            key={currency.id}
                                            value={currency.id.toString()}
                                        >
                                            <span className="font-mono">{currency.code}</span>
                                            <span className="text-muted-foreground ml-2">
                                                {currency.symbol} · {currency.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.amount')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="1000.00"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('forms:debts.amountHelp')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('forms:debts.dueDate')}</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('forms:debts.dueDateHelp')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? t('actions.saving') : (submitLabel ?? t('actions.save'))}
                </Button>
            </form>
        </Form>
        </FormWrapper>
    )
}
