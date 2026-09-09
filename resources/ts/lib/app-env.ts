/**
 * Laravel APP_ENV from the SPA shell. Missing meta fails closed (production)
 * so a static production build never shows the development banner.
 */
export function getAppEnv(): string {
    if (typeof document === 'undefined') {
        return 'production'
    }

    const value = document.querySelector('meta[name="app-env"]')?.getAttribute('content')?.trim()

    return value || 'production'
}

export function isNonProductionApp(): boolean {
    return getAppEnv() !== 'production'
}
