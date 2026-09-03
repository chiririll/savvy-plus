import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface UserPasswordLinkDialogProps {
    url: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UserPasswordLinkDialog({
    url,
    open,
    onOpenChange,
}: UserPasswordLinkDialogProps) {
    const { t } = useTranslation(['pages', 'common'])
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!url) return
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            // clipboard may be unavailable over plain HTTP
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('users.inviteLinkTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('users.inviteLinkDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2">
                    <Input readOnly value={url ?? ''} className="font-mono text-sm" />
                    <Button type="button" variant="outline" onClick={handleCopy}>
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        {t('common:actions.done')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
