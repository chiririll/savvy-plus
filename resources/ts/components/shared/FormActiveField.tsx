import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form'
import { FieldHelp } from './FieldHelp'
import { FormDialogFooterStart } from './FormDialog'

interface FormActiveFieldProps<T extends FieldValues> {
    control: Control<T>
    name?: FieldPath<T>
    help: string
}

export function FormActiveField<T extends FieldValues>({
    control,
    name = 'is_active' as FieldPath<T>,
    help,
}: FormActiveFieldProps<T>) {
    const { t } = useTranslation('common')

    return (
        <FormDialogFooterStart>
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm font-normal leading-none">
                        <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                        />
                        <span>{t('fields.active')}</span>
                        <FieldHelp>{help}</FieldHelp>
                    </label>
                )}
            />
        </FormDialogFooterStart>
    )
}
