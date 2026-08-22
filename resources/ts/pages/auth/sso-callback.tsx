import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ssoApi } from '@/api/sso'
import { useAuthStore } from '@/stores/auth'
import i18n from '@/lib/i18n'

const SSO_ERROR_CODES = [
    'invalid_issuer',
    'invalid_audience',
    'invalid_nonce',
    'invalid_id_token',
    'invalid_state',
    'token_exchange_failed',
    'jwks_failed',
    'metadata_unreachable',
    'idp_error',
    'no_email',
    'email_in_use',
    'signup_disabled',
    'no_admin',
] as const

function ssoErrorMessage(code: string): string {
    if ((SSO_ERROR_CODES as readonly string[]).includes(code)) {
        return i18n.t(`auth:sso.errors.${code}`)
    }

    return i18n.t('auth:sso.errors.unknown', { code })
}

export default function SsoCallbackPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const setUser = useAuthStore((state) => state.setUser)
    const ran = useRef(false)

    useEffect(() => {
        if (ran.current) return
        ran.current = true

        const error = params.get('error')
        const ticket = params.get('ticket')

        if (error || !ticket) {
            toast.error(error ? ssoErrorMessage(error) : i18n.t('auth:ssoFailed'))
            navigate('/login', { replace: true })
            return
        }

        ssoApi
            .exchange(ticket)
            .then((res) => {
                if ('requires_2fa' in res) {
                    navigate('/login', { replace: true, state: { twoFactorToken: res.two_factor_token } })
                    return
                }

                setUser(res.user)
                toast.success(i18n.t('auth:welcomeToast'))
                navigate('/', { replace: true })
            })
            .catch(() => {
                toast.error(i18n.t('auth:ssoFailed'))
                navigate('/login', { replace: true })
            })
    }, [params, navigate, setUser])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
    )
}
