import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'
import { getApiErrorMessage } from '@/lib/api-error'

export function useChangePassword() {
    return useMutation({
        mutationFn: authApi.changePassword,
        onSuccess: () => {
            toast.success(i18n.t('toasts.accountSecurity.passwordChanged'))
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.accountSecurity.passwordFailed')))
        },
    })
}

export function useLogoutOthers() {
    return useMutation({
        mutationFn: authApi.logoutOthers,
        onSuccess: () => {
            toast.success(i18n.t('toasts.accountSecurity.loggedOutOthers'))
        },
        onError: (error: Error) => {
            toast.error(getApiErrorMessage(error, i18n.t('toasts.accountSecurity.logoutOthersFailed')))
        },
    })
}
