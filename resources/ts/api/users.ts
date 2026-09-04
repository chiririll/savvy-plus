import { api } from './client'
import { createCrudApi } from './crud'
import type { User, UserFormData } from '@/types/users'

export const usersApi = {
    ...createCrudApi<User, UserFormData>('/users'),

    issuePasswordToken: (id: number | string) =>
        api.post<User>(`/users/${id}/password-token`),
}
