import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AccountSelect } from './AccountSelect'

interface MoneyAccountFieldsProps<T extends FieldValues> {
    control: Control<T>
    isTransfer: boolean
    accountId?: number | null
    fromCurrencySymbol?: string
    toCurrencySymbol?: string
    amountDisabled?: boolean
    toAmountReadOnly?: boolean
    toAmountPlaceholder?: string
}

export function MoneyAccountFields<T extends FieldValues>({
    control,
    isTransfer,
    accountId,
    fromCurrencySymbol,
    toCurrencySymbol,
    amountDisabled,
    toAmountReadOnly,
    toAmountPlaceholder,
}: MoneyAccountFieldsProps<T>) {
    const { t } = useTranslation(['common', 'forms'])

    return (
        <div className={isTransfer ? 'space-y-2' : undefined}>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={'amount' as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem className="min-w-0">
                            <FormLabel>
                                {isTransfer ? t('forms:transactions.sendAmount') : t('fields.amount')}
                                {fromCurrencySymbol && (
                                    <span className="text-muted-foreground ml-1">
                                        ({fromCurrencySymbol})
                                    </span>
                                )}
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    placeholder="0.00"
                                    {...field}
                                    disabled={amountDisabled}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={'account_id' as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem className="min-w-0">
                            <FormLabel>
                                {isTransfer ? t('forms:fromAccount') : t('fields.account')}
                            </FormLabel>
                            <AccountSelect
                                value={field.value}
                                onChange={field.onChange}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {isTransfer && (
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name={'to_amount' as FieldPath<T>}
                        render={({ field }) => (
                            <FormItem className="min-w-0">
                                <FormLabel>
                                    {t('forms:transactions.receiveAmount')}
                                    {toCurrencySymbol && (
                                        <span className="text-muted-foreground ml-1">
                                            ({toCurrencySymbol})
                                        </span>
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        placeholder={toAmountPlaceholder ?? '0.00'}
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                                        readOnly={toAmountReadOnly}
                                        disabled={toAmountReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name={'to_account_id' as FieldPath<T>}
                        render={({ field }) => (
                            <FormItem className="min-w-0">
                                <FormLabel>{t('forms:transactions.toAccount')}</FormLabel>
                                <AccountSelect
                                    value={field.value}
                                    onChange={field.onChange}
                                    excludeId={accountId ? Number(accountId) : undefined}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    )
}
