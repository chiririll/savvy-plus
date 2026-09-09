import { type CSSProperties, type ReactNode, useState } from 'react'
import { FileX, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty'
import { useIsMobile, useLongPress } from '@/hooks'
import { cn } from '@/lib/utils'

interface FeedRowActionsContext {
    menuOpen: boolean
    setMenuOpen: (open: boolean) => void
    isMobile: boolean
}

interface FeedRowProps {
    icon: ReactNode
    iconClassName?: string
    iconStyle?: CSSProperties
    title: ReactNode
    titleClassName?: string
    badge?: ReactNode
    subtitle?: ReactNode
    amount?: ReactNode
    amountClassName?: string
    extraAmount?: ReactNode
    leading?: ReactNode
    below?: ReactNode
    onOpen?: () => void
    hasActions?: boolean
    actions?: (context: FeedRowActionsContext) => ReactNode
}

export function FeedStatusBadge({
    children,
    variant,
}: {
    children: ReactNode
    variant?: 'secondary' | 'outline'
}) {
    return (
        <Badge variant={variant} className="h-5 shrink-0 px-1.5 text-[10px]">
            {children}
        </Badge>
    )
}

export function FeedRow({
    icon,
    iconClassName,
    iconStyle,
    title,
    titleClassName,
    badge,
    subtitle,
    amount,
    amountClassName,
    extraAmount,
    leading,
    below,
    onOpen,
    hasActions = false,
    actions,
}: FeedRowProps) {
    const isMobile = useIsMobile()
    const [menuOpen, setMenuOpen] = useState(false)
    const interactive = !!onOpen
    const longPress = useLongPress({ enabled: hasActions && isMobile })

    return (
        <div className="min-w-0">
            <div
                className={cn(
                    'relative flex min-w-0 items-center gap-2.5 rounded-lg py-2 sm:gap-3 sm:px-1.5',
                    interactive && 'cursor-pointer hover:bg-muted/60',
                    isMobile && hasActions && 'select-none [-webkit-touch-callout:none]',
                )}
                {...(isMobile && hasActions ? longPress.handlers : {})}
                onClick={() => {
                    if (longPress.consume()) {
                        setMenuOpen(true)
                        return
                    }
                    onOpen?.()
                }}
                onContextMenu={(event) => {
                    if (!isMobile || !hasActions) {
                        return
                    }
                    event.preventDefault()
                    longPress.mark()
                    setMenuOpen(true)
                }}
                onKeyDown={interactive ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpen?.()
                    }
                } : undefined}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
            >
                {leading}

                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full text-base',
                        iconClassName,
                    )}
                    style={iconStyle}
                >
                    {icon}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <p className={cn('truncate font-semibold', titleClassName)}>{title}</p>
                        {badge}
                    </div>
                    {subtitle && (
                        <div className="truncate text-xs text-muted-foreground">
                            {subtitle}
                        </div>
                    )}
                </div>

                {(amount != null || extraAmount) && (
                    <div className="min-w-0 shrink-0 text-right">
                        {amount != null && (
                            <p className={cn('font-mono font-semibold', amountClassName)}>
                                {amount}
                            </p>
                        )}
                        {extraAmount && (
                            <p className="font-mono text-xs text-muted-foreground">
                                {extraAmount}
                            </p>
                        )}
                    </div>
                )}

                {hasActions && actions && (
                    <div
                        className={cn(!isMobile && '-mr-1 shrink-0')}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {actions({ menuOpen, setMenuOpen, isMobile })}
                    </div>
                )}
            </div>
            {below}
        </div>
    )
}

export function FeedRowSkeleton({ showHeading = false }: { showHeading?: boolean }) {
    return (
        <div className="space-y-1">
            {showHeading && <Skeleton className="mb-2 h-4 w-28" />}
            {Array.from({ length: showHeading ? 3 : 4 }).map((_, row) => (
                <div key={row} className="flex items-center gap-3 px-1.5 py-2">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    )
}

export function FeedList<T>({
    items,
    isLoading,
    emptyTitle,
    emptyDescription,
    emptyAction,
    onCreate,
    createLabel,
    isReadOnly,
    getKey,
    children,
}: {
    items: T[]
    isLoading?: boolean
    emptyTitle: string
    emptyDescription: string
    emptyAction?: ReactNode
    onCreate?: () => void
    createLabel?: string
    isReadOnly?: boolean
    getKey: (item: T) => string | number
    children: (item: T) => ReactNode
}) {
    if (isLoading) {
        return <FeedRowSkeleton />
    }

    if (items.length === 0) {
        return (
            <FeedEmpty
                title={emptyTitle}
                description={emptyDescription}
                action={emptyAction}
                onCreate={onCreate}
                createLabel={createLabel}
                isReadOnly={isReadOnly}
            />
        )
    }

    return (
        <div className="divide-y divide-border/60">
            {items.map((item) => (
                <div key={getKey(item)}>
                    {children(item)}
                </div>
            ))}
        </div>
    )
}

export function FeedEmpty({
    title,
    description,
    action,
    onCreate,
    createLabel,
    isReadOnly,
}: {
    title: string
    description: string
    action?: ReactNode
    onCreate?: () => void
    createLabel?: string
    isReadOnly?: boolean
}) {
    return (
        <Empty className="border rounded-lg py-16">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <FileX />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            {action ?? (
                onCreate && !isReadOnly ? (
                    <Button onClick={onCreate}>
                        <Plus className="size-4" />
                        {createLabel}
                    </Button>
                ) : undefined
            )}
        </Empty>
    )
}
