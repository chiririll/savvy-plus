import { useTranslation } from 'react-i18next'
import { CATEGORY_TYPE_OPTIONS } from '@/constants/categories'
import { CategoryType } from '@/types'
import { SegmentedChoice } from '@/components/shared'

interface TypeSelectorProps {
    value: CategoryType
    onChange: (value: CategoryType) => void
    error?: string
}

export function TypeSelector({ value, onChange, error }: TypeSelectorProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{t('fields.type')}</label>
            <SegmentedChoice
                value={value}
                onChange={onChange}
                options={CATEGORY_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: t(`pages:categories.types.${option.value}`),
                    color: option.value === 'income' ? 'text-green-600' : 'text-red-600',
                }))}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}
