import { ColumnDef, Row } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Page } from './Page'
import { PageHeader } from './PageHeader'
import { DataTable } from './DataTable'
import { Button } from '@/components/ui/button'

interface ListPageProps<T> {
    title: string
    description?: string
    createLink?: string
    createLabel?: string
    onCreateClick?: () => void
    data: T[]
    columns: ColumnDef<T>[]
    isLoading?: boolean
    emptyTitle?: string
    emptyDescription?: string
    getRowClassName?: (row: Row<T>) => string | undefined
}

export function ListPage<T>({
    title,
    description,
    createLink,
    createLabel,
    onCreateClick,
    data,
    columns,
    isLoading,
    emptyTitle,
    emptyDescription,
    getRowClassName,
}: ListPageProps<T>) {
    const { t } = useTranslation()
    const newLabel = createLabel ?? t('actions.create')
    const emptyAction = onCreateClick ? (
        <Button onClick={onCreateClick}>
            <Plus className="size-4" />
            {newLabel}
        </Button>
    ) : createLink ? (
        <Button asChild>
            <Link to={createLink}>
                <Plus className="size-4" />
                {newLabel}
            </Link>
        </Button>
    ) : undefined

    return (
        <Page title={title}>
            <PageHeader
                title={title}
                description={description}
                createLink={createLink}
                createLabel={newLabel}
                onCreateClick={onCreateClick}
            />
            <DataTable
                data={data}
                columns={columns}
                isLoading={isLoading}
                emptyTitle={emptyTitle ?? t('table.emptyTitle')}
                emptyDescription={emptyDescription ?? t('table.emptyDescription')}
                getRowClassName={getRowClassName}
                emptyAction={emptyAction}
            />
        </Page>
    )
}
