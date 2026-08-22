import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { accountSchema, AccountFormData } from '@/schemas'
import { useCurrencies } from '@/hooks'
import { REGULAR_ACCOUNT_TYPE_CONFIG, REGULAR_ACCOUNT_TYPES } from '@/constants'
import { cn } from '@/lib/utils'
import { FormWrapper } from '@/components/shared/FormWrapper'

interface AccountFormProps {
    defaultValues?: Partial<AccountFormData>
    onSubmit: (data: AccountFormData) => void
    isSubmitting?: boolean
    submitLabel?: string
}

export function AccountForm({
    defaultValues,
    onSubmit,
    isSubmitting,
    submitLabel,
}: AccountFormProps) {
    const { t } = useTranslation(['common', 'forms', 'pages'])
    const { data: currencies, isLoading: currenciesLoading } = useCurrencies()

    const form = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: '',
            type: 'bank',
            currency_id: 0,
            initial_balance: 0,
            is_active: true,
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
                                <Input placeholder={t('forms:namePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.type')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('forms:selectAccountType')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {REGULAR_ACCOUNT_TYPES.map((type) => {
                                        const config = REGULAR_ACCOUNT_TYPE_CONFIG[type]
                                        const Icon = config.icon
                                        return (
                                            <SelectItem key={type} value={type}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className={cn('size-4', config.textColor)} />
                                                    {t(`pages:accounts.types.${type}`)}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
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
                    name="initial_balance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('forms:accounts.initialBalance')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="0.00"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('forms:accounts.initialBalanceHelp')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">{t('fields.active')}</FormLabel>
                                <FormDescription>
                                    {t('forms:accounts.activeHelp')}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
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
