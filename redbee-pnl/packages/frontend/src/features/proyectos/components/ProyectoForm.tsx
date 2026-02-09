import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import type { Proyecto, CreateProyectoDto, UpdateProyectoDto, TipoProyecto, EstadoProyecto } from '../types/proyecto.types';

const proyectoSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().min(1, 'El código es requerido'),
  tipo: z.enum(['PROYECTO', 'POTENCIAL', 'SOPORTE', 'RETAINER']).optional(),
  estado: z.enum(['ACTIVO', 'PAUSADO', 'CERRADO', 'POTENCIAL', 'TENTATIVO']).optional(),
  probabilidadCierre: z.string().optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFinEstimada: z.string().optional(),
  fechaFinReal: z.string().optional(),
  notas: z.string().optional(),
}).refine(
  (data) => {
    if (data.fechaFinEstimada && data.fechaInicio) {
      return data.fechaFinEstimada >= data.fechaInicio;
    }
    return true;
  },
  { message: 'La fecha fin estimada debe ser posterior al inicio', path: ['fechaFinEstimada'] },
).refine(
  (data) => {
    if (data.fechaFinReal && data.fechaInicio) {
      return data.fechaFinReal >= data.fechaInicio;
    }
    return true;
  },
  { message: 'La fecha fin real debe ser posterior al inicio', path: ['fechaFinReal'] },
).refine(
  (data) => {
    if (data.probabilidadCierre) {
      const val = Number(data.probabilidadCierre);
      return !isNaN(val) && val >= 0 && val <= 100;
    }
    return true;
  },
  { message: 'Debe ser un valor entre 0 y 100', path: ['probabilidadCierre'] },
);

type ProyectoFormData = z.infer<typeof proyectoSchema>;

interface ProyectoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyecto?: Proyecto | null;
  onSubmit: (data: CreateProyectoDto | UpdateProyectoDto) => void;
  isLoading?: boolean;
}

const tipoOptions: { value: TipoProyecto; label: string }[] = [
  { value: 'PROYECTO', label: 'Proyecto' },
  { value: 'POTENCIAL', label: 'Potencial' },
  { value: 'SOPORTE', label: 'Soporte' },
  { value: 'RETAINER', label: 'Retainer' },
];

const estadoOptions: { value: EstadoProyecto; label: string }[] = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'POTENCIAL', label: 'Potencial' },
  { value: 'TENTATIVO', label: 'Tentativo' },
];

export function ProyectoForm({
  open,
  onOpenChange,
  proyecto,
  onSubmit,
  isLoading,
}: ProyectoFormProps) {
  const isEditing = !!proyecto;

  const { data: clientesData } = useClientes({ limit: 100 });

  const form = useForm<ProyectoFormData>({
    resolver: standardSchemaResolver(proyectoSchema),
    defaultValues: {
      clienteId: proyecto?.clienteId || '',
      nombre: proyecto?.nombre || '',
      codigo: proyecto?.codigo || '',
      tipo: proyecto?.tipo || 'PROYECTO',
      estado: proyecto?.estado || 'ACTIVO',
      probabilidadCierre: proyecto?.probabilidadCierre != null ? String(proyecto.probabilidadCierre) : '',
      fechaInicio: proyecto?.fechaInicio?.split('T')[0] || '',
      fechaFinEstimada: proyecto?.fechaFinEstimada?.split('T')[0] || '',
      fechaFinReal: proyecto?.fechaFinReal?.split('T')[0] || '',
      notas: proyecto?.notas || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        clienteId: proyecto?.clienteId || '',
        nombre: proyecto?.nombre || '',
        codigo: proyecto?.codigo || '',
        tipo: proyecto?.tipo || 'PROYECTO',
        estado: proyecto?.estado || 'ACTIVO',
        probabilidadCierre: proyecto?.probabilidadCierre != null ? String(proyecto.probabilidadCierre) : '',
        fechaInicio: proyecto?.fechaInicio?.split('T')[0] || '',
        fechaFinEstimada: proyecto?.fechaFinEstimada?.split('T')[0] || '',
        fechaFinReal: proyecto?.fechaFinReal?.split('T')[0] || '',
        notas: proyecto?.notas || '',
      });
    }
  }, [open, proyecto, form]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (data: ProyectoFormData) => {
    const cleanedData: CreateProyectoDto | UpdateProyectoDto = {
      clienteId: data.clienteId,
      nombre: data.nombre,
      codigo: data.codigo,
      tipo: data.tipo as TipoProyecto,
      estado: data.estado as EstadoProyecto,
      fechaInicio: data.fechaInicio,
      probabilidadCierre: data.probabilidadCierre ? Number(data.probabilidadCierre) : undefined,
      fechaFinEstimada: data.fechaFinEstimada || undefined,
      fechaFinReal: data.fechaFinReal || undefined,
      notas: data.notas || undefined,
    };
    onSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-stone-800">
            {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {isEditing
              ? 'Modificá los datos del proyecto.'
              : 'Completá los datos para crear un nuevo proyecto.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-white border-stone-200 focus:ring-stone-300">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientesData?.data.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Migración Cloud"
                        className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: LINK-MAIN"
                        className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-white border-stone-200 focus:ring-stone-300">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-white border-stone-200 focus:ring-stone-300">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estadoOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="probabilidadCierre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">
                    Probabilidad de cierre (%) <span className="font-normal text-stone-400">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ej: 75"
                      className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">Fecha inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaFinEstimada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">
                      Fin estimada <span className="font-normal text-stone-400">(opc.)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaFinReal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-stone-700">
                      Fin real <span className="font-normal text-stone-400">(opc.)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">
                    Notas <span className="font-normal text-stone-400">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Observaciones adicionales..."
                      rows={3}
                      className="flex w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 placeholder:text-stone-400 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-stone-800 hover:bg-stone-700 text-white focus:ring-amber-200"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear proyecto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
