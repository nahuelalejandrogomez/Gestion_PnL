import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, FolderKanban, Pencil, Trash2, CheckCircle, DollarSign, Receipt, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCliente } from '../hooks/useCliente';
import { useClienteMutations } from '../hooks/useClienteMutations';
import { ClienteBadge } from './ClienteBadge';
import { ClienteForm } from './ClienteForm';
import { ContratosSection } from '@/features/contratos/components/ContratosSection';
import { ProyectosTable, ProyectoForm, useProyectoMutations } from '@/features/proyectos';
import { ClienteRevenueTab } from '@/features/revenue';
import { TarifariosTab, useTarifarios } from '@/features/tarifarios';
import { ProyectoPnlGrid } from '@/features/pnl';
import { useState } from 'react';
import type { UpdateClienteDto } from '../types/cliente.types';
import type { CreateProyectoDto } from '@/features/proyectos/types/proyecto.types';

export function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cliente, isLoading, error } = useCliente(id);
  const { updateCliente, deleteCliente } = useClienteMutations();
  const { createProyecto } = useProyectoMutations();
  const { data: tarifariosData } = useTarifarios({ clienteId: id, estado: 'ACTIVO' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateProyectoOpen, setIsCreateProyectoOpen] = useState(false);

  const handleUpdate = (data: UpdateClienteDto) => {
    if (!id) return;
    updateCliente.mutate(
      { id, data },
      {
        onSuccess: () => setIsEditDialogOpen(false),
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    deleteCliente.mutate(id, {
      onSuccess: () => navigate('/clientes'),
    });
  };

  const handleCreateProyecto = (data: CreateProyectoDto | any) => {
    createProyecto.mutate(data as CreateProyectoDto, {
      onSuccess: () => {
        setIsCreateProyectoOpen(false);
      },
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-stone-50 min-h-screen -m-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg bg-stone-200" />
          <Skeleton className="h-8 w-64 bg-stone-200" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg bg-stone-200" />
        <Skeleton className="h-[300px] w-full rounded-lg bg-stone-200" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="space-y-4 bg-stone-50 min-h-screen -m-6 p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/clientes')}
          className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Button>
        <Card className="border-stone-200">
          <CardContent className="pt-12 pb-12">
            <p className="text-stone-500 text-center">
              No se pudo cargar el cliente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-stone-50 min-h-screen -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/clientes')}
            className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-stone-800">{cliente.nombre}</h1>
              <ClienteBadge estado={cliente.estado} />
            </div>
            <p className="text-stone-500 mt-1">{cliente.razonSocial}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsEditDialogOpen(true)}
            className="border-stone-200 text-stone-700 hover:bg-stone-100"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-stone-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-stone-800">¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription className="text-stone-500">
                  Esta acción eliminará el cliente "{cliente.nombre}" y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-stone-200 text-stone-600">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-stone-800">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-stone-500">CUIL/CUIT</p>
              <p className="font-medium text-stone-800 font-mono">{cliente.cuilCuit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Fecha de inicio</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">{formatDate(cliente.fechaInicio)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Proyectos</p>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">{cliente.proyectos?.length || 0}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Contratos vigentes</p>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-stone-400" />
                <p className="font-medium text-stone-800">{cliente.contratosVigentes || 0}</p>
                {cliente.contratosVigentes && cliente.contratosVigentes > 0 && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
          </div>
          {cliente.notas && (
            <>
              <Separator className="my-6 bg-stone-200" />
              <div className="space-y-1">
                <p className="text-sm text-stone-500">Notas</p>
                <p className="text-stone-700">{cliente.notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs for related data */}
      <Tabs defaultValue="proyectos" className="space-y-4">
        <TabsList className="bg-white border border-stone-200 p-1 rounded-lg">
          <TabsTrigger
            value="proyectos"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <FolderKanban className="h-4 w-4" />
            Proyectos ({cliente.proyectos?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="contratos"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <FileText className="h-4 w-4" />
            Contratos ({cliente.contratosVigentes || 0})
          </TabsTrigger>
          <TabsTrigger
            value="tarifarios"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <Receipt className="h-4 w-4" />
            Tarifarios ({tarifariosData?.total || 0})
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger
            value="pnl"
            className="flex items-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:text-stone-800 rounded-md px-4"
          >
            <BarChart3 className="h-4 w-4" />
            P&L
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="mt-6">
          <ProyectosTable 
            clienteId={cliente.id} 
            hideClienteColumn={true} 
            showCreateButton={true}
            onCreateClick={() => setIsCreateProyectoOpen(true)}
          />
        </TabsContent>

        <TabsContent value="contratos" className="mt-6">
          <ContratosSection clienteId={cliente.id} />
        </TabsContent>

        <TabsContent value="tarifarios" className="mt-6">
          <TarifariosTab clienteId={cliente.id} clienteNombre={cliente.nombre} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <ClienteRevenueTab clienteId={cliente.id} />
        </TabsContent>

        <TabsContent value="pnl" className="mt-6">
          <ProyectoPnlGrid clienteId={cliente.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ClienteForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        cliente={cliente}
        onSubmit={handleUpdate}
        isLoading={updateCliente.isPending}
      />

      {/* Create Proyecto Dialog */}
      <ProyectoForm
        open={isCreateProyectoOpen}
        onOpenChange={setIsCreateProyectoOpen}
        onSubmit={handleCreateProyecto}
        isLoading={createProyecto.isPending}
        preselectedClienteId={cliente.id}
      />
    </div>
  );
}
