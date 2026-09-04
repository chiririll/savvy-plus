import { useEffect } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

export function useFormValuesChange<T extends FieldValues>(
    form: Pick<UseFormReturn<T>, 'watch'>,
    onValuesChange?: (data: T) => void,
) {
    useEffect(() => {
        if (!onValuesChange) {
            return
        }

        const subscription = form.watch((value) => {
            onValuesChange(value as T)
        })

        return () => subscription.unsubscribe()
    }, [form, onValuesChange])
}
