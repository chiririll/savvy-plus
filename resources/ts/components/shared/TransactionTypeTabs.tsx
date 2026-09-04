import { useTranslation } from 'react-i18next'
import { TRANSACTION_TYPE_OPTIONS } from '@/constants'
import { SegmentedChoice } from './SegmentedChoice'

export type TransactionFormType = (typeof TRANSACTION_TYPE_OPTIONS)[number]['value']

interface TransactionTypeTabsProps {
    value: TransactionFormType
    onChange: (value: TransactionFormType) => void
}

export function TransactionTypeTabs({ value, onChange }: TransactionTypeTabsProps) {
    const { t } = useTranslation('pages')

    return (
        <SegmentedChoice
            value={value}
            onChange={onChange}
            options={TRANSACTION_TYPE_OPTIONS.map((option) => ({
                ...option,
                label: t(`transactions.types.${option.value}`),
            }))}
        />
    )
}
