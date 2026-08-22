import { useTranslation } from 'react-i18next'
import { Page, PageHeader, DataTable } from '@/components/shared'
import { createTagColumns } from '@/components/features/tags'
import { useTags, useDeleteTag } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, Hash } from 'lucide-react'

export default function TagsPage() {
    const { t } = useTranslation('pages')
    const { data: tags, isLoading } = useTags()
    const deleteTag = useDeleteTag()
    const isReadOnly = useReadOnly()

    const columns = createTagColumns((id) => deleteTag.mutate(id), isReadOnly)

    return (
        <Page title={t('tags.title')}>
            <PageHeader
                title={t('tags.title')}
                description={t('tags.description')}
                createLink="/tags/create"
                createLabel={t('tags.create')}
            />

            <DataTable
                data={tags ?? []}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={t('tags.emptyTitle')}
                emptyDescription={t('tags.emptyDescription')}
                emptyAction={
                    <Button asChild>
                        <Link to="/tags/create">
                            <Plus className="size-4" />
                            {t('tags.create')}
                        </Link>
                    </Button>
                }
            />
        </Page>
    )
}
