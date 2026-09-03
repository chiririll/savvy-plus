import { createElement, CSSProperties, Fragment } from 'react'
import { cn } from '@/lib/utils'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    Row,
    getExpandedRowModel,
} from '@tanstack/react-table'
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from '@/components/ui/empty'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { FileX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface DataTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    isLoading?: boolean
    emptyTitle?: string
    emptyDescription?: string
    emptyAction?: React.ReactNode
    renderSubComponent?: (props: { row: Row<T> }) => React.ReactNode
    getRowCanExpand?: (row: Row<T>) => boolean
    getRowClassName?: (row: Row<T>) => string | undefined
    manualPagination?: boolean
    onReorder?: (items: T[]) => void
}

function getItemId<T>(item: T): string {
    if (item && typeof item === 'object' && 'id' in item) {
        return String((item as { id: string | number }).id)
    }

    throw new Error('Reorderable rows must have an id')
}

function DataTableSkeleton({ columns }: { columns: number }) {
    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {Array.from({ length: columns }).map((_, i) => (
                            <TableHead key={i}>
                                <Skeleton className="h-4 w-24" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            {Array.from({ length: columns }).map((_, j) => (
                                <TableCell key={j}>
                                    <Skeleton className="h-4 w-full" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function DataTableEmpty({
    title,
    description,
    action,
}: {
    title: string
    description: string
    action?: React.ReactNode
}) {
    return (
        <Empty className="border rounded-lg py-16">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <FileX />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            {action}
        </Empty>
    )
}

function DataTablePagination<T>({ table }: { table: ReturnType<typeof useReactTable<T>> }) {
    const { t } = useTranslation()
    const pageIndex = table.getState().pagination.pageIndex
    const pageCount = table.getPageCount()
    const pageSize = table.getState().pagination.pageSize

    if (pageCount <= 1) return null

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t('table.rowsPerPage')}</span>
                <Select
                    value={String(pageSize)}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                >
                    <SelectTrigger className="h-8 w-16">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 30, 50].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                    {t('table.pageOf', { current: pageIndex + 1, total: pageCount })}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function DataTable<T>({
    data,
    columns,
    isLoading,
    emptyTitle: emptyTitleProp,
    emptyDescription: emptyDescriptionProp,
    emptyAction,
    renderSubComponent,
    getRowCanExpand,
    getRowClassName,
    manualPagination = false,
    onReorder,
}: DataTableProps<T>) {
    const { t } = useTranslation()
    const emptyTitle = emptyTitleProp ?? t('table.emptyTitle')
    const emptyDescription = emptyDescriptionProp ?? t('table.emptyDescription')
    const isReorderable = !!onReorder
    const disablePagination = manualPagination || isReorderable
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand,
        getRowId: isReorderable ? (row) => getItemId(row) : undefined,
        manualPagination: disablePagination,
    })

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id || !onReorder) {
            return
        }

        const oldIndex = data.findIndex((item) => getItemId(item) === String(active.id))
        const newIndex = data.findIndex((item) => getItemId(item) === String(over.id))
        if (oldIndex < 0 || newIndex < 0) {
            return
        }

        onReorder(arrayMove(data, oldIndex, newIndex))
    }

    if (isLoading) {
        return <DataTableSkeleton columns={columns.length + (isReorderable ? 1 : 0)} />
    }

    if (data.length === 0) {
        return (
            <DataTableEmpty
                title={emptyTitle}
                description={emptyDescription}
                action={emptyAction}
            />
        )
    }

    const tableContent = (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {isReorderable && <TableHead className="w-10" />}
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) =>
                        isReorderable ? (
                            <SortableTableRow
                                key={row.id}
                                row={row}
                                getRowClassName={getRowClassName}
                                renderSubComponent={renderSubComponent}
                            />
                        ) : (
                            <Fragment key={row.id}>
                                <TableRow
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={cn(getRowClassName?.(row))}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                {row.getIsExpanded() && renderSubComponent && (
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                                            {createElement(renderSubComponent, { row })}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        )
                    )}
                </TableBody>
            </Table>
            {!disablePagination && <DataTablePagination table={table} />}
        </div>
    )

    if (!isReorderable) {
        return tableContent
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={data.map(getItemId)} strategy={verticalListSortingStrategy}>
                {tableContent}
            </SortableContext>
        </DndContext>
    )
}

function SortableTableRow<T>({
    row,
    getRowClassName,
    renderSubComponent,
}: {
    row: Row<T>
    getRowClassName?: (row: Row<T>) => string | undefined
    renderSubComponent?: (props: { row: Row<T> }) => React.ReactNode
}) {
    const { t } = useTranslation()
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.id,
    })

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <Fragment>
            <TableRow
                ref={setNodeRef}
                style={style}
                data-state={row.getIsSelected() && 'selected'}
                className={cn(isDragging && 'relative z-10 opacity-50', getRowClassName?.(row))}
            >
                <TableCell className="w-10 pr-0">
                    <button
                        type="button"
                        className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
                        aria-label={t('actions.reorder')}
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="size-4" />
                    </button>
                </TableCell>
                {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                ))}
            </TableRow>
            {row.getIsExpanded() && renderSubComponent && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={row.getVisibleCells().length + 1} className="p-0">
                        {createElement(renderSubComponent, { row })}
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    )
}
