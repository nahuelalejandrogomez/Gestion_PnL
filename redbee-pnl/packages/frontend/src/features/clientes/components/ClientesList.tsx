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
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { useClientes } from '../hooks/useClientes';
import { useClienteMutations } from '../hooks/useClienteMutations';
import { useDebounce } from '@/hooks/useDebounce';
import { ClienteBadge } from './ClienteBadge';
import { ClienteForm } from './ClienteForm';
import type { Cliente, CreateClienteDto, UpdateClienteDto, EstadoCliente } from '../types/cliente.types';

const ITEMS_PER_PAGE = 20;

export function ClientesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoCliente | 'TODOS'>('TODOS');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useClientes({
    search: debouncedSearch || undefined,
    estado: estado !== 'TODOS' ? estado : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { createCliente } = useClienteMutations();

  const handleCreate = (formData: CreateClienteDto | UpdateClienteDto) => {
    createCliente.mutate(formData as CreateClienteDto, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };

  const handleRowClick = (cliente: Cliente) => {
    navigate(`/clientes/${cliente.id}`);
  };

  const columns = [
    {
      header: 'Cliente',
      accessorKey: 'nombre' as keyof Cliente,
      cell: (cliente: Cliente) => (
        <div className="py-1">
          <p className="font-medium text-slate-900">{cliente.nombre}</p>
          <p className="text-sm text-slate-500">{cliente.razonSocial}</p>
        </div>
      ),
    },
    {
      header: 'CUIL/CUIT',
      accessorKey: 'cuilCuit' as keyof Cliente,
      cell: (cliente: Cliente) => (
        <span className="text-slate-600 font-mono text-sm">{cliente.cuilCuit}</span>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'estado' as keyof Cliente,
      cell: (cliente: Cliente) => <ClienteBadge estado={cliente.estado} />,
    },
    {
      header: 'Proyectos',
      accessorKey: '_count.proyectos',
      cell: (cliente: Cliente) => (
        <span className="text-slate-500 tabular-nums">{cliente._count?.proyectos || 0}</span>
      ),
      className: 'text-center',
    },
    {
      header: 'Contratos',
      accessorKey: '_count.contratos',
      cell: (cliente: Cliente) => (
        <span className="text-slate-500 tabular-nums">{cliente._count?.contratos || 0}</span>
      ),
      className: 'text-center',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-slate-500 mt-1">
            Gestión de clientes y sus relaciones comerciales
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#0066ff] hover:bg-[#0052cc] text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, razón social o CUIL..."
          className="flex-1 sm:max-w-md"
        />
        <Select
          value={estado}
          onValueChange={(value) => {
            setEstado(value as EstadoCliente | 'TODOS');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48 h-11 bg-white border-slate-200">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
            <SelectItem value="POTENCIAL">Potencial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-medium text-slate-700">{data.data.length}</span> de{' '}
            <span className="font-medium text-slate-700">{data.pagination.total}</span> clientes
          </p>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onRowClick={handleRowClick}
        emptyMessage="No se encontraron clientes"
      />

      {/* Create Dialog */}
      <ClienteForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        isLoading={createCliente.isPending}
      />
    </div>
  );
}
