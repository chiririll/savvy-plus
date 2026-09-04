import { z } from 'zod'
import i18n from '@/lib/i18n'
import { formatDateLocal } from '@/lib/dates'

export const transactionItemSchema = z.object({
    name: z.string().min(1, i18n.t('validation.nameRequired')).max(255),
    quantity: z.coerce.number().int(i18n.t('validation.integer')).min(1, i18n.t('validation.atLeastOne')),
    price_per_unit: z.coerce.number().min(0, i18n.t('validation.cannotBeNegative')),
})

export const transactionSchema = z.object({
    type: z.enum(['income', 'expense', 'transfer'], {
        required_error: i18n.t('validation.selectTransactionType'),
    }),

    account_id: z.coerce.number({
        required_error: i18n.t('validation.selectAccount'),
    }).positive(i18n.t('validation.selectAccount')),

    to_account_id: z.coerce.number().positive().optional().nullable(),

    category_id: z.coerce.number().positive().optional().nullable(),

    amount: z.coerce.number({
        required_error: i18n.t('validation.amountRequired'),
    }).positive(i18n.t('validation.amountPositive')),

    to_amount: z.coerce.number().positive().optional().nullable(),

    exchange_rate: z.coerce.number().positive().optional().nullable(),

    description: z.string().max(500).optional(),

    date: z.preprocess(
        (val) => val ?? formatDateLocal(),
        z.string().min(1, i18n.t('validation.dateRequired'))
    ),

    items: z.array(transactionItemSchema).optional(),

    tag_ids: z.array(z.number()).optional(),
}).superRefine((data, ctx) => {
    // Transfer requires to_account_id
    if (data.type === 'transfer' && !data.to_account_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t('validation.transferDestination'),
            path: ['to_account_id'],
        })
    }

    // Transfer should not have category
    if (data.type === 'transfer' && data.category_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t('validation.transferNoCategory'),
            path: ['category_id'],
        })
    }

    // Income/Expense should have category
    if (data.type !== 'transfer' && !data.category_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t('validation.selectCategory'),
            path: ['category_id'],
        })
    }

    // Validate items total matches amount (only if there are items with values)
    const items = data.items ?? []
    if (items.length > 0) {
        const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0)
        if (itemsTotal > 0 && Math.abs(itemsTotal - data.amount) > 0.01) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: i18n.t('validation.itemsTotalMismatch', {
                    itemsTotal: itemsTotal.toFixed(2),
                    amount: data.amount.toFixed(2),
                }),
                path: ['items'],
            })
        }
    }
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
export type TransactionItemFormValues = z.infer<typeof transactionItemSchema>
export type TransactionFormData = TransactionFormValues
export type TransactionItemFormData = TransactionItemFormValues
