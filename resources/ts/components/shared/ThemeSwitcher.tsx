import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme, type ThemePreference } from '@/hooks/use-theme'

const THEME_OPTIONS: { value: ThemePreference; icon: LucideIcon }[] = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'auto', icon: Monitor },
]

function TriggerIcon({ preference, theme }: { preference: ThemePreference; theme: 'light' | 'dark' }) {
    if (preference === 'auto') return <Monitor className="h-5 w-5" />
    if (theme === 'dark') return <Moon className="h-5 w-5" />
    return <Sun className="h-5 w-5" />
}

interface ThemeSwitcherProps {
    className?: string
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
    const { t } = useTranslation()
    const { theme, preference, setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={className} aria-label={t('theme.label')}>
                    <TriggerIcon preference={preference} theme={theme} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={preference}
                    onValueChange={(value) => {
                        if (value === 'light' || value === 'dark' || value === 'auto') {
                            setTheme(value)
                        }
                    }}
                >
                    {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                            <Icon className="size-4" />
                            {t(`theme.${value}`)}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
