import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks'
import { TransactionFormValues } from '@/schemas/transactions'
import { Transaction, TransactionFormData } from '@/types'
import { TransactionFormDialog } from './TransactionFormDialog'

export type CreateTransactionDefaults = Partial<TransactionFormValues>

interface TransactionFormContextValue {
    openCreate: (defaults?: CreateTransactionDefaults) => void
    openEdit: (transaction: Transaction) => void
}

const TransactionFormContext = createContext<TransactionFormContextValue | null>(null)

export function CreateTransactionProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const navigate = useNavigate()
    const createTransaction = useCreateTransaction()
    const updateTransaction = useUpdateTransaction()
    const [open, setOpen] = useState(false)
    const [defaults, setDefaults] = useState<CreateTransactionDefaults>()
    const [transaction, setTransaction] = useState<Transaction | null>(null)

    const openCreate = useCallback((next?: CreateTransactionDefaults) => {
        setTransaction(null)
        setDefaults(next)
        setOpen(true)
    }, [])

    const openEdit = useCallback((next: Transaction) => {
        setDefaults(undefined)
        setTransaction(next)
        setOpen(true)
    }, [])

    const handleSubmit = (data: TransactionFormValues) => {
        if (transaction) {
            updateTransaction.mutate(
                { id: transaction.id, data: data as TransactionFormData },
                { onSuccess: () => setOpen(false) }
            )
            return
        }

        createTransaction.mutate(data as TransactionFormData, {
            onSuccess: () => {
                setOpen(false)
                if (location.pathname !== '/transactions') {
                    navigate('/transactions')
                }
            },
        })
    }

    const value = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit])

    return (
        <TransactionFormContext.Provider value={value}>
            {children}
            <TransactionFormDialog
                transaction={transaction}
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isSubmitting={createTransaction.isPending || updateTransaction.isPending}
                defaultValues={defaults}
            />
        </TransactionFormContext.Provider>
    )
}

export function useTransactionFormDialog() {
    const context = useContext(TransactionFormContext)
    if (!context) {
        throw new Error('useTransactionFormDialog must be used within CreateTransactionProvider')
    }
    return context
}

export const useCreateTransactionDialog = useTransactionFormDialog
