import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import type { Perfil, CreatePerfilDto, UpdatePerfilDto, NivelPerfil } from '../types/perfil.types';

const NIVEL_OPTIONS: { value: NivelPerfil; label: string }[] = [
  { value: 'JR', label: 'Junior' },
  { value: 'SSR', label: 'Semi Senior' },
  { value: 'SR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'MANAGER', label: 'Manager' },
];

interface PerfilFormData {
  nombre: string;
  categoria: string;
  nivel?: NivelPerfil;
  estado: 'ACTIVO' | 'INACTIVO';
  descripcion?: string;
}

interface PerfilFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil?: Perfil | null;
  onSubmit: (data: CreatePerfilDto | UpdatePerfilDto) => void;
  isLoading?: boolean;
}

export function PerfilFormDialog({
  open,
  onOpenChange,
  perfil,
  onSubmit,
  isLoading,
}: PerfilFormDialogProps) {
  const form = useForm<PerfilFormData>({
    defaultValues: {
      nombre: '',
      categoria: '',
      nivel: undefined,
      estado: 'ACTIVO',
      descripcion: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (perfil) {
        form.reset({
          nombre: perfil.nombre,
          categoria: perfil.categoria,
          nivel: perfil.nivel || undefined,
          estado: perfil.estado,
          descripcion: perfil.descripcion || '',
        });
      } else {
        form.reset({
          nombre: '',
          categoria: '',
          nivel: undefined,
          estado: 'ACTIVO',
          descripcion: '',
        });
      }
    }
  }, [open, perfil, form]);

  const handleSubmit = (data: PerfilFormData) => {
    const dto: CreatePerfilDto | UpdatePerfilDto = {
      nombre: data.nombre,
      categoria: data.categoria,
      nivel: data.nivel,
      estado: data.estado,
      descripcion: data.descripcion || undefined,
    };
    onSubmit(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-stone-800">
            {perfil ? 'Editar Perfil' : 'Nuevo Perfil'}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {perfil
              ? 'Modifica los datos del perfil.'
              : 'Crea un nuevo perfil de recurso.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              rules={{ required: 'El nombre es requerido' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Developer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nivel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NIVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-stone-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-stone-800 hover:bg-stone-700"
              >
                {perfil ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
