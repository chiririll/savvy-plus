import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface UseResourceMutationOptions<TData, TVariables> {
    mutationFn: (variables: TVariables) => Promise<TData>
    invalidateKeys?: QueryKey[]
    successMessage?: string | ((data: TData, variables: TVariables) => string)
    redirectTo?: string
    invalidateAll?: boolean
}

export function useResourceMutation<TData, TVariables>({
    mutationFn,
    invalidateKeys = [],
    successMessage,
    redirectTo,
    invalidateAll = false,
}: UseResourceMutationOptions<TData, TVariables>) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn,
        onSuccess: (data, variables) => {
            if (invalidateAll) {
                queryClient.invalidateQueries()
            } else {
                invalidateKeys.forEach((queryKey) => {
                    queryClient.invalidateQueries({ queryKey })
                })
            }

            if (successMessage) {
                toast.success(
                    typeof successMessage === 'function'
                        ? successMessage(data, variables)
                        : successMessage
                )
            }

            if (redirectTo) {
                navigate(redirectTo)
            }
        },
    })
}

export function useResourceItem<T>(
    queryKey: QueryKey,
    queryFn: () => Promise<T>,
    id: string | number,
) {
    return useQuery({
        queryKey: [...queryKey, id],
        queryFn,
        enabled: !!id,
    })
}
