import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import i18n from '@/lib/i18n'
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
import { FormWrapper } from '@/components/shared/FormWrapper'

const tagSchema = z.object({
    name: z.string()
        .min(1, i18n.t('validation.nameRequired'))
        .max(50, i18n.t('validation.maxChars', { count: 50 }))
        .regex(/^[a-zA-Zа-яА-ЯёЁ0-9_-]+$/, i18n.t('validation.tagFormat')),
})

type TagFormValues = z.infer<typeof tagSchema>

interface TagFormProps {
    defaultValues?: Partial<TagFormValues>
    onSubmit: (data: TagFormValues) => void
    isSubmitting?: boolean
    submitLabel?: string
}

export function TagForm({
    defaultValues,
    onSubmit,
    isSubmitting,
    submitLabel,
}: TagFormProps) {
    const { t } = useTranslation(['common', 'forms'])
    const form = useForm<TagFormValues>({
        resolver: zodResolver(tagSchema),
        defaultValues: {
            name: defaultValues?.name ?? '',
        },
    })

    return (
        <FormWrapper>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('fields.name')}</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-lg">#</span>
                                    <Input
                                        placeholder={t('forms:tags.namePlaceholder')}
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                {t('forms:tags.nameHelp')}
                            </FormDescription>
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
