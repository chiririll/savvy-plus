import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuthStore, useSessionExpired } from '@/stores/auth'

export function SessionExpiredDialog() {
    const { t } = useTranslation('auth')
    const expired = useSessionExpired()
    const clear = useAuthStore((state) => state.clear)
    const navigate = useNavigate()
    const location = useLocation()

    const goToLogin = () => {
        const from = `${location.pathname}${location.search}`
        clear()
        navigate('/login', { replace: true, state: { from, sessionExpired: true } })
    }

    return (
        <AlertDialog open={expired} onOpenChange={() => {}}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('sessionExpired.title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('sessionExpired.description')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={goToLogin}>
                        {t('sessionExpired.signIn')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
