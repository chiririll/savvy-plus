import { HelpCircle } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface FieldHelpProps {
    children: React.ReactNode
}

export function FieldHelp({ children }: FieldHelpProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 shrink-0 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
                {typeof children === 'string' ? <p>{children}</p> : children}
            </TooltipContent>
        </Tooltip>
    )
}
