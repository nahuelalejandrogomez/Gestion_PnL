import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useState } from 'react';
import type { UpdateClienteDto } from '../types/cliente.types';

export function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cliente, isLoading, error } = useCliente(id);
  const { updateCliente, deleteCliente } = useClienteMutations();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No se pudo cargar el cliente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{cliente.nombre}</h1>
              <ClienteBadge estado={cliente.estado} />
            </div>
            <p className="text-muted-foreground">{cliente.razonSocial}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará el cliente "{cliente.nombre}" y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">CUIL/CUIT</p>
              <p className="font-medium">{cliente.cuilCuit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fecha de inicio</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{formatDate(cliente.fechaInicio)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Proyectos</p>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{cliente.proyectos?.length || 0}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contratos</p>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{cliente.contratos?.length || 0}</p>
              </div>
            </div>
          </div>
          {cliente.notas && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="text-sm">{cliente.notas}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs for related data */}
      <Tabs defaultValue="proyectos">
        <TabsList>
          <TabsTrigger value="proyectos" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Proyectos ({cliente.proyectos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contratos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos ({cliente.contratos?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proyectos</CardTitle>
              <CardDescription>
                Proyectos asociados a este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cliente.proyectos && cliente.proyectos.length > 0 ? (
                <div className="space-y-3">
                  {cliente.proyectos.map((proyecto) => (
                    <div
                      key={proyecto.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{proyecto.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {proyecto.codigo} • {formatDate(proyecto.fechaInicio)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {proyecto.estado}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay proyectos asociados a este cliente.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contratos</CardTitle>
              <CardDescription>
                Contratos firmados con este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cliente.contratos && cliente.contratos.length > 0 ? (
                <div className="space-y-3">
                  {cliente.contratos.map((contrato) => (
                    <div
                      key={contrato.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{contrato.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {contrato.tipo} • {formatDate(contrato.fechaFirma)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {contrato.estado}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay contratos asociados a este cliente.
                </p>
              )}
            </CardContent>
          </Card>
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
    </div>
  );
}
