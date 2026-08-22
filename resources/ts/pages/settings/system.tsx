import { ReactNode } from 'react'
import { toast } from 'sonner'
import { Coins, ShieldCheck, Lock, Languages } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Page, PageHeader, FormWrapper, LanguageSwitcher } from '@/components/shared'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpdateSettings, useSsoProviders } from '@/hooks'

function Section({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: LucideIcon
    title: string
    description: string
    children: ReactNode
}) {
    return (
        <section className="rounded-xl border bg-card shadow-sm">
            <header className="flex items-start gap-3 border-b px-5 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                    <Icon className="size-4" />
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold leading-none">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </header>
            <div className="p-5">{children}</div>
        </section>
    )
}

interface ToggleRowProps {
    id: string
    label: string
    description: string
    checked: boolean
    disabled?: boolean
    badge?: ReactNode
    onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, disabled, badge, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                        {label}
                    </Label>
                    {badge}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
        </div>
    )
}

function RowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-5 w-8 rounded-full" />
        </div>
    )
}

export default function SystemSettingsPage() {
    const { t } = useTranslation('settings')
    const { data: settings, isLoading } = useSettings()
    const { data: ssoProviders } = useSsoProviders()
    const updateSettings = useUpdateSettings()

    const hasSso = (ssoProviders?.length ?? 0) > 0
    const autoUpdate = settings?.auto_update_currencies ?? true
    const passwordLoginEnabled = settings?.password_login_enabled ?? true
    const passwordLoginLocked = passwordLoginEnabled && !hasSso
    const ssoAllowSignup = settings?.sso_allow_signup ?? true
    const requireVerifiedEmail = settings?.sso_require_verified_email ?? false

    const handleAutoUpdateChange = (checked: boolean) => {
        updateSettings.mutate({ auto_update_currencies: checked })
    }

    const handlePasswordLoginChange = (checked: boolean) => {
        if (!checked && !hasSso) {
            toast.error(t('system.authentication.passwordLoginError'))
            return
        }
        updateSettings.mutate({ password_login_enabled: checked })
    }

    const handleSignupChange = (checked: boolean) => {
        updateSettings.mutate({ sso_allow_signup: checked })
    }

    const handleRequireVerifiedChange = (checked: boolean) => {
        updateSettings.mutate({ sso_require_verified_email: checked })
    }

    return (
        <Page title={t('system.title')}>
            <PageHeader title={t('system.heading')} description={t('system.description')} />

            <FormWrapper>
                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <Section
                        icon={Languages}
                        title={t('system.language.title')}
                        description={t('system.language.description')}
                    >
                        <div className="rounded-lg border">
                            <LanguageSwitcher variant="select" />
                        </div>
                    </Section>

                    <Section
                        icon={Coins}
                        title={t('system.currencyRates.title')}
                        description={t('system.currencyRates.description')}
                    >
                        <div className="rounded-lg border">
                            {isLoading ? (
                                <RowSkeleton />
                            ) : (
                                <ToggleRow
                                    id="auto-update"
                                    label={t('system.currencyRates.autoUpdate')}
                                    description={t('system.currencyRates.autoUpdateDescription')}
                                    checked={autoUpdate}
                                    disabled={updateSettings.isPending}
                                    onChange={handleAutoUpdateChange}
                                />
                            )}
                        </div>
                    </Section>

                    <Section
                        icon={ShieldCheck}
                        title={t('system.authentication.title')}
                        description={t('system.authentication.description')}
                    >
                        <div className="divide-y rounded-lg border">
                            {isLoading ? (
                                <>
                                    <RowSkeleton />
                                    <RowSkeleton />
                                    <RowSkeleton />
                                </>
                            ) : (
                                <>
                                    <ToggleRow
                                        id="password-login"
                                        label={t('system.authentication.passwordLogin')}
                                        description={
                                            passwordLoginLocked
                                                ? t('system.authentication.passwordLoginLocked')
                                                : t('system.authentication.passwordLoginOpen')
                                        }
                                        checked={passwordLoginEnabled}
                                        disabled={updateSettings.isPending || passwordLoginLocked}
                                        badge={
                                            passwordLoginLocked ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    <Lock className="size-2.5" />
                                                    {t('system.authentication.locked')}
                                                </span>
                                            ) : undefined
                                        }
                                        onChange={handlePasswordLoginChange}
                                    />

                                    <ToggleRow
                                        id="sso-signup"
                                        label={t('system.authentication.jit')}
                                        description={t('system.authentication.jitDescription')}
                                        checked={ssoAllowSignup}
                                        disabled={updateSettings.isPending}
                                        onChange={handleSignupChange}
                                    />

                                    <ToggleRow
                                        id="sso-verified-email"
                                        label={t('system.authentication.verifiedEmail')}
                                        description={
                                            ssoAllowSignup
                                                ? t('system.authentication.verifiedEmailOn')
                                                : t('system.authentication.verifiedEmailOff')
                                        }
                                        checked={requireVerifiedEmail}
                                        disabled={updateSettings.isPending || !ssoAllowSignup}
                                        onChange={handleRequireVerifiedChange}
                                    />
                                </>
                            )}
                        </div>
                    </Section>
                </div>
            </FormWrapper>
        </Page>
    )
}
