import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FormPage } from '@/components/shared'
import { TagForm } from '@/components/features/tags'
import { useTag, useUpdateTag } from '@/hooks'

export default function TagEditPage() {
    const { t } = useTranslation('pages')
    const { id } = useParams<{ id: string }>()
    const { data: tag, isLoading } = useTag(id!)
    const updateTag = useUpdateTag('/tags')

    const defaultValues = tag
        ? {
              name: tag.name,
          }
        : undefined

    return (
        <FormPage title={t('tags.editTitle')} backLink="/tags" isLoading={isLoading}>
            <TagForm
                defaultValues={defaultValues}
                onSubmit={(data) => updateTag.mutate({ id: id!, data })}
                isSubmitting={updateTag.isPending}
            />
        </FormPage>
    )
}
