import { useTranslation } from 'react-i18next'
import { EntityFormDialog } from '@/components/shared'
import type { AutomationRule, AutomationRuleFormData } from '@/types/automation'
import { AutomationRuleForm } from './AutomationRuleForm'

const FORM_ID = 'automation-rule-form'

interface AutomationRuleFormDialogProps {
    rule?: AutomationRule | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: AutomationRuleFormData) => void
    isSubmitting?: boolean
}

export function AutomationRuleFormDialog({
    rule,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: AutomationRuleFormDialogProps) {
    const { t } = useTranslation('pages')

    return (
        <EntityFormDialog
            entity={rule}
            open={open}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            formId={FORM_ID}
            title={rule ? t('automation.editTitle') : t('automation.createTitle')}
            description={t('automation.createDescription')}
            className="sm:max-w-xl"
            toFormValues={(item) => ({
                name: item.name,
                description: item.description,
                trigger_type: item.trigger_type,
                priority: item.priority,
                conditions: item.conditions,
                actions: item.actions,
                is_active: item.is_active,
                stop_processing: item.stop_processing,
            })}
        >
            {({ formKey, formProps }) => <AutomationRuleForm key={formKey} {...formProps} />}
        </EntityFormDialog>
    )
}
