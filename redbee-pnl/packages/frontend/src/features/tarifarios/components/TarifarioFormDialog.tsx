import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { usePerfiles } from '@/features/perfiles/hooks/usePerfiles';
import type { Tarifario, CreateTarifarioDto, UpdateTarifarioDto } from '../types/tarifario.types';

interface TarifarioFormData {
  nombre: string;
  fechaVigenciaDesde: string;
  fechaVigenciaHasta?: string;
  moneda: 'USD' | 'ARS';
  estado: 'ACTIVO' | 'INACTIVO' | 'DRAFT';
  notas?: string;
  lineas: Array<{
    perfilId: string;
    rate: number;
    unidad: 'FTE_MES';
    moneda?: 'USD' | 'ARS';
  }>;
}

interface TarifarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  tarifario?: Tarifario | null;
  onSubmit: (data: CreateTarifarioDto | UpdateTarifarioDto) => void;
  isLoading?: boolean;
}

export function TarifarioFormDialog({
  open,
  onOpenChange,
  clienteId,
  tarifario,
  onSubmit,
  isLoading,
}: TarifarioFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: perfilesData } = usePerfiles({ page: 1, limit: 100 });

  const form = useForm<TarifarioFormData>({
    defaultValues: {
      nombre: '',
      fechaVigenciaDesde: new Date().toISOString().split('T')[0],
      moneda: 'USD',
      estado: 'ACTIVO',
      lineas: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineas',
  });

  // Reset form when dialog opens/closes or tarifario changes
  useEffect(() => {
    if (open) {
      if (tarifario) {
        form.reset({
          nombre: tarifario.nombre,
          fechaVigenciaDesde: tarifario.fechaVigenciaDesde.split('T')[0],
          fechaVigenciaHasta: tarifario.fechaVigenciaHasta?.split('T')[0],
          moneda: tarifario.moneda,
          estado: tarifario.estado,
          notas: tarifario.notas || '',
          lineas:
            tarifario.lineas?.map((l) => ({
              perfilId: l.perfil?.id || '',
              rate: Number(l.rate),
              unidad: 'FTE_MES' as const,
              moneda: l.moneda || tarifario.moneda,
            })) || [],
        });
      } else {
        form.reset({
          nombre: '',
          fechaVigenciaDesde: new Date().toISOString().split('T')[0],
          moneda: 'USD',
          estado: 'ACTIVO',
          lineas: [],
        });
      }
    }
  }, [open, tarifario, form]);

  const handleSubmit = async (data: TarifarioFormData) => {
    setIsSubmitting(true);
    try {
      const dto: CreateTarifarioDto | UpdateTarifarioDto = {
        clienteId,
        nombre: data.nombre,
        fechaVigenciaDesde: new Date(data.fechaVigenciaDesde).toISOString(),
        fechaVigenciaHasta: data.fechaVigenciaHasta
          ? new Date(data.fechaVigenciaHasta).toISOString()
          : undefined,
        moneda: data.moneda,
        estado: data.estado,
        notas: data.notas,
        lineas: data.lineas.map((l) => ({
          perfilId: l.perfilId,
          rate: l.rate,
          unidad: 'MES' as const, // backend expects 'MES', not 'FTE_MES'
          moneda: l.moneda,
        })),
      };
      onSubmit(dto);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLinea = () => {
    const tarifarioMoneda = form.getValues('moneda');
    append({
      perfilId: '',
      rate: 0,
      unidad: 'FTE_MES',
      moneda: tarifarioMoneda,
    });
  };

  const perfiles = perfilesData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-stone-800">
            {tarifario ? 'Editar Tarifario' : 'Nuevo Tarifario'}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {tarifario
              ? 'Modifica los datos del tarifario y sus líneas.'
              : 'Crea un nuevo tarifario con las líneas de precios por perfil.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Datos del tarifario */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-700">Datos del Tarifario</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  rules={{ required: 'El nombre es requerido' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tarifario 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moneda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ARS">ARS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaVigenciaDesde"
                  rules={{ required: 'La fecha desde es requerida' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vigencia desde</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaVigenciaHasta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vigencia hasta</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVO">Activo</SelectItem>
                          <SelectItem value="INACTIVO">Inactivo</SelectItem>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Input placeholder="Notas adicionales..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Líneas del tarifario */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-700">
                  Líneas de Precios ({fields.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLinea}
                  className="border-stone-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Línea
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-stone-500 text-center py-4">
                  No hay líneas. Agrega al menos una línea de precio.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3 p-3 border border-stone-200 rounded-md">
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.perfilId`}
                      rules={{ required: 'Selecciona un perfil' }}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          {index === 0 && <FormLabel>Perfil</FormLabel>}
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar perfil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {perfiles.map((perfil) => (
                                <SelectItem key={perfil.id} value={perfil.id}>
                                  {perfil.nivel ? `${perfil.nombre} - ${perfil.nivel}` : perfil.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`lineas.${index}.rate`}
                      rules={{
                        required: 'El rate es requerido',
                        min: { value: 0, message: 'Debe ser >= 0' },
                      }}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          {index === 0 && <FormLabel>Rate</FormLabel>}
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`lineas.${index}.moneda`}
                      render={({ field }) => (
                        <FormItem className="w-28">
                          {index === 0 && <FormLabel>Moneda</FormLabel>}
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="ARS">ARS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isSubmitting}
                className="border-stone-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="bg-stone-800 hover:bg-stone-700"
              >
                {tarifario ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
