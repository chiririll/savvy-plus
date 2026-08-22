import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { AutomationRuleForm } from '@/components/features/automation'
import { useAutomationRuleById, useUpdateAutomationRule } from '@/hooks/use-automation'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditAutomationPage() {
    const { t } = useTranslation('pages')
    const { id } = useParams<{ id: string }>()
    const { data: rule, isLoading } = useAutomationRuleById(id!)
    const updateRule = useUpdateAutomationRule('/automation')

    if (isLoading) {
        return (
            <FormPage title={t('automation.editTitle')} backLink="/automation">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </FormPage>
        )
    }

    if (!rule) {
        return (
            <FormPage title={t('automation.editTitle')} backLink="/automation">
                <p className="text-muted-foreground">{t('automation.notFound')}</p>
            </FormPage>
        )
    }

    return (
        <FormPage
            title={t('automation.editTitle')}
            description={rule.name}
            backLink="/automation"
        >
            <AutomationRuleForm
                defaultValues={{
                    name: rule.name,
                    description: rule.description,
                    trigger_type: rule.trigger_type,
                    priority: rule.priority,
                    conditions: rule.conditions,
                    actions: rule.actions,
                    is_active: rule.is_active,
                    stop_processing: rule.stop_processing,
                }}
                onSubmit={(data) => updateRule.mutate({ id: id!, data })}
                isSubmitting={updateRule.isPending}
                submitLabel={t('common:actions.save')}
            />
        </FormPage>
    )
}
