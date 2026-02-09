import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutList, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { useProyectos } from '../hooks/useProyectos';
import { useProyectoMutations } from '../hooks/useProyectoMutations';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useDebounce } from '@/hooks/useDebounce';
import { ProyectoBadge } from './ProyectoBadge';
import { ProyectoCard } from './ProyectoCard';
import { ProyectoForm } from './ProyectoForm';
import type { Proyecto, CreateProyectoDto, UpdateProyectoDto, EstadoProyecto } from '../types/proyecto.types';

const ITEMS_PER_PAGE = 20;

export function ProyectosList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoProyecto | 'TODOS'>('TODOS');
  const [clienteId, setClienteId] = useState<string>('TODOS');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groupByCliente, setGroupByCliente] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProyectos({
    search: debouncedSearch || undefined,
    estado: estado !== 'TODOS' ? estado : undefined,
    clienteId: clienteId !== 'TODOS' ? clienteId : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { data: clientesData } = useClientes({ limit: 100 });

  const { createProyecto } = useProyectoMutations();

  const handleCreate = (formData: CreateProyectoDto | UpdateProyectoDto) => {
    createProyecto.mutate(formData as CreateProyectoDto, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };

  const handleRowClick = (proyecto: Proyecto) => {
    navigate(`/proyectos/${proyecto.id}`);
  };

  const groupedProyectos = useMemo(() => {
    if (!groupByCliente || !data?.data) return null;
    const groups: Record<string, { clienteNombre: string; proyectos: Proyecto[] }> = {};
    for (const proyecto of data.data) {
      const key = proyecto.clienteId;
      if (!groups[key]) {
        groups[key] = {
          clienteNombre: proyecto.cliente?.nombre || 'Sin cliente',
          proyectos: [],
        };
      }
      groups[key].proyectos.push(proyecto);
    }
    return Object.values(groups).sort((a, b) => a.clienteNombre.localeCompare(b.clienteNombre));
  }, [groupByCliente, data?.data]);

  const columns = [
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
    {
      header: 'Cliente',
      accessorKey: 'cliente.nombre' as string,
      cell: (proyecto: Proyecto) => (
        <span className="text-stone-600">{proyecto.cliente?.nombre || '-'}</span>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo' as keyof Proyecto,
      cell: (proyecto: Proyecto) => {
        const labels: Record<string, string> = {
          PROYECTO: 'Proyecto', POTENCIAL: 'Potencial', SOPORTE: 'Soporte', RETAINER: 'Retainer',
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

  return (
    <div className="space-y-6 bg-stone-50 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Proyectos</h1>
          <p className="text-stone-500 mt-1">
            Gestión de proyectos y su relación con clientes
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-stone-800 hover:bg-stone-700 text-white focus:ring-amber-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          placeholder="Buscar por nombre o código..."
          className="flex-1 sm:max-w-md"
        />
        <Select
          value={clienteId}
          onValueChange={(value) => {
            setClienteId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52 h-10 bg-white border-stone-200 focus:ring-stone-300">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los clientes</SelectItem>
            {clientesData?.data.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={estado}
          onValueChange={(value) => {
            setEstado(value as EstadoProyecto | 'TODOS');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48 h-10 bg-white border-stone-200 focus:ring-stone-300">
            <SelectValue placeholder="Filtrar por estado" />
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
        <Button
          variant={groupByCliente ? 'default' : 'outline'}
          size="sm"
          onClick={() => setGroupByCliente(!groupByCliente)}
          className={groupByCliente
            ? 'bg-stone-800 hover:bg-stone-700 text-white h-10'
            : 'border-stone-200 text-stone-600 hover:bg-stone-100 h-10'
          }
        >
          {groupByCliente ? <Users className="mr-2 h-4 w-4" /> : <LayoutList className="mr-2 h-4 w-4" />}
          {groupByCliente ? 'Agrupado' : 'Agrupar'}
        </Button>
      </div>

      {/* Results info */}
      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Mostrando <span className="font-medium text-stone-700">{data.data.length}</span> de{' '}
            <span className="font-medium text-stone-700">{data.pagination.total}</span> proyectos
          </p>
        </div>
      )}

      {/* Content */}
      {groupByCliente && groupedProyectos ? (
        <div className="space-y-8">
          {groupedProyectos.map((group) => (
            <div key={group.clienteNombre}>
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-stone-400" />
                {group.clienteNombre}
                <span className="text-stone-400 font-normal">({group.proyectos.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.proyectos.map((proyecto) => (
                  <ProyectoCard
                    key={proyecto.id}
                    proyecto={proyecto}
                    onClick={() => handleRowClick(proyecto)}
                  />
                ))}
              </div>
            </div>
          ))}
          {groupedProyectos.length === 0 && !isLoading && (
            <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
              <p className="text-stone-500">No se encontraron proyectos</p>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          pagination={data?.pagination}
          onPageChange={setPage}
          onRowClick={handleRowClick}
          emptyMessage="No se encontraron proyectos"
        />
      )}

      {/* Create Dialog */}
      <ProyectoForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        isLoading={createProyecto.isPending}
      />
    </div>
  );
}
