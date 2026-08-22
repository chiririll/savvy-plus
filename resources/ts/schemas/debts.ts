import { z } from 'zod'
import i18n from '@/lib/i18n'

export const debtSchema = z.object({
    name: z.string()
        .min(1, i18n.t('validation.nameRequired'))
        .max(255, i18n.t('validation.maxChars', { count: 255 })),

    debt_type: z.enum(['i_owe', 'owed_to_me'], {
        required_error: i18n.t('validation.selectDebtType'),
    }),

    currency_id: z.coerce.number({
        required_error: i18n.t('validation.selectCurrency'),
    }).positive(i18n.t('validation.selectCurrency')),

    amount: z.coerce.number()
        .positive(i18n.t('validation.amountGreaterThanZero')),

    due_date: z.string().optional(),

    counterparty: z.string().max(255).optional(),

    description: z.string().max(1000).optional(),
})

export type DebtFormData = z.infer<typeof debtSchema>

export const debtPaymentSchema = z.object({
    account_id: z.coerce.number({
        required_error: i18n.t('validation.selectAccount'),
    }).positive(i18n.t('validation.selectAccount')),

    amount: z.coerce.number()
        .positive(i18n.t('validation.amountGreaterThanZero')),

    date: z.string().min(1, i18n.t('validation.dateRequired')),

    description: z.string().max(1000).optional(),
})

export type DebtPaymentFormData = z.infer<typeof debtPaymentSchema>
