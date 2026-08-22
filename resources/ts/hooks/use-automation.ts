import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { automationApi } from '@/api/automation'
import type { AutomationRuleFormData } from '@/types/automation'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['automation-rules']

export function useAutomationRules() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => automationApi.getAll(),
    })
}

export function useAutomationRuleById(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => automationApi.getById(id),
        enabled: !!id,
    })
}

export function useAutomationTriggers() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'triggers'],
        queryFn: () => automationApi.getTriggers(),
        staleTime: Infinity,
    })
}

export function useAutomationRuleLogs(id: string | number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id, 'logs'],
        queryFn: () => automationApi.getLogs(id),
        enabled: !!id,
    })
}

export function useCreateAutomationRule(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: (data: AutomationRuleFormData) => automationApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.automation.created'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.automation.createFailed'))
        },
    })
}

export function useUpdateAutomationRule(redirectTo?: string) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Partial<AutomationRuleFormData> }) =>
            automationApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.automation.updated'))
            if (redirectTo) navigate(redirectTo)
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.automation.updateFailed'))
        },
    })
}

export function useDeleteAutomationRule() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => automationApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.automation.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.automation.deleteFailed'))
        },
    })
}

export function useToggleAutomationRule() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string | number) => automationApi.toggle(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(data.is_active ? i18n.t('toasts.automation.enabled') : i18n.t('toasts.automation.disabled'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.automation.toggleFailed'))
        },
    })
}

export function useReorderAutomationRules() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (rules: Array<{ id: number; priority: number }>) => automationApi.reorder(rules),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.automation.reordered'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.automation.reorderFailed'))
        },
    })
}

export function useTestAutomationRule() {
    return useMutation({
        mutationFn: ({ ruleId, transactionId }: { ruleId: string | number; transactionId: number }) =>
            automationApi.test(ruleId, transactionId),
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.automation.testFailed'))
        },
    })
}
