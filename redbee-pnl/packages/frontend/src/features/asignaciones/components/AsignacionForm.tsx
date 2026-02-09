import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRecursos } from '../hooks/useAsignaciones';
import type { Asignacion, CreateAsignacionDto, UpdateAsignacionDto } from '../types/asignacion.types';

const schema = z.object({
  recursoId: z.string().min(1, 'El recurso es requerido'),
  porcentajeAsignacion: z.string().min(1, 'El porcentaje es requerido'),
  tipoTiempo: z.enum(['BILLABLE', 'NON_BILLABLE', 'OVERHEAD', 'BENCH']).optional(),
  fechaDesde: z.string().min(1, 'La fecha desde es requerida'),
  fechaHasta: z.string().optional(),
  rolEnProyecto: z.string().optional(),
  notas: z.string().optional(),
}).refine((d) => {
  if (d.porcentajeAsignacion) {
    const v = Number(d.porcentajeAsignacion);
    return !isNaN(v) && v >= 0 && v <= 200;
  }
  return true;
}, { message: 'Debe ser entre 0 y 200', path: ['porcentajeAsignacion'] })
.refine((d) => {
  if (d.fechaHasta && d.fechaDesde) return d.fechaHasta >= d.fechaDesde;
  return true;
}, { message: 'Fecha hasta debe ser posterior', path: ['fechaHasta'] });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: string;
  asignacion?: Asignacion | null;
  onSubmit: (data: CreateAsignacionDto | UpdateAsignacionDto) => void;
  isLoading?: boolean;
}

const tipoTiempoOptions = [
  { value: 'BILLABLE', label: 'Billable' },
  { value: 'NON_BILLABLE', label: 'Non-billable' },
  { value: 'OVERHEAD', label: 'Overhead' },
  { value: 'BENCH', label: 'Bench' },
];

export function AsignacionForm({ open, onOpenChange, proyectoId, asignacion, onSubmit, isLoading }: Props) {
  const isEditing = !!asignacion;
  const { data: recursosData } = useRecursos({ limit: 200 });

  const form = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      recursoId: asignacion?.recursoId || '',
      porcentajeAsignacion: asignacion ? String(asignacion.porcentajeAsignacion) : '100',
      tipoTiempo: asignacion?.tipoTiempo || 'BILLABLE',
      fechaDesde: asignacion?.fechaDesde?.split('T')[0] || '',
      fechaHasta: asignacion?.fechaHasta?.split('T')[0] || '',
      rolEnProyecto: asignacion?.rolEnProyecto || '',
      notas: asignacion?.notas || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        recursoId: asignacion?.recursoId || '',
        porcentajeAsignacion: asignacion ? String(asignacion.porcentajeAsignacion) : '100',
        tipoTiempo: asignacion?.tipoTiempo || 'BILLABLE',
        fechaDesde: asignacion?.fechaDesde?.split('T')[0] || '',
        fechaHasta: asignacion?.fechaHasta?.split('T')[0] || '',
        rolEnProyecto: asignacion?.rolEnProyecto || '',
        notas: asignacion?.notas || '',
      });
    }
  }, [open, asignacion, form]);

  const handleOpenChange = (v: boolean) => {
    if (!v) form.reset();
    onOpenChange(v);
  };

  const handleSubmit = (data: FormData) => {
    const cleaned: CreateAsignacionDto = {
      recursoId: data.recursoId,
      proyectoId,
      porcentajeAsignacion: Number(data.porcentajeAsignacion),
      tipoTiempo: data.tipoTiempo as CreateAsignacionDto['tipoTiempo'],
      fechaDesde: data.fechaDesde,
      fechaHasta: data.fechaHasta || undefined,
      rolEnProyecto: data.rolEnProyecto || undefined,
      notas: data.notas || undefined,
    };
    onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-stone-800">
            {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {isEditing ? 'Modificá los datos de la asignación.' : 'Asigná un recurso a este proyecto.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="recursoId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-700">Recurso</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 bg-white border-stone-200 focus:ring-stone-300">
                      <SelectValue placeholder="Seleccionar recurso" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {recursosData?.data.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.apellido}, {r.nombre} — {r.perfil?.nombre || 'Sin perfil'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="porcentajeAsignacion" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">Dedicación (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="200" placeholder="100" className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tipoTiempo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">Tipo de tiempo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-white border-stone-200 focus:ring-stone-300">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipoTiempoOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="fechaDesde" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">Fecha desde</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fechaHasta" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-700">Fecha hasta <span className="font-normal text-stone-400">(opc.)</span></FormLabel>
                  <FormControl>
                    <Input type="date" className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="rolEnProyecto" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-700">Rol en proyecto <span className="font-normal text-stone-400">(opc.)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Tech Lead" className="h-10 bg-white border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-300" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter className="pt-4 gap-3">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="border-stone-200 text-stone-600 hover:bg-stone-50">Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="bg-stone-800 hover:bg-stone-700 text-white focus:ring-amber-200">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear asignación'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
