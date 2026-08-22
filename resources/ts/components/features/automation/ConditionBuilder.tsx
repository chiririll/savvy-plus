import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2 } from 'lucide-react'
import type { Condition, ConditionGroup, ConditionOperator } from '@/types/automation'
import { CONDITION_FIELDS } from '@/types/automation'
import { useAccounts, useCategories, useTags } from '@/hooks'

interface ConditionBuilderProps {
    value: ConditionGroup
    onChange: (value: ConditionGroup) => void
}

const OPERATORS: Record<string, ConditionOperator[]> = {
    equals: ['equals', 'not_equals'],
    in: ['in', 'not_in'],
    gt: ['gt', 'gte', 'lt', 'lte', 'between'],
    contains: ['contains', 'not_contains', 'starts_with', 'ends_with', 'matches'],
    is_null: ['is_null', 'is_not_null'],
    has_any: ['has_any', 'has_all', 'has_none'],
}

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const

export function ConditionBuilder({ value, onChange }: ConditionBuilderProps) {
    const { t } = useTranslation(['forms', 'pages', 'common'])
    const { data: accounts } = useAccounts()
    const { data: categories } = useCategories()
    const { data: tags } = useTags()

    const addCondition = () => {
        onChange({
            ...value,
            conditions: [
                ...value.conditions,
                { field: 'type', op: 'equals', value: 'expense' },
            ],
        })
    }

    const updateCondition = (index: number, updates: Partial<Condition>) => {
        const newConditions = value.conditions.map((condition, i) =>
            i === index ? { ...condition, ...updates } : condition
        )
        onChange({ ...value, conditions: newConditions })
    }

    const removeCondition = (index: number) => {
        onChange({
            ...value,
            conditions: value.conditions.filter((_, i) => i !== index),
        })
    }

    const getOperatorsForField = (field: string): ConditionOperator[] => {
        const fieldConfig = CONDITION_FIELDS.find(f => f.value === field)
        if (!fieldConfig) return []

        return fieldConfig.operators.flatMap(op => OPERATORS[op] ?? [])
    }

    const renderValueInput = (condition: Condition, index: number) => {
        const { field, op } = condition

        if (op === 'is_null' || op === 'is_not_null') {
            return null
        }

        if (field === 'type') {
            if (op === 'in' || op === 'not_in') {
                return (
                    <div className="flex flex-wrap gap-1">
                        {TRANSACTION_TYPES.map(type => (
                            <Button
                                key={type}
                                type="button"
                                variant={(condition.value as string[])?.includes(type) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    const current = (condition.value as string[]) || []
                                    const newValue = current.includes(type)
                                        ? current.filter(v => v !== type)
                                        : [...current, type]
                                    updateCondition(index, { value: newValue })
                                }}
                            >
                                {t(`pages:transactions.types.${type}`)}
                            </Button>
                        ))}
                    </div>
                )
            }
            return (
                <Select
                    value={condition.value as string}
                    onValueChange={(val) => updateCondition(index, { value: val })}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TRANSACTION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                                {t(`pages:transactions.types.${type}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        if (field === 'account_id') {
            return (
                <Select
                    value={condition.value ? String(condition.value) : undefined}
                    onValueChange={(val) => updateCondition(index, { value: Number(val) })}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t('selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts?.map(account => (
                            <SelectItem key={account.id} value={String(account.id)}>
                                {account.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        if (field === 'category_id') {
            return (
                <Select
                    value={condition.value ? String(condition.value) : undefined}
                    onValueChange={(val) => updateCondition(index, { value: Number(val) })}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories?.map(category => (
                            <SelectItem key={category.id} value={String(category.id)}>
                                {category.icon} {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        if (field === 'tags') {
            return (
                <div className="flex flex-wrap gap-1">
                    {tags?.map(tag => (
                        <Button
                            key={tag.id}
                            type="button"
                            variant={(condition.value as number[])?.includes(tag.id) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                const current = (condition.value as number[]) || []
                                const newValue = current.includes(tag.id)
                                    ? current.filter(v => v !== tag.id)
                                    : [...current, tag.id]
                                updateCondition(index, { value: newValue })
                            }}
                        >
                            #{tag.name}
                        </Button>
                    ))}
                </div>
            )
        }

        if (field === 'amount') {
            if (op === 'between') {
                const [min, max] = (condition.value as [number, number]) || [0, 0]
                return (
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            className="w-24"
                            value={min}
                            onChange={(e) => updateCondition(index, { value: [Number(e.target.value), max] })}
                        />
                        <span className="text-muted-foreground">{t('automation.and')}</span>
                        <Input
                            type="number"
                            className="w-24"
                            value={max}
                            onChange={(e) => updateCondition(index, { value: [min, Number(e.target.value)] })}
                        />
                    </div>
                )
            }
            return (
                <Input
                    type="number"
                    className="w-32"
                    value={condition.value as number}
                    onChange={(e) => updateCondition(index, { value: Number(e.target.value) })}
                />
            )
        }

        return (
            <Input
                className="w-48"
                value={condition.value as string}
                onChange={(e) => updateCondition(index, { value: e.target.value })}
                placeholder={t('automation.enterValue')}
            />
        )
    }

    return (
        <div className="space-y-4">
            <Tabs
                value={value.match}
                onValueChange={(match) => onChange({ ...value, match: match as 'all' | 'any' })}
            >
                <TabsList>
                    <TabsTrigger value="all">{t('automation.matchAll')}</TabsTrigger>
                    <TabsTrigger value="any">{t('automation.matchAny')}</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="space-y-2">
                {value.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Select
                            value={condition.field}
                            onValueChange={(field) => {
                                const operators = getOperatorsForField(field)
                                updateCondition(index, {
                                    field,
                                    op: operators[0] || 'equals',
                                    value: null,
                                })
                            }}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CONDITION_FIELDS.map(field => (
                                    <SelectItem key={field.value} value={field.value}>
                                        {t(`automation.fields.${field.value}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={condition.op}
                            onValueChange={(op) => updateCondition(index, { op: op as ConditionOperator })}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {getOperatorsForField(condition.field).map(op => (
                                    <SelectItem key={op} value={op}>
                                        {t(`automation.operators.${op}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {renderValueInput(condition, index)}

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCondition(index)}
                        >
                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="size-4 mr-2" />
                {t('automation.addCondition')}
            </Button>
        </div>
    )
}
