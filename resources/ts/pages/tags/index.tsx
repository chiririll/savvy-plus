import { useTranslation } from 'react-i18next'
import { ListPage } from '@/components/shared'
import { createTagColumns, TagFormDialog } from '@/components/features/tags'
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

    const columns = createTagColumns((id) => deleteTag.mutate(id), isReadOnly, form.openEdit)

    return (
        <>
            <ListPage
                title={t('tags.title')}
                description={t('tags.description')}
                onCreateClick={isReadOnly ? undefined : form.openCreate}
                createLabel={t('tags.create')}
                data={items}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={t('tags.emptyTitle')}
                emptyDescription={t('tags.emptyDescription')}
            />

            <TagFormDialog
                tag={form.entity}
                open={form.open}
                onOpenChange={form.setOpen}
                onSubmit={form.submit}
                isSubmitting={form.isSubmitting}
            />
        </>
    )
}
