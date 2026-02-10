import { useState } from 'react';
import { Plus, Pencil, Trash2, Receipt, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useTarifarios, useCreateFromTemplate } from '../hooks/useTarifarios';
import { useTarifarioMutations } from '../hooks/useTarifarioMutations';
import { TarifarioFormDialog } from './TarifarioFormDialog';
import { CreateFromTemplateDialog } from './CreateFromTemplateDialog';
import type { Tarifario, CreateTarifarioDto, UpdateTarifarioDto } from '../types/tarifario.types';

interface TarifariosTabProps {
  clienteId: string;
  clienteNombre?: string;
}

export function TarifariosTab({ clienteId, clienteNombre = 'este cliente' }: TarifariosTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTarifario, setSelectedTarifario] = useState<Tarifario | null>(null);

  const { data, isLoading } = useTarifarios({ clienteId });
  const { createTarifario, updateTarifario, deleteTarifario } = useTarifarioMutations();
  const createFromTemplate = useCreateFromTemplate();

  const handleCreate = (dto: CreateTarifarioDto) => {
    createTarifario.mutate(dto, {
      onSuccess: () => {
        setIsFormOpen(false);
        setSelectedTarifario(null);
      },
    });
  };

  const handleUpdate = (dto: UpdateTarifarioDto) => {
    if (!selectedTarifario) return;
    updateTarifario.mutate(
      { id: selectedTarifario.id, dto },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setSelectedTarifario(null);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteTarifario.mutate(id);
  };

  const handleOpenCreate = () => {
    setSelectedTarifario(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tarifario: Tarifario) => {
    setSelectedTarifario(tarifario);
    setIsFormOpen(true);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    createFromTemplate.mutate(
      { clienteId, templateId },
      {
        onSuccess: () => {
          setIsTemplateDialogOpen(false);
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'default';
      case 'INACTIVO':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const tarifarios = data?.items || [];

  return (
    <>
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-stone-600" />
                Tarifarios
              </CardTitle>
              <CardDescription className="text-stone-500">
                Gestiona los tarifarios y precios por perfil del cliente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsTemplateDialogOpen(true)}
                variant="outline"
                className="border-stone-200"
              >
                <Copy className="mr-2 h-4 w-4" />
                Desde Template
              </Button>
              <Button
                onClick={handleOpenCreate}
                className="bg-stone-800 hover:bg-stone-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Tarifario
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {tarifarios.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-stone-300 mb-4" />
              <p className="text-stone-500 mb-4">No hay tarifarios creados</p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="border-stone-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Tarifario
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tarifarios.map((tarifario) => (
                <Card key={tarifario.id} className="border-stone-200 hover:bg-stone-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-stone-800">{tarifario.nombre}</h3>
                          <Badge variant={getEstadoBadgeVariant(tarifario.estado)}>
                            {tarifario.estado}
                          </Badge>
                          <Badge variant="outline" className="border-stone-300">
                            {tarifario.moneda}
                          </Badge>
                        </div>
                        <div className="text-sm text-stone-600 space-y-1">
                          <p>
                            Vigencia: {formatDate(tarifario.fechaVigenciaDesde)}
                            {tarifario.fechaVigenciaHasta
                              ? ` - ${formatDate(tarifario.fechaVigenciaHasta)}`
                              : ' - Sin fecha fin'}
                          </p>
                          <p>
                            {tarifario._count?.lineas || 0} línea(s) • {tarifario._count?.proyectos || 0} proyecto(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(tarifario)}
                          className="border-stone-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-stone-200">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-stone-800">
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-stone-500">
                                Esta acción eliminará el tarifario "{tarifario.nombre}" y no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-stone-200 text-stone-600">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(tarifario.id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TarifarioFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        clienteId={clienteId}
        tarifario={selectedTarifario}
        onSubmit={(dto) => {
          if (selectedTarifario) {
            handleUpdate(dto as UpdateTarifarioDto);
          } else {
            handleCreate(dto as CreateTarifarioDto);
          }
        }}
        isLoading={createTarifario.isPending || updateTarifario.isPending}
      />

      <CreateFromTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        clienteId={clienteId}
        clienteNombre={clienteNombre}
        onConfirm={handleCreateFromTemplate}
        isLoading={createFromTemplate.isPending}
      />
    </>
  );
}
