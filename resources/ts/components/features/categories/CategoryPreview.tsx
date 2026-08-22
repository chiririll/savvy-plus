import { useTranslation } from 'react-i18next'

interface CategoryPreviewProps {
    name: string
    icon: string
    color: string
}

export function CategoryPreview({ name, icon, color }: CategoryPreviewProps) {
    const { t } = useTranslation('forms')

    return (
        <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">{t('categories.preview')}</p>
            <div className="flex items-center gap-2">
                <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: color }}
                >
                    {icon}
                </span>
                <span className="font-medium">{name || t('categories.previewName')}</span>
            </div>
        </div>
    )
}
