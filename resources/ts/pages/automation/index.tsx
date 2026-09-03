import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { ListPage } from '@/components/shared'
import { createAutomationColumns, AutomationRuleFormDialog } from '@/components/features/automation'
import {
    useAutomationRules,
    useCreateAutomationRule,
    useDeleteAutomationRule,
    useToggleAutomationRule,
    useUpdateAutomationRule,
} from '@/hooks/use-automation'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import type { AutomationRule, AutomationRuleFormData } from '@/types/automation'

export default function AutomationPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: rules, isLoading } = useAutomationRules()
    const deleteRule = useDeleteAutomationRule()
    const toggleRule = useToggleAutomationRule()
    const createRule = useCreateAutomationRule()
    const updateRule = useUpdateAutomationRule()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formRule, setFormRule] = useState<AutomationRule | null>(null)

    const items = rules ?? []

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormRule(null)
            setFormOpen(true)
            setSearchParams((prev) => {
                prev.delete('create')
                return prev
            }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    useEffect(() => {
        const editId = searchParams.get('edit')
        if (!editId) return

        const found = items.find((rule) => String(rule.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormRule(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormRule(null)
        setFormOpen(true)
    }

    const handleEdit = (rule: AutomationRule) => {
        setFormRule(rule)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: AutomationRuleFormData) => {
        if (formRule) {
            updateRule.mutate(
                { id: formRule.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createRule.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const columns = createAutomationColumns({
        onDelete: (id) => deleteRule.mutate(id),
        onToggle: (id) => toggleRule.mutate(id),
        onEdit: handleEdit,
        isReadOnly,
    })

    return (
        <>
            <ListPage
                title={t('automation.title')}
                description={t('automation.description')}
                createLabel={t('automation.create')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                data={items}
                columns={columns}
                isLoading={isLoading}
            />

            <AutomationRuleFormDialog
                rule={formRule}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createRule.isPending || updateRule.isPending}
            />
        </>
    )
}
