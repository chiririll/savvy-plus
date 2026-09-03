import {
    Github,
    Globe,
    Cloud,
    ShieldCheck,
    GitBranch,
    KeyRound,
    Fingerprint,
    Network,
    KeySquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import i18n from '@/lib/i18n'
import type { PresetField, SsoPresetCatalogEntry } from '@/types/sso'

const FIELD_KEY_BY_PRESET: Record<string, Record<string, string>> = {
    gitlab: { base_url: 'gitlab_base_url' },
    keycloak: { base_url: 'keycloak_base_url' },
    authentik: { base_url: 'authentik_base_url' },
}

export function ssoPresetLabel(preset: string | Pick<SsoPresetCatalogEntry, 'key' | 'label'>, t: TFunction): string {
    const key = typeof preset === 'string' ? preset : preset.key
    const fallback = typeof preset === 'string' ? preset : preset.label
    if (key === 'custom_oidc' || key === 'custom_saml') {
        return t(`forms:sso.presets.${key}`)
    }
    return fallback
}

export function ssoFieldLabel(preset: string, field: PresetField, t: TFunction): string {
    const i18nKey = FIELD_KEY_BY_PRESET[preset]?.[field.key] ?? field.key
    const fullKey = `sso.fields.${i18nKey}`
    return i18n.exists(fullKey, { ns: 'forms' }) ? t(`forms:${fullKey}`) : field.label
}

export function ssoFieldPlaceholder(field: PresetField, t: TFunction): string | undefined {
    const fullKey = `sso.placeholders.${field.key}`
    if (i18n.exists(fullKey, { ns: 'forms' })) {
        return t(`forms:${fullKey}`)
    }
    return field.placeholder
}

// The frontend owns provider visuals; the backend only supplies the preset key.
const PRESET_ICONS: Record<string, LucideIcon> = {
    entra: Cloud,
    github: Github,
    google: Globe,
    okta: ShieldCheck,
    gitlab: GitBranch,
    keycloak: KeyRound,
    authentik: Fingerprint,
    custom_oidc: Network,
    custom_saml: KeySquare,
}

export function presetIcon(preset: string): LucideIcon {
    return PRESET_ICONS[preset] ?? KeyRound
}

export function isCustomPreset(preset: string): boolean {
    return preset === 'custom_oidc' || preset === 'custom_saml'
}
