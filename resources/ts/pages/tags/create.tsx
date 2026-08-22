import { useTranslation } from 'react-i18next'
import { Page, PageHeader, FormPage } from '@/components/shared'
import { TagForm } from '@/components/features/tags'
import { useCreateTag } from '@/hooks'

export default function CreateTagPage() {
    const { t } = useTranslation('pages')
    const createTag = useCreateTag('/tags')

    return (
        <Page title={t('tags.createTitle')}>
            <PageHeader
                title={t('tags.createTitle')}
                description={t('tags.createDescription')}
                backLink="/tags"
            />

            <FormPage>
                <TagForm
                    onSubmit={createTag.mutate}
                    isSubmitting={createTag.isPending}
                    submitLabel={t('common:actions.create')}
                />
            </FormPage>
        </Page>
    )
}
