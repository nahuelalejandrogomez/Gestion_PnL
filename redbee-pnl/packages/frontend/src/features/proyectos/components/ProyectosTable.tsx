import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { useProyectos } from '../hooks/useProyectos';
import { useDebounce } from '@/hooks/useDebounce';
import { ProyectoBadge } from './ProyectoBadge';
import type { Proyecto, EstadoProyecto } from '../types/proyecto.types';

const ITEMS_PER_PAGE = 20;

interface ProyectosTableProps {
  clienteId?: string;
  hideClienteColumn?: boolean;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export function ProyectosTable({
  clienteId,
  hideClienteColumn = false,
  showCreateButton = false,
  onCreateClick,
}: ProyectosTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoProyecto | 'TODOS'>('TODOS');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProyectos({
    search: debouncedSearch || undefined,
    estado: estado !== 'TODOS' ? estado : undefined,
    clienteId: clienteId || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const handleRowClick = (proyecto: Proyecto) => {
    navigate(`/proyectos/${proyecto.id}`);
  };

  const baseColumns = [
    {
      header: 'Proyecto',
      accessorKey: 'nombre' as keyof Proyecto,
      cell: (proyecto: Proyecto) => (
        <div className="py-1">
          <p className="font-medium text-stone-800">{proyecto.nombre}</p>
          <p className="text-sm text-stone-500 font-mono">{proyecto.codigo}</p>
        </div>
      ),
    },
  ];

  const clienteColumn = hideClienteColumn
    ? []
    : [
        {
          header: 'Cliente',
          accessorKey: 'cliente.nombre' as string,
          cell: (proyecto: Proyecto) => (
            <span className="text-stone-600">{proyecto.cliente?.nombre || '-'}</span>
          ),
        },
      ];

  const otherColumns = [
    {
      header: 'Tipo',
      accessorKey: 'tipo' as keyof Proyecto,
      cell: (proyecto: Proyecto) => {
        const labels: Record<string, string> = {
          PROYECTO: 'Proyecto',
          POTENCIAL: 'Potencial',
          SOPORTE: 'Soporte',
          RETAINER: 'Retainer',
        };
        return <span className="text-stone-600 text-sm">{labels[proyecto.tipo] || proyecto.tipo}</span>;
      },
    },
    {
      header: 'Estado',
      accessorKey: 'estado' as keyof Proyecto,
      cell: (proyecto: Proyecto) => <ProyectoBadge estado={proyecto.estado} />,
    },
    {
      header: 'Recursos',
      accessorKey: '_count.asignaciones',
      cell: (proyecto: Proyecto) => (
        <span className="text-stone-500 tabular-nums">{proyecto._count?.asignaciones || 0}</span>
      ),
      className: 'text-center',
    },
  ];

  const columns = [...baseColumns, ...clienteColumn, ...otherColumns];

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-stone-800">
              Proyectos
            </CardTitle>
            <CardDescription className="text-stone-500">
              {clienteId ? 'Proyectos asociados a este cliente' : 'Listado de proyectos'}
            </CardDescription>
          </div>
          {showCreateButton && onCreateClick && (
            <Button
              onClick={onCreateClick}
              className="bg-stone-800 hover:bg-stone-700 text-white focus:ring-amber-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Buscar por nombre o código..."
            className="flex-1 sm:max-w-md"
          />
          <Select
            value={estado}
            onValueChange={(value) => {
              setEstado(value as EstadoProyecto | 'TODOS');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-stone-200">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="PAUSADO">Pausado</SelectItem>
              <SelectItem value="CERRADO">Cerrado</SelectItem>
              <SelectItem value="POTENCIAL">Potencial</SelectItem>
              <SelectItem value="TENTATIVO">Tentativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          emptyMessage="No se encontraron proyectos"
        />

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-stone-500">
              Mostrando {data.data.length} de {data.pagination.total} proyectos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-stone-200"
              >
                Anterior
              </Button>
              <span className="text-sm text-stone-600">
                Página {page} de {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="border-stone-200"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
