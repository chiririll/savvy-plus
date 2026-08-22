import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    isAppLocale,
    LOCALE_LABELS,
    SUPPORTED_LOCALES,
    type AppLocale,
} from '@/lib/i18n'
import { cn } from '@/lib/utils'

function currentLocale(language: string): AppLocale {
    const base = language.split('-')[0]
    return isAppLocale(base) ? base : 'en'
}

interface LanguageSwitcherProps {
    variant?: 'compact' | 'select' | 'auth'
    className?: string
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
    const { i18n, t } = useTranslation()
    const locale = currentLocale(i18n.resolvedLanguage ?? i18n.language)

    const change = (next: string) => {
        if (isAppLocale(next)) {
            void i18n.changeLanguage(next)
        }
    }

    if (variant === 'select') {
        return (
            <div className={cn('flex items-center justify-between gap-4 px-4 py-3.5', className)}>
                <div className="space-y-1">
                    <Label htmlFor="interface-language" className="text-sm font-medium">
                        {t('language.label')}
                    </Label>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {t('language.description')}
                    </p>
                </div>
                <Select value={locale} onValueChange={change}>
                    <SelectTrigger id="interface-language" className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPORTED_LOCALES.map((code) => (
                            <SelectItem key={code} value={code}>
                                {LOCALE_LABELS[code]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )
    }

    if (variant === 'auth') {
        return (
            <div className={cn('flex items-center justify-center gap-2', className)}>
                {SUPPORTED_LOCALES.map((code) => (
                    <Button
                        key={code}
                        type="button"
                        variant={locale === code ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => change(code)}
                    >
                        {LOCALE_LABELS[code]}
                    </Button>
                ))}
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={className}
                    aria-label={t('language.label')}
                >
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {SUPPORTED_LOCALES.map((code) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => change(code)}
                        className={locale === code ? 'font-medium' : undefined}
                    >
                        {LOCALE_LABELS[code]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
