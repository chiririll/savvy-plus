import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Page, PageHeader, DataTable } from '@/components/shared'
import { createTagColumns, TagFormDialog } from '@/components/features/tags'
import { useTags, useCreateTag, useDeleteTag, useUpdateTag } from '@/hooks'
import { useReadOnly } from '@/components/providers/ReadOnlyProvider'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Tag, TagFormData } from '@/types'

export default function TagsPage() {
    const { t } = useTranslation('pages')
    const [searchParams, setSearchParams] = useSearchParams()
    const { data: tags, isLoading } = useTags()
    const deleteTag = useDeleteTag()
    const createTag = useCreateTag()
    const updateTag = useUpdateTag()
    const isReadOnly = useReadOnly()
    const [formOpen, setFormOpen] = useState(false)
    const [formTag, setFormTag] = useState<Tag | null>(null)

    const items = tags ?? []

    useEffect(() => {
        if (searchParams.get('create') === '1') {
            setFormTag(null)
            setFormOpen(true)
            setSearchParams((prev) => {
                prev.delete('create')
                return prev
            }, { replace: true })
        }
    }, [searchParams, setSearchParams])

    useEffect(() => {
        const editId = searchParams.get('edit')
        if (!editId) return

        const found = items.find((tag) => String(tag.id) === editId)
        if (!found && isLoading) return

        if (found) {
            setFormTag(found)
            setFormOpen(true)
        }

        setSearchParams((prev) => {
            prev.delete('edit')
            return prev
        }, { replace: true })
    }, [searchParams, items, isLoading, setSearchParams])

    const handleCreate = () => {
        setFormTag(null)
        setFormOpen(true)
    }

    const handleEdit = (tag: Tag) => {
        setFormTag(tag)
        setFormOpen(true)
    }

    const handleFormSubmit = (formData: TagFormData) => {
        if (formTag) {
            updateTag.mutate(
                { id: formTag.id, data: formData },
                { onSuccess: () => setFormOpen(false) }
            )
        } else {
            createTag.mutate(formData, { onSuccess: () => setFormOpen(false) })
        }
    }

    const columns = createTagColumns((id) => deleteTag.mutate(id), isReadOnly, handleEdit)

    return (
        <Page title={t('tags.title')}>
            <PageHeader
                title={t('tags.title')}
                description={t('tags.description')}
                onCreateClick={isReadOnly ? undefined : handleCreate}
                createLabel={t('tags.create')}
            />

            <DataTable
                data={items}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={t('tags.emptyTitle')}
                emptyDescription={t('tags.emptyDescription')}
                emptyAction={
                    !isReadOnly ? (
                        <Button onClick={handleCreate}>
                            <Plus className="size-4" />
                            {t('tags.create')}
                        </Button>
                    ) : undefined
                }
            />

            <TagFormDialog
                tag={formTag}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSubmit={handleFormSubmit}
                isSubmitting={createTag.isPending || updateTag.isPending}
            />
        </Page>
    )
}
