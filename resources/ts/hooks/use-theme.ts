import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'auto'

type ThemeState = {
    preference: ThemePreference
    theme: Theme
}

const STORAGE_KEY = 'theme'

const SERVER_STATE: ThemeState = { preference: 'auto', theme: 'light' }

function getSystemTheme(): Theme {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function parsePreference(value: string | null): ThemePreference {
    if (value === 'light' || value === 'dark' || value === 'auto') return value
    return 'auto'
}

function resolveTheme(preference: ThemePreference): Theme {
    return preference === 'auto' ? getSystemTheme() : preference
}

function readDomTheme(): Theme {
    if (typeof document === 'undefined') return 'light'
    // The blocking inline script in the document head resolves and applies the
    // theme class before first paint; the DOM is the single source of truth.
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function readInitialState(): ThemeState {
    if (typeof window === 'undefined') return SERVER_STATE
    const preference = parsePreference(localStorage.getItem(STORAGE_KEY))
    return { preference, theme: readDomTheme() }
}

let state: ThemeState = readInitialState()
const listeners = new Set<() => void>()

function applyTheme(theme: Theme) {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.style.colorScheme = theme
    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff')
}

function notifyAll() {
    listeners.forEach((notify) => notify())
}

function commit(next: ThemeState) {
    if (next.preference === state.preference && next.theme === state.theme) return
    state = next
    applyTheme(next.theme)
    notifyAll()
}

function setPreference(preference: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, preference)
    commit({ preference, theme: resolveTheme(preference) })
}

function syncFromSystem() {
    if (state.preference !== 'auto') return
    commit({ preference: 'auto', theme: getSystemTheme() })
}

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY) return
        const preference = parsePreference(event.newValue)
        commit({ preference, theme: resolveTheme(preference) })
    })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', syncFromSystem)
}

function subscribe(notify: () => void): () => void {
    listeners.add(notify)
    return () => {
        listeners.delete(notify)
    }
}

function getSnapshot(): ThemeState {
    return state
}

export function useTheme() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE)

    return {
        theme: snapshot.theme,
        preference: snapshot.preference,
        setTheme: setPreference,
    }
}
