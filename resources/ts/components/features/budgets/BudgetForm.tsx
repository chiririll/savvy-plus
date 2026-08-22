import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { budgetSchema, BudgetFormData } from '@/schemas'
import { useCategories, useCurrencies, useTags } from '@/hooks'
import { Category } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FormWrapper } from '@/components/shared/FormWrapper'

interface BudgetFormProps {
    defaultValues?: Partial<BudgetFormData>
    onSubmit: (data: BudgetFormData) => void
    isSubmitting?: boolean
    submitLabel?: string
}

const periodOptions = ['weekly', 'monthly', 'yearly', 'one_time'] as const

export function BudgetForm({
    defaultValues,
    onSubmit,
    isSubmitting,
    submitLabel,
}: BudgetFormProps) {
    const { t } = useTranslation(['common', 'forms'])
    const { data: categories } = useCategories('expense')
    const { data: currencies } = useCurrencies()
    const { data: tags } = useTags()

    const form = useForm<BudgetFormData>({
        resolver: zodResolver(budgetSchema),
        defaultValues: {
            name: '',
            amount: 0,
            currency_id: null,
            period: 'monthly',
            start_date: null,
            end_date: null,
            is_global: false,
            notify_at_percent: null,
            is_active: true,
            category_ids: [],
            tag_ids: [],
            ...defaultValues,
        },
    })

    const selectedTagIds = form.watch('tag_ids') ?? []

    const isGlobal = form.watch('is_global')
    const period = form.watch('period')

    return (
        <FormWrapper>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.name')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('forms:budgets.namePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('forms:budgets.limit')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="30000"
                                        {...field}
                                    />
                                </FormControl>
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
                                    onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                                    value={field.value?.toString() ?? ''}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('forms:budgets.baseCurrency')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {currencies?.map((currency) => (
                                            <SelectItem key={currency.id} value={currency.id.toString()}>
                                                {currency.code} ({currency.symbol})
                                                {currency.isBase && ` — ${t('forms:budgets.baseSuffix')}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('forms:budgets.period')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('forms:selectPeriod')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {periodOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {t(`forms:budgets.periods.${option}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {period === 'one_time' && (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('forms:budgets.startDate')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value || ''}
                                        />
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
                                    <FormLabel>{t('forms:budgets.endDate')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="is_global"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>{t('forms:budgets.global')}</FormLabel>
                                <FormDescription>
                                    {t('forms:budgets.globalHelp')}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {!isGlobal && categories && categories.length > 0 && (
                    <FormField
                        control={form.control}
                        name="category_ids"
                        render={() => (
                            <FormItem>
                                <FormLabel>{t('forms:budgets.categories')}</FormLabel>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
                                    {categories.map((category: Category) => (
                                        <FormField
                                            key={category.id}
                                            control={form.control}
                                            name="category_ids"
                                            render={({ field }) => (
                                                <FormItem
                                                    key={category.id}
                                                    className="flex flex-row items-center space-x-2 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(category.id)}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value || []
                                                                if (checked) {
                                                                    field.onChange([...current, category.id])
                                                                } else {
                                                                    field.onChange(
                                                                        current.filter((id) => id !== category.id)
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                                                        <span
                                                            className="w-5 h-5 rounded flex items-center justify-center text-xs text-white"
                                                            style={{ backgroundColor: category.color }}
                                                        >
                                                            {category.icon}
                                                        </span>
                                                        {category.name}
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {tags && tags.length > 0 && (
                    <FormField
                        control={form.control}
                        name="tag_ids"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('forms:tags.label')}</FormLabel>
                                <FormDescription>
                                    {t('forms:budgets.tagsHelp')}
                                </FormDescription>
                                <div className="flex flex-wrap gap-2 p-3 rounded-md border">
                                    {tags.map((tag) => {
                                        const isSelected = selectedTagIds.includes(tag.id)
                                        return (
                                            <Badge
                                                key={tag.id}
                                                variant={isSelected ? 'default' : 'outline'}
                                                className={cn(
                                                    'cursor-pointer transition-colors',
                                                    isSelected
                                                        ? 'hover:bg-primary/80'
                                                        : 'hover:bg-muted'
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

                <FormField
                    control={form.control}
                    name="notify_at_percent"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('forms:budgets.notifyAt')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    placeholder={t('forms:budgets.notifyPlaceholder')}
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        field.onChange(val === '' ? null : Number(val))
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('forms:budgets.notifyHelp')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? t('actions.saving') : (submitLabel ?? t('actions.save'))}
                </Button>
            </form>
        </Form>
        </FormWrapper>
    )
}
