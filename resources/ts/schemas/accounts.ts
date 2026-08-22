import { z } from 'zod'
import i18n from '@/lib/i18n'

export const accountSchema = z.object({
    name: z.string()
        .min(1, i18n.t('validation.nameRequired'))
        .max(255, i18n.t('validation.maxChars', { count: 255 })),

    type: z.enum(['bank', 'crypto', 'cash'], {
        required_error: i18n.t('validation.selectAccountType'),
    }),

    currency_id: z.coerce.number({
        required_error: i18n.t('validation.selectCurrency'),
    }).positive(i18n.t('validation.selectCurrency')),

    initial_balance: z.coerce.number()
        .min(0, i18n.t('validation.balanceNegative'))
        .optional()
        .default(0),

    is_active: z.boolean().optional().default(true),
})

export type AccountFormData = z.infer<typeof accountSchema>
