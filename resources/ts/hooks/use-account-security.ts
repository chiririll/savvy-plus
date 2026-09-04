import { authApi } from '@/api'
import { useResourceMutation } from './use-crud'
import i18n from '@/lib/i18n'

export function useChangePassword() {
    return useResourceMutation({
        mutationFn: authApi.changePassword,
        successMessage: i18n.t('toasts.accountSecurity.passwordChanged'),
    })
}

export function useLogoutOthers() {
    return useResourceMutation({
        mutationFn: authApi.logoutOthers,
        successMessage: i18n.t('toasts.accountSecurity.loggedOutOthers'),
    })
}
