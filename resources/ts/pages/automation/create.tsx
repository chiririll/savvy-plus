import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { AutomationRuleForm } from '@/components/features/automation'
import { useCreateAutomationRule } from '@/hooks/use-automation'

export default function CreateAutomationPage() {
    const { t } = useTranslation('pages')
    const createRule = useCreateAutomationRule('/automation')

    return (
        <FormPage
            title={t('automation.createTitle')}
            description={t('automation.createDescription')}
            backLink="/automation"
        >
            <AutomationRuleForm
                onSubmit={createRule.mutate}
                isSubmitting={createRule.isPending}
                submitLabel={t('common:actions.create')}
            />
        </FormPage>
    )
}
