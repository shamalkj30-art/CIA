'use client'

import { useState, useMemo, ReactNode } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  searchKey?: string
  searchPlaceholder?: string
  loading?: boolean
  emptyState?: ReactNode
  bulkActions?: {
    label: string
    icon?: ReactNode
    onClick: (rows: TData[]) => void
    variant?: 'default' | 'danger'
  }[]
  pageSize?: number
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-[var(--surface-subtle)] rounded-t-lg" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 border-b border-[var(--border)] flex items-center gap-4 px-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className="h-4 bg-[var(--border)] rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No data found</h3>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
        There are no items to display. Try adjusting your filters or add new items.
      </p>
    </div>
  )
}

export function DataTable<TData>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search...',
  loading,
  emptyState,
  bulkActions,
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
  const hasSelection = selectedRows.length > 0

  if (loading) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <TableSkeleton columns={columns.length} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
            />
          </div>

          {/* Bulk actions (visible when rows selected) */}
          {hasSelection && bulkActions && (
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
              <span className="text-sm text-[var(--text-muted)]">
                {selectedRows.length} selected
              </span>
              {bulkActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => action.onClick(selectedRows)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                    ${action.variant === 'danger'
                      ? 'text-[var(--danger)] hover:bg-[var(--danger)]/10'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                    }
                  `}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column visibility */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-subtle)] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Columns
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[180px] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg p-1.5 z-50"
                align="end"
                sideOffset={4}
              >
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === 'select') return null
                  return (
                    <DropdownMenu.CheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded cursor-pointer outline-none"
                    >
                      <Checkbox.Root
                        checked={column.getIsVisible()}
                        className="w-4 h-4 border border-[var(--border)] rounded flex items-center justify-center data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                      >
                        <Checkbox.Indicator>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="capitalize">{column.id}</span>
                    </DropdownMenu.CheckboxItem>
                  )
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        emptyState || <EmptyState />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-[var(--border)] bg-[var(--surface-subtle)]">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-[var(--text-primary)]' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {{
                                  asc: '↑',
                                  desc: '↓',
                                }[header.column.getIsSorted() as string] ?? '↕'}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`
                      border-b border-[var(--border)] last:border-b-0 transition-colors
                      ${row.getIsSelected() ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--surface-subtle)]'}
                    `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-[var(--text-primary)]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <div className="text-sm text-[var(--text-muted)]">
              Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
              {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, table.getFilteredRowModel().rows.length)} of{' '}
              {table.getFilteredRowModel().rows.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(table.getPageCount())].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`
                      w-8 h-8 text-sm font-medium rounded-lg transition-colors
                      ${table.getState().pagination.pageIndex === i
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }
                    `}
                  >
                    {i + 1}
                  </button>
                )).slice(
                  Math.max(0, table.getState().pagination.pageIndex - 2),
                  Math.min(table.getPageCount(), table.getState().pagination.pageIndex + 3)
                )}
              </div>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper components for table cells
export function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    complete: 'bg-[var(--success)]/10 text-[var(--success)]',
    completed: 'bg-[var(--success)]/10 text-[var(--success)]',
    active: 'bg-[var(--success)]/10 text-[var(--success)]',
    'in progress': 'bg-[var(--primary)]/10 text-[var(--primary)]',
    'in_progress': 'bg-[var(--primary)]/10 text-[var(--primary)]',
    pending: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    cancelled: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    canceled: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    failed: 'bg-[var(--danger)]/10 text-[var(--danger)]',
  }

  const style = statusStyles[status.toLowerCase()] || 'bg-[var(--surface-subtle)] text-[var(--text-muted)]'

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export function AvatarGroup({ avatars, max = 3 }: { avatars: { src?: string; name: string }[]; max?: number }) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((avatar, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--surface-subtle)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] overflow-hidden"
          title={avatar.name}
        >
          {avatar.src ? (
            <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
          ) : (
            avatar.name.charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--surface-subtle)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
          +{remaining}
        </div>
      )}
    </div>
  )
}

export function SelectionCheckbox({ checked, onChange, indeterminate }: { checked: boolean; onChange: (checked: boolean) => void; indeterminate?: boolean }) {
  return (
    <Checkbox.Root
      checked={indeterminate ? 'indeterminate' : checked}
      onCheckedChange={onChange}
      className="w-4 h-4 border border-[var(--border)] rounded flex items-center justify-center data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)] data-[state=indeterminate]:bg-[var(--primary)] data-[state=indeterminate]:border-[var(--primary)] transition-colors"
    >
      <Checkbox.Indicator>
        {indeterminate ? (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </Checkbox.Indicator>
    </Checkbox.Root>
  )
}
