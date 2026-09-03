import { useCallback, useEffect, useRef, useState } from 'react'

export function useCreateFormDraft<T>({
    enabled,
    open,
    isSubmitting,
    entityKey,
}: {
    enabled: boolean
    open: boolean
    isSubmitting?: boolean
    entityKey?: string | number | null
}) {
    const draftRef = useRef<Partial<T> | undefined>(undefined)
    const [epoch, setEpoch] = useState(0)
    const wasSubmitting = useRef(false)

    const persistDraft = useCallback((values: T) => {
        if (enabled) {
            draftRef.current = values
        }
    }, [enabled])

    useEffect(() => {
        if (wasSubmitting.current && !isSubmitting && !open && enabled) {
            draftRef.current = undefined
            setEpoch((current) => current + 1)
        }
        wasSubmitting.current = !!isSubmitting
    }, [enabled, isSubmitting, open])

    return {
        draft: enabled ? draftRef.current : undefined,
        onValuesChange: enabled ? persistDraft : undefined,
        formKey: entityKey ?? `create-${epoch}`,
    }
}
