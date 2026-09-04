import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AutomationRule } from '@/types/automation'
import i18n from '@/lib/i18n'

interface ColumnOptions {
    onDelete: (id: number) => void
    onToggle: (id: number) => void
    onEdit: (rule: AutomationRule) => void
    isReadOnly?: boolean
}

export function createAutomationColumns({ onDelete, onToggle, onEdit, isReadOnly }: ColumnOptions): ColumnDef<AutomationRule>[] {
    return [
        {
            accessorKey: 'priority',
            header: () => i18n.t('pages:automation.columns.order'),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">{row.original.priority}</span>
            ),
            size: 50,
        },
        {
            accessorKey: 'name',
            header: () => i18n.t('pages:automation.columns.name'),
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    {row.original.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {row.original.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'trigger_type',
            header: () => i18n.t('pages:automation.columns.trigger'),
            cell: ({ row }) => (
                <Badge variant="outline">{i18n.t(`forms:automation.triggers.${row.original.trigger_type}`)}</Badge>
            ),
        },
        {
            accessorKey: 'conditions',
            header: () => i18n.t('pages:automation.columns.conditions'),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {i18n.t('pages:automation.conditionCount', { count: row.original.conditions.conditions.length })}
                </span>
            ),
        },
        {
            accessorKey: 'actions',
            header: () => i18n.t('pages:automation.columns.actions'),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {i18n.t('pages:automation.actionCount', { count: row.original.actions.length })}
                </span>
            ),
        },
        {
            accessorKey: 'runs_count',
            header: () => i18n.t('pages:automation.columns.runs'),
            cell: ({ row }) => (
                <span className="text-sm">{row.original.runs_count}</span>
            ),
        },
        {
            accessorKey: 'is_active',
            header: () => i18n.t('pages:automation.columns.active'),
            cell: ({ row }) => (
                <Switch
                    checked={row.original.is_active}
                    disabled={isReadOnly}
                    onCheckedChange={() => onToggle(row.original.id)}
                />
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(row.original)}>
                            <Pencil className="size-4 mr-2" />
                            {i18n.t('actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={`/automation/${row.original.id}/logs`}>
                                <History className="size-4 mr-2" />
                                {i18n.t('actions.viewLogs')}
                            </Link>
                        </DropdownMenuItem>
                        {!isReadOnly && (
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(row.original.id)}
                        >
                            <Trash2 className="size-4 mr-2" />
                            {i18n.t('actions.delete')}
                        </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]
}
