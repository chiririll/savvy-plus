import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAutomationRuleById, useAutomationRuleLogs } from '@/hooks/use-automation'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function AutomationLogsPage() {
    const { t } = useTranslation('pages')
    const { id } = useParams<{ id: string }>()
    const { data: rule, isLoading: ruleLoading } = useAutomationRuleById(id!)
    const { data: logs, isLoading: logsLoading } = useAutomationRuleLogs(id!)

    if (ruleLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/automation">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <PageHeader
                    title={t('automation.logsTitle', { name: rule?.name ?? t('automation.logsFallbackName') })}
                    description={t('automation.logsDescription')}
                />
            </div>

            {logsLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : logs && logs.length > 0 ? (
                <div className="space-y-2">
                    {logs.map(log => (
                        <div
                            key={log.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            log.status === 'success'
                                                ? 'default'
                                                : log.status === 'error'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                    >
                                        {t(`automation.logsStatus.${log.status}`)}
                                    </Badge>
                                    {log.trigger_entity_type && (
                                        <span className="text-sm text-muted-foreground">
                                            {t('automation.logsEntity', { type: log.trigger_entity_type, id: log.trigger_entity_id })}
                                        </span>
                                    )}
                                </div>
                                {log.error_message && (
                                    <p className="text-sm text-destructive">{log.error_message}</p>
                                )}
                                {log.actions_executed && log.actions_executed.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {t('automation.logsActions', {
                                            actions: log.actions_executed
                                                .map(a => t(`forms:automation.actionTypes.${a.type}`, { defaultValue: a.type }))
                                                .join(', '),
                                        })}
                                    </p>
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    {t('automation.logsEmpty')}
                </div>
            )}
        </div>
    )
}
