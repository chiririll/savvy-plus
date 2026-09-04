export type UserRole = 'admin' | 'read-write' | 'read-only'

export interface User {
    id: number
    name: string
    email: string
    role: UserRole
    isInactive: boolean
    isSsoOnly: boolean
    createdAt: string
    token?: string
    expiresAt?: string
}

export interface PasswordTokenPreview {
    name: string
    email: string
    isInactive: boolean
    expiresAt: string
}
