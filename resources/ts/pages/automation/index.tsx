import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createAutomationColumns } from '@/components/features/automation'
import { useAutomationRules, useDeleteAutomationRule, useToggleAutomationRule } from '@/hooks/use-automation'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'

export default function AutomationPage() {
    const { t } = useTranslation('pages')
    const { data: rules, isLoading } = useAutomationRules()
    const deleteRule = useDeleteAutomationRule()
    const toggleRule = useToggleAutomationRule()
    const isReadOnly = useReadOnly()

    const columns = createAutomationColumns({
        onDelete: (id) => deleteRule.mutate(id),
        onToggle: (id) => toggleRule.mutate(id),
        isReadOnly,
    })

    return (
        <ListPage
            title={t('automation.title')}
            description={t('automation.description')}
            createLink="/automation/create"
            createLabel={t('automation.create')}
            data={rules ?? []}
            columns={columns}
            isLoading={isLoading}
        />
    )
}
