import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isNonProductionApp } from '@/lib/app-env'

export function DevModeBanner() {
    const { t } = useTranslation()

    if (!isNonProductionApp()) {
        return null
    }

    return (
        <div
            role="status"
            className="flex w-full min-w-0 items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-amber-950"
        >
            <TriangleAlert className="size-4 shrink-0" />
            <span className="min-w-0">{t('devMode.banner')}</span>
        </div>
    )
}
