import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from '@/locales/en/common.json'
import enNav from '@/locales/en/nav.json'
import enAuth from '@/locales/en/auth.json'
import enSettings from '@/locales/en/settings.json'
import enPages from '@/locales/en/pages.json'
import ruCommon from '@/locales/ru/common.json'
import ruNav from '@/locales/ru/nav.json'
import ruAuth from '@/locales/ru/auth.json'
import ruSettings from '@/locales/ru/settings.json'
import ruPages from '@/locales/ru/pages.json'

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

/** BCP 47 tag for Intl formatters. Currency wiring stays on the currencies branch. */
export function intlLocale(locale: string = i18n.resolvedLanguage ?? i18n.language): string {
    return locale.startsWith('ru') ? 'ru-RU' : 'en-US'
}

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: enCommon, nav: enNav, auth: enAuth, settings: enSettings, pages: enPages },
            ru: { common: ruCommon, nav: ruNav, auth: ruAuth, settings: ruSettings, pages: ruPages },
        },
        fallbackLng: 'en',
        supportedLngs: [...SUPPORTED_LOCALES],
        nonExplicitSupportedLngs: true,
        defaultNS: 'common',
        ns: ['common', 'nav', 'auth', 'settings', 'pages'],
        interpolation: { escapeValue: false },
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
