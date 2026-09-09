import { useTranslation } from 'react-i18next'
import { FeedRow, RowActions } from '@/components/shared'
import { localizeDefaultName } from '@/lib/localized-name'
import { Category } from '@/types'

interface CategoryRowProps {
    category: Category
    onEdit?: (category: Category) => void
    onDelete?: (id: number) => void
    isReadOnly?: boolean
    deleteDisabled?: boolean
}

export function CategoryRow({
    category,
    onEdit,
    onDelete,
    isReadOnly,
    deleteDisabled,
}: CategoryRowProps) {
    const { t } = useTranslation(['common', 'pages'])
    const name = localizeDefaultName(category.name)
    const canEdit = !!onEdit && !isReadOnly
    const canDelete = !!onDelete && !isReadOnly

    return (
        <FeedRow
            icon={<span aria-hidden>{category.icon}</span>}
            iconStyle={{ backgroundColor: `${category.color}20` }}
            title={name}
            subtitle={t(`pages:categories.types.${category.type}`)}
            onOpen={canEdit ? () => onEdit(category) : undefined}
            hasActions={canEdit || canDelete}
            actions={({ menuOpen, setMenuOpen, isMobile }) => (
                <RowActions
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    showTrigger={!isMobile}
                    onEdit={canEdit ? () => onEdit(category) : undefined}
                    onDelete={canDelete ? () => onDelete(category.id) : undefined}
                    deleteTitle={t('pages:categories.deleteTitle')}
                    deleteDescription={t('pages:categories.deleteDescription', { name })}
                    deleteDisabled={deleteDisabled}
                    deleteDisabledLabel={t('actions.cannotDeleteLast')}
                />
            )}
        />
    )
}
