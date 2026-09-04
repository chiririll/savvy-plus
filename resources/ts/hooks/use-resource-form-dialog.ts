import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

interface ResourceMutation<TVariables> {
    mutate: (variables: TVariables, options?: { onSuccess?: () => void }) => void
    isPending: boolean
}

export function useResourceFormDialog<
    TEntity extends { id: string | number },
    TForm,
>({
    items,
    isLoading = false,
    create,
    update,
    syncSearchParams = true,
}: {
    items: TEntity[]
    isLoading?: boolean
    create?: ResourceMutation<TForm>
    update?: ResourceMutation<{ id: string | number; data: Partial<TForm> }>
    syncSearchParams?: boolean
}) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [open, setOpen] = useState(false)
    const [entity, setEntity] = useState<TEntity | null>(null)

    useEffect(() => {
        if (!syncSearchParams) {
            return
        }

        if (searchParams.get('create') === '1') {
            setEntity(null)
            setOpen(true)
            setSearchParams((prev) => {
                prev.delete('create')
                return prev
            }, { replace: true })
        }
    }, [searchParams, setSearchParams, syncSearchParams])

    useEffect(() => {
        if (!syncSearchParams) {
            return
        }

        const editId = searchParams.get('edit')
        if (!editId) {
            return
        }

        const found = items.find((item) => String(item.id) === editId)
        if (!found && isLoading) {
            return
        }

        if (found) {
            setEntity(found)
            setOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams, syncSearchParams])

    const close = () => setOpen(false)

    return {
        open,
        setOpen,
        entity,
        isEdit: !!entity,
        isSubmitting: Boolean(create?.isPending || update?.isPending),
        openCreate: () => {
            setEntity(null)
            setOpen(true)
        },
        openEdit: (item: TEntity) => {
            setEntity(item)
            setOpen(true)
        },
        submit: (formData: TForm) => {
            if (entity) {
                update?.mutate(
                    { id: entity.id, data: formData },
                    { onSuccess: close },
                )
                return
            }

            create?.mutate(formData, { onSuccess: close })
        },
    }
}
