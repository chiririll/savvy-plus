import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    createUserSchema,
    updateUserSchema,
    CreateUserFormData,
    UpdateUserFormData,
} from '@/schemas/users'
import { useUser } from '@/stores/auth'
import { FormWrapper } from '@/components/shared/FormWrapper'

interface UserFormProps {
    defaultValues?: Partial<UpdateUserFormData> & { id?: number }
    onSubmit: (data: CreateUserFormData | UpdateUserFormData) => void
    isSubmitting?: boolean
    submitLabel?: string
    isEdit?: boolean
}

export function UserForm({
    defaultValues,
    onSubmit,
    isSubmitting,
    submitLabel,
    isEdit = false,
}: UserFormProps) {
    const { t } = useTranslation(['common', 'forms'])
    const currentUser = useUser()
    const isEditingSelf = isEdit && defaultValues?.id === currentUser?.id

    const form = useForm<CreateUserFormData | UpdateUserFormData>({
        resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'read-only',
            ...defaultValues,
        },
    })

    return (
        <FormWrapper>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.name')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('forms:users.namePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.email')}</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder={t('forms:users.emailPlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isEdit ? t('forms:users.newPassword') : t('fields.password')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder={isEdit ? t('forms:users.passwordKeepPlaceholder') : t('forms:users.passwordPlaceholder')}
                                        {...field}
                                    />
                                </FormControl>
                                {isEdit && (
                                    <FormDescription>
                                        {t('forms:users.passwordKeepHelp')}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fields.role')}</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isEditingSelf}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('forms:selectRole')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                                        <SelectItem value="read-write">{t('roles.read-write')}</SelectItem>
                                        <SelectItem value="read-only">{t('roles.read-only')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isEditingSelf && (
                                    <FormDescription>
                                        {t('forms:users.cannotChangeOwnRole')}
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? t('actions.saving') : (submitLabel ?? t('actions.save'))}
                    </Button>
                </form>
            </Form>
        </FormWrapper>
    )
}
