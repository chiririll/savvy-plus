import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupsApi } from '@/api/backups'
import { toast } from 'sonner'
import i18n from '@/lib/i18n'

const QUERY_KEY = ['backups']

export function useBackups() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: backupsApi.getAll,
    })
}

export function useCreateBackup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (note?: string) => backupsApi.create(note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.backup.created'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.backup.createFailed'))
        },
    })
}

export function useUploadBackup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ file, note }: { file: File; note?: string }) =>
            backupsApi.upload(file, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.backup.uploaded'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.backup.uploadFailed'))
        },
    })
}

export function useRestoreBackup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => backupsApi.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries()
            toast.success(i18n.t('toasts.backup.restored'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.backup.restoreFailed'))
        },
    })
}

export function useDeleteBackup() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => backupsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success(i18n.t('toasts.backup.deleted'))
        },
        onError: (error: Error) => {
            toast.error(error.message || i18n.t('toasts.backup.deleteFailed'))
        },
    })
}
