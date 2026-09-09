import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { FeedList, Page, PageHeader } from '@/components/shared'
import { TagFormDialog, TagRow } from '@/components/features/tags'
import { Button } from '@/components/ui/button'
import { useTags, useCreateTag, useDeleteTag, useUpdateTag, useResourceFormDialog } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { Tag } from '@/types'
import { TagFormData } from '@/schemas'

export default function TagsPage() {
    const { t } = useTranslation('pages')
    const { data: tags, isLoading } = useTags()
    const deleteTag = useDeleteTag()
    const createTag = useCreateTag()
    const updateTag = useUpdateTag()
    const isReadOnly = useReadOnly()
    const items = tags ?? []
    const form = useResourceFormDialog<Tag, TagFormData>({
        items,
        isLoading,
        create: createTag,
        update: updateTag,
    })

    return (
        <Page title={t('tags.title')}>
            <PageHeader
                title={t('tags.title')}
                description={t('tags.description')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                createLabel={t('tags.create')}
            />

            <div className="mx-auto w-full max-w-[800px]">
                <FeedList
                    items={items}
                    isLoading={isLoading}
                    emptyTitle={t('tags.emptyTitle')}
                    emptyDescription={t('tags.emptyDescription')}
                    emptyAction={
                        !isReadOnly ? (
                            <Button onClick={form.openCreate}>
                                <Plus className="size-4" />
                                {t('tags.create')}
                            </Button>
                        ) : undefined
                    }
                    getKey={(tag) => tag.id}
                >
                    {(tag) => (
                        <TagRow
                            tag={tag}
                            onEdit={form.openEdit}
                            onDelete={(id) => deleteTag.mutate(id)}
                            isReadOnly={isReadOnly}
                        />
                    )}
                </FeedList>
            </div>

            <TagFormDialog
                tag={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </Page>
    )
}
