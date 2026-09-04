import { api } from './client'
import { createCrudApi } from './crud'
import type {
    IdentityProvider,
    PublicProvider,
    SsoExchangeResponse,
    SsoPresetCatalogEntry,
} from '@/types/sso'
import type { IdentityProviderFormData } from '@/schemas'

const ENDPOINT = '/identity-providers'
const crud = createCrudApi<IdentityProvider, IdentityProviderFormData>(ENDPOINT)

export const ssoApi = {
    ...crud,
    list: crud.getAll,

    providers: () => api.get<PublicProvider[]>('/auth/sso/providers'),
    exchange: (ticket: string) => api.post<SsoExchangeResponse>('/auth/sso/exchange', { ticket }),
    presets: () => api.get<SsoPresetCatalogEntry[]>('/auth/sso/presets'),
    test: (id: number | string) => api.post<{ status: string; message?: string }>(`${ENDPOINT}/${id}/test`),
}

/**
 * Full backend URL for the browser-driven authorization redirect. Used with
 * window.location (NOT axios) since SSO is a top-level navigation.
 */
export const ssoRedirectUrl = (slug: string, redirect?: string): string => {
    const base = import.meta.env.VITE_API_URL || '/api'
    const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''

    return `${base}/auth/sso/${slug}/redirect${query}`
}
