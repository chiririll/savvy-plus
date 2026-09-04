import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createAutomationColumns, AutomationRuleFormDialog } from '@/components/features/automation'
import {
    useAutomationRules,
    useCreateAutomationRule,
    useDeleteAutomationRule,
    useToggleAutomationRule,
    useUpdateAutomationRule,
    useResourceFormDialog,
} from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import type { AutomationRule, AutomationRuleFormData } from '@/types/automation'

export default function AutomationPage() {
    const { t } = useTranslation('pages')
    const { data: rules, isLoading } = useAutomationRules()
    const deleteRule = useDeleteAutomationRule()
    const toggleRule = useToggleAutomationRule()
    const createRule = useCreateAutomationRule()
    const updateRule = useUpdateAutomationRule()
    const isReadOnly = useReadOnly()
    const items = rules ?? []
    const form = useResourceFormDialog<AutomationRule, AutomationRuleFormData>({
        items,
        isLoading,
        create: createRule,
        update: updateRule,
    })

    const columns = createAutomationColumns({
        onDelete: (id) => deleteRule.mutate(id),
        onToggle: (id) => toggleRule.mutate(id),
        onEdit: form.openEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('automation.title')}
                description={t('automation.description')}
                createLabel={t('automation.create')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <AutomationRuleFormDialog
                rule={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
