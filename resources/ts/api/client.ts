import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'
import { getApiErrorMessage } from '@/lib/api-error'
import { ApiError } from '@/types'

interface WrappedResponse<T> {
    data: T
    message?: string
    meta?: {
        total?: number
        page?: number
        limit?: number
    }
}

// Soft, router-driven sign-out: the auth store registers this so a 401 never
// hard-reloads the page. The frontend holds no token and never refreshes.
let onUnauthorized: (() => void) | null = null

export const setOnUnauthorized = (handler: () => void) => {
    onUnauthorized = handler
}

const createApiClient = (baseURL: string): AxiosInstance => {
    const client = axios.create({
        baseURL,
        timeout: 10000,
        withCredentials: true,
        xsrfCookieName: 'svy_csrf',
        xsrfHeaderName: 'X-CSRF-Token',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    client.interceptors.request.use((config) => {
        config.headers['X-Locale'] = i18n.resolvedLanguage ?? i18n.language
        return config
    })

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                onUnauthorized?.()
                return Promise.reject(error)
            }

            const apiError: ApiError = {
                message: error.response?.data?.message || i18n.t('errors.generic'),
                code: error.response?.status?.toString() || 'UNKNOWN',
                details: error.response?.data?.errors ?? error.response?.data?.details,
            }
            apiError.message = getApiErrorMessage(apiError, i18n.t('errors.generic'))

            // Show toast for non-validation errors
            if (error.response?.status !== 422) {
                toast.error(apiError.message)
            }

            return Promise.reject(apiError)
        }
    )

    return client
}

export const apiClient = createApiClient(
    import.meta.env.VITE_API_URL || '/api'
)

// Helper to unwrap response
const unwrap = <T>(response: WrappedResponse<T> | T): T => {
    if (response && typeof response === 'object' && 'data' in response) {
        return (response as WrappedResponse<T>).data
    }
    return response as T
}

export const api = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        apiClient.get<WrappedResponse<T> | T>(url, config)
            .then((res) => unwrap<T>(res.data)),

    post: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
        apiClient.post<WrappedResponse<T> | T>(url, data, config)
            .then((res) => unwrap<T>(res.data)),

    put: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
        apiClient.put<WrappedResponse<T> | T>(url, data, config)
            .then((res) => unwrap<T>(res.data)),

    patch: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
        apiClient.patch<WrappedResponse<T> | T>(url, data, config)
            .then((res) => unwrap<T>(res.data)),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        apiClient.delete<WrappedResponse<T> | T>(url, config)
            .then((res) => unwrap<T>(res.data)),
}
