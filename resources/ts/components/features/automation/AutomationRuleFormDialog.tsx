import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/shared'
import { useCreateFormDraft } from '@/hooks'
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

function toFormValues(rule: AutomationRule): Partial<AutomationRuleFormData> {
    return {
        name: rule.name,
        description: rule.description,
        trigger_type: rule.trigger_type,
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions,
        is_active: rule.is_active,
        stop_processing: rule.stop_processing,
    }
}

export function AutomationRuleFormDialog({
    rule,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: AutomationRuleFormDialogProps) {
    const { t } = useTranslation('pages')
    const isEdit = !!rule
    const { draft, onValuesChange, formKey } = useCreateFormDraft<AutomationRuleFormData>({
        enabled: !isEdit,
        open,
        isSubmitting,
        entityKey: rule?.id,
    })

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('automation.editTitle') : t('automation.createTitle')}
            description={t('automation.createDescription')}
            formId={FORM_ID}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
            className="sm:max-w-xl"
        >
            <AutomationRuleForm
                key={formKey}
                defaultValues={rule ? toFormValues(rule) : draft}
                onSubmit={onSubmit}
                onValuesChange={onValuesChange}
                isSubmitting={isSubmitting}
                formId={FORM_ID}
                hideSubmit
            />
        </FormDialog>
    )
}
