import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from './Pagination';
import type { PaginationInfo } from '@/features/clientes/types/cliente.types';

interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  onRowClick,
  emptyMessage = 'No hay datos para mostrar',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={`text-xs font-semibold text-slate-600 uppercase tracking-wider py-4 ${column.className || ''}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="border-slate-100">
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className="py-4">
                    <Skeleton className="h-5 w-full bg-slate-100" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={`text-xs font-semibold text-slate-600 uppercase tracking-wider py-4 ${column.className || ''}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="h-32 text-center text-slate-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={`text-xs font-semibold text-slate-600 uppercase tracking-wider py-4 ${column.className || ''}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`border-slate-100 ${onRowClick ? 'cursor-pointer hover:bg-slate-50/50 transition-colors' : ''}`}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={`py-4 ${column.className || ''}`}>
                    {column.cell
                      ? column.cell(item)
                      : column.accessorKey
                        ? String(getNestedValue(item, column.accessorKey as string) ?? '')
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
