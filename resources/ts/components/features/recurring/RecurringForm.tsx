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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { recurringSchema, RecurringFormData } from '@/schemas'
import { useAccounts, useCategories, useTags } from '@/hooks'
import { Badge } from '@/components/ui/badge'
import { cn, formatDateLocal } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import { AccountSelect } from '@/components/shared/AccountSelect'
import { CategorySelect } from '@/components/shared/CategorySelect'
import { FormWrapper } from '@/components/shared/FormWrapper'

interface RecurringFormProps {
    defaultValues?: Partial<RecurringFormData>
    onSubmit: (data: RecurringFormData) => void
    onValuesChange?: (data: RecurringFormData) => void
    isSubmitting?: boolean
    submitLabel?: string
    formId?: string
    hideSubmit?: boolean
}

const typeOptions = [
    { value: 'income', icon: ArrowDownLeft, color: 'text-green-500' },
    { value: 'expense', icon: ArrowUpRight, color: 'text-red-500' },
    { value: 'transfer', icon: ArrowLeftRight, color: 'text-blue-500' },
] as const

const frequencyOptions = ['daily', 'weekly', 'monthly', 'yearly'] as const
const weekdayValues = [0, 1, 2, 3, 4, 5, 6] as const

export function RecurringForm({
    defaultValues,
    onSubmit,
    onValuesChange,
    isSubmitting,
    submitLabel,
    formId,
    hideSubmit,
}: RecurringFormProps) {
    const { t } = useTranslation(['common', 'forms', 'pages'])
    const { data: accounts } = useAccounts({ active: true, exclude_debts: true })
    const { data: categories } = useCategories()
    const { data: tags } = useTags()

    const form = useForm<RecurringFormData>({
        resolver: zodResolver(recurringSchema),
        defaultValues: {
            type: 'expense',
            account_id: 0,
            to_account_id: null,
            category_id: null,
            amount: 0,
            to_amount: null,
            description: '',
            frequency: 'monthly',
            interval: 1,
            day_of_week: new Date().getDay(),
            day_of_month: new Date().getDate(),
            start_date: formatDateLocal(),
            end_date: null,
            is_active: true,
            tag_ids: [],
            ...defaultValues,
        },
    })

    const type = form.watch('type')
    const frequency = form.watch('frequency')
    const selectedTagIds = form.watch('tag_ids') ?? []
    const accountId = form.watch('account_id')

    const isTransfer = type === 'transfer'
    const selectedAccount = accounts?.find(a => a.id === accountId)

    // Auto-select first account
    useEffect(() => {
        if (!accountId && accounts && accounts.length > 0) {
            form.setValue('account_id', accounts[0].id)
        }
    }, [accountId, accounts, form])

    // Auto-select most popular category
    useEffect(() => {
        const filteredCategories = categories?.filter(c => c.type === type) ?? []
        const sorted = [...filteredCategories].sort((a, b) =>
            (b.transactionsCount ?? 0) - (a.transactionsCount ?? 0)
        )
        const currentCategoryId = form.getValues('category_id')
        if (!currentCategoryId && type !== 'transfer' && sorted.length > 0) {
            form.setValue('category_id', sorted[0].id)
        }
    }, [type, categories, form])

    useEffect(() => {
        if (!onValuesChange) {
            return
        }

        const subscription = form.watch((value) => {
            onValuesChange(value as RecurringFormData)
        })

        return () => subscription.unsubscribe()
    }, [form, onValuesChange])

    return (
        <FormWrapper>
        <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Type Selection */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <Tabs
                                value={field.value}
                                onValueChange={(value) => {
                                    field.onChange(value)
                                    if (value === 'transfer') {
                                        form.setValue('category_id', null)
                                    } else {
                                        form.setValue('to_account_id', null)
                                        form.setValue('to_amount', null)
                                    }
                                }}
                                className="w-full"
                            >
                                <TabsList className="w-full">
                                    {typeOptions.map(({ value, icon: Icon, color }) => (
                                        <TabsTrigger key={value} value={value} className="flex-1">
                                            <Icon className={cn('size-4', field.value === value && color)} />
                                            {t(`pages:transactions.types.${value}`)}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="account_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isTransfer ? t('forms:fromAccount') : t('fields.account')}</FormLabel>
                                <AccountSelect
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isTransfer ? (
                        <FormField
                            control={form.control}
                            name="to_account_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.toAccount')}</FormLabel>
                                    <AccountSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        excludeId={accountId}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('fields.category')}</FormLabel>
                                    <CategorySelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        type={type as 'income' | 'expense'}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Amount */}
                <div className={cn('grid gap-4', isTransfer ? 'grid-cols-2' : 'grid-cols-1')}>
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('fields.amount')}
                                    {selectedAccount?.currency?.symbol && (
                                        <span className="text-muted-foreground ml-1">
                                            ({selectedAccount.currency.symbol})
                                        </span>
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isTransfer && (
                        <FormField
                            control={form.control}
                            name="to_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.toAmount')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={t('forms:recurring.toAmountPlaceholder')}
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                        />
                                    </FormControl>
                                    <FormDescription>{t('forms:recurring.toAmountHelp')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
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
                                    placeholder={t('forms:recurring.descriptionPlaceholder')}
                                    className="resize-none h-20"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Schedule Section */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">{t('forms:recurring.schedule')}</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.frequency')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {frequencyOptions.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {t(`forms:recurring.frequencies.${option}`)}
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
                            name="interval"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.every')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" max="365" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        {frequency === 'daily' && t('forms:recurring.days')}
                                        {frequency === 'weekly' && t('forms:recurring.weeks')}
                                        {frequency === 'monthly' && t('forms:recurring.months')}
                                        {frequency === 'yearly' && t('forms:recurring.years')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {frequency === 'weekly' && (
                        <FormField
                            control={form.control}
                            name="day_of_week"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.dayOfWeek')}</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(Number(val))}
                                        value={field.value?.toString() ?? ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('forms:selectDay')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {weekdayValues.map((value) => (
                                                <SelectItem key={value} value={value.toString()}>
                                                    {t(`forms:recurring.weekdays.${value}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {frequency === 'monthly' && (
                        <FormField
                            control={form.control}
                            name="day_of_month"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.dayOfMonth')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="31"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                        />
                                    </FormControl>
                                    <FormDescription>{t('forms:recurring.dayOfMonthHelp')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.startDate')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="end_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:recurring.endDate')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value || null)}
                                        />
                                    </FormControl>
                                    <FormDescription>{t('forms:recurring.endDateHelp')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Tags */}
                {tags && tags.length > 0 && (
                    <FormField
                        control={form.control}
                        name="tag_ids"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('forms:tags.label')}</FormLabel>
                                <div className="flex flex-wrap gap-2 p-3 rounded-md border">
                                    {tags.map((tag) => {
                                        const isSelected = selectedTagIds.includes(tag.id)
                                        return (
                                            <Badge
                                                key={tag.id}
                                                variant={isSelected ? 'default' : 'outline'}
                                                className={cn(
                                                    'cursor-pointer transition-colors',
                                                    isSelected ? 'hover:bg-primary/80' : 'hover:bg-muted'
                                                )}
                                                onClick={() => {
                                                    const newTagIds = isSelected
                                                        ? selectedTagIds.filter((id) => id !== tag.id)
                                                        : [...selectedTagIds, tag.id]
                                                    field.onChange(newTagIds)
                                                }}
                                            >
                                                #{tag.name}
                                            </Badge>
                                        )
                                    })}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Active */}
                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel>{t('fields.active')}</FormLabel>
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
