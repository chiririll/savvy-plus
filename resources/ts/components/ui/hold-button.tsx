import { useRef, useState, type ComponentProps } from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const DEFAULT_HOLD_MS = 1000
const DEFAULT_REWIND_MS = 400

type HoldButtonProps = Omit<ComponentProps<'button'>, 'onClick'> &
    VariantProps<typeof buttonVariants> & {
        onConfirm: () => void
        holdDuration?: number
        rewindDuration?: number
    }

export function HoldButton({
    onConfirm,
    holdDuration = DEFAULT_HOLD_MS,
    rewindDuration = DEFAULT_REWIND_MS,
    variant = 'outline',
    size = 'sm',
    className,
    disabled,
    children,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onKeyDown,
    onKeyUp,
    onContextMenu,
    ...props
}: HoldButtonProps) {
    const [holding, setHolding] = useState(false)
    const completedRef = useRef(false)

    const startHold = () => {
        if (disabled) {
            return
        }
        completedRef.current = false
        setHolding(true)
    }

    const stopHold = () => {
        setHolding(false)
    }

    return (
        <button
            type="button"
            disabled={disabled}
            data-slot="hold-button"
            data-holding={holding || undefined}
            aria-pressed={holding}
            className={cn(
                buttonVariants({ variant, size }),
                'relative overflow-hidden select-none touch-none',
                className,
            )}
            onPointerDown={(event) => {
                onPointerDown?.(event)
                if (event.defaultPrevented || event.button !== 0) {
                    return
                }
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                startHold()
            }}
            onPointerUp={(event) => {
                onPointerUp?.(event)
                stopHold()
            }}
            onPointerCancel={(event) => {
                onPointerCancel?.(event)
                stopHold()
            }}
            onLostPointerCapture={(event) => {
                onLostPointerCapture?.(event)
                stopHold()
            }}
            onKeyDown={(event) => {
                onKeyDown?.(event)
                if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) {
                    return
                }
                event.preventDefault()
                startHold()
            }}
            onKeyUp={(event) => {
                onKeyUp?.(event)
                if (event.key !== ' ' && event.key !== 'Enter') {
                    return
                }
                stopHold()
            }}
            onContextMenu={(event) => {
                event.preventDefault()
                onContextMenu?.(event)
            }}
            {...props}
        >
            <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-primary"
                style={{
                    width: holding ? '100%' : '0%',
                    transition: holding
                        ? `width ${holdDuration}ms linear`
                        : `width ${rewindDuration}ms ease-out`,
                }}
                onTransitionEnd={(event) => {
                    if (event.propertyName !== 'width' || !holding || completedRef.current) {
                        return
                    }
                    completedRef.current = true
                    setHolding(false)
                    onConfirm()
                }}
            />
            <span
                className={cn(
                    'relative z-10 inline-flex items-center gap-1.5',
                    holding && 'text-primary-foreground',
                )}
            >
                {children}
            </span>
        </button>
    )
}
