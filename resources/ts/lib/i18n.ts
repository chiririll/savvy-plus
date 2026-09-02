import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from '@/locales/en/common.json'
import enNav from '@/locales/en/nav.json'
import enAuth from '@/locales/en/auth.json'
import enSettings from '@/locales/en/settings.json'
import enPages from '@/locales/en/pages.json'
import enForms from '@/locales/en/forms.json'
import ruCommon from '@/locales/ru/common.json'
import ruNav from '@/locales/ru/nav.json'
import ruAuth from '@/locales/ru/auth.json'
import ruSettings from '@/locales/ru/settings.json'
import ruPages from '@/locales/ru/pages.json'
import ruForms from '@/locales/ru/forms.json'

export const SUPPORTED_LOCALES = ['en', 'ru'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<AppLocale, string> = {
    en: 'English',
    ru: 'Русский',
}

export const LOCALE_STORAGE_KEY = 'savvy.locale'

export function isAppLocale(value: string): value is AppLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

const I18N_NAMESPACES = ['common', 'nav', 'auth', 'settings', 'pages', 'forms'] as const

/** BCP 47 tag for Intl formatters. */
export function intlLocale(locale: string = i18n.resolvedLanguage ?? i18n.language): string {
    return locale.startsWith('ru') ? 'ru-RU' : 'en-US'
}

function resolveDottedNamespaceKey(key: string): string {
    const parts = key.split('.')
    if (parts.length < 2) {
        return key
    }

    const ns = parts[0]
    const rest = parts.slice(1).join('.')
    if (!(I18N_NAMESPACES as readonly string[]).includes(ns)) {
        return key
    }

    if (i18n.exists(rest, { ns })) {
        return i18n.t(rest, { ns })
    }

    return key
}

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: enCommon, nav: enNav, auth: enAuth, settings: enSettings, pages: enPages, forms: enForms },
            ru: { common: ruCommon, nav: ruNav, auth: ruAuth, settings: ruSettings, pages: ruPages, forms: ruForms },
        },
        fallbackLng: 'en',
        supportedLngs: [...SUPPORTED_LOCALES],
        nonExplicitSupportedLngs: true,
        defaultNS: 'common',
        ns: [...I18N_NAMESPACES],
        interpolation: { escapeValue: false },
        parseMissingKeyHandler: resolveDottedNamespaceKey,
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: LOCALE_STORAGE_KEY,
        },
    })

function applyDocumentLang(lng: string) {
    if (typeof document === 'undefined') {
        return
    }

    document.documentElement.lang = lng.startsWith('ru') ? 'ru' : 'en'
}

applyDocumentLang(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', applyDocumentLang)

export default i18n
