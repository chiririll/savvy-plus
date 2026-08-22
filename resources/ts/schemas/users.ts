import { z } from 'zod'
import i18n from '@/lib/i18n'

export const roleSchema = z.enum(['admin', 'read-write', 'read-only'])

export const createUserSchema = z.object({
    name: z.string().min(1, i18n.t('validation.nameRequired')).max(255),
    email: z.string().min(1, i18n.t('validation.emailRequired')).email(i18n.t('validation.emailInvalid')),
    password: z.string().min(8, i18n.t('validation.passwordMin8')),
    role: roleSchema.default('read-only'),
})

export const updateUserSchema = z.object({
    name: z.string().min(1, i18n.t('validation.nameRequired')).max(255),
    email: z.string().min(1, i18n.t('validation.emailRequired')).email(i18n.t('validation.emailInvalid')),
    password: z.string().min(8, i18n.t('validation.passwordMin8')).optional().or(z.literal('')),
    role: roleSchema.optional(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
