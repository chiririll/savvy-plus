import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFoundPage() {
    const { t } = useTranslation('auth')

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="rounded-full bg-muted p-6 mb-6">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-2">404</h1>
            <h2 className="text-xl text-muted-foreground mb-4">{t('notFound.title')}</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
                {t('notFound.description')}
            </p>
            <Button asChild>
                <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    {t('notFound.back')}
                </Link>
            </Button>
        </div>
    )
}
