import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

const DEFAULT_DELAY = 450
const MOVE_THRESHOLD_PX = 8

export function useLongPress(options?: { delay?: number; enabled?: boolean }) {
    const delay = options?.delay ?? DEFAULT_DELAY
    const enabled = options?.enabled ?? true
    const timerRef = useRef<number | null>(null)
    const startRef = useRef<{ x: number; y: number } | null>(null)
    const firedRef = useRef(false)

    const clearTimer = () => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const consume = () => {
        const fired = firedRef.current
        firedRef.current = false
        return fired
    }

    const mark = () => {
        firedRef.current = true
    }

    return {
        consume,
        mark,
        handlers: {
            onPointerDown: (event: ReactPointerEvent) => {
                if (!enabled) {
                    return
                }

                firedRef.current = false
                startRef.current = { x: event.clientX, y: event.clientY }
                clearTimer()
                timerRef.current = window.setTimeout(() => {
                    firedRef.current = true
                }, delay)
            },
            onPointerMove: (event: ReactPointerEvent) => {
                if (!startRef.current) {
                    return
                }

                const dx = event.clientX - startRef.current.x
                const dy = event.clientY - startRef.current.y
                if ((dx * dx) + (dy * dy) > MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
                    clearTimer()
                    startRef.current = null
                }
            },
            onPointerUp: () => {
                clearTimer()
                startRef.current = null
            },
            onPointerCancel: () => {
                clearTimer()
                startRef.current = null
                firedRef.current = false
            },
            onPointerLeave: () => {
                clearTimer()
                startRef.current = null
            },
        },
    }
}
