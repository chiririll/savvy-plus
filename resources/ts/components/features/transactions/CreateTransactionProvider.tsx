import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCreateTransaction } from '@/hooks'
import { TransactionFormValues } from '@/schemas/transactions'
import { TransactionFormData } from '@/types'
import { TransactionFormDialog } from './TransactionFormDialog'

export type CreateTransactionDefaults = Partial<TransactionFormValues>

interface CreateTransactionContextValue {
    openCreate: (defaults?: CreateTransactionDefaults) => void
}

const CreateTransactionContext = createContext<CreateTransactionContextValue | null>(null)

export function CreateTransactionProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const navigate = useNavigate()
    const createTransaction = useCreateTransaction()
    const [open, setOpen] = useState(false)
    const [defaults, setDefaults] = useState<CreateTransactionDefaults>()

    const openCreate = useCallback((next?: CreateTransactionDefaults) => {
        setDefaults(next)
        setOpen(true)
    }, [])

    const handleSubmit = (data: TransactionFormValues) => {
        createTransaction.mutate(data as TransactionFormData, {
            onSuccess: () => {
                setOpen(false)
                if (location.pathname !== '/transactions') {
                    navigate('/transactions')
                }
            },
        })
    }

    const value = useMemo(() => ({ openCreate }), [openCreate])

    return (
        <CreateTransactionContext.Provider value={value}>
            {children}
            <TransactionFormDialog
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isSubmitting={createTransaction.isPending}
                defaultValues={defaults}
            />
        </CreateTransactionContext.Provider>
    )
}

export function useCreateTransactionDialog() {
    const context = useContext(CreateTransactionContext)
    if (!context) {
        throw new Error('useCreateTransactionDialog must be used within CreateTransactionProvider')
    }
    return context
}
