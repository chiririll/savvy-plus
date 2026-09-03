import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getUserAvatarUrl, getUserInitials } from '@/lib/avatar'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/auth'

function UserAvatar({ user }: { user: User }) {
    return (
        <Avatar className="size-8">
            <AvatarImage src={getUserAvatarUrl(user)} />
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
        </Avatar>
    )
}

export function UserMenu() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    if (!user) return null

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <UserAvatar user={user} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{t(`roles.${user.role}`)}</p>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    {t('actions.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
