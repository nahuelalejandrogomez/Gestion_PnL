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
import type { Cliente, CreateClienteDto, UpdateClienteDto, EstadoCliente } from '../types/cliente.types';

const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  cuilCuit: z.string().min(1, 'El CUIL/CUIT es requerido'),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'POTENCIAL']).optional(),
  fechaInicio: z.string().optional(),
  notas: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSubmit: (data: CreateClienteDto | UpdateClienteDto) => void;
  isLoading?: boolean;
}

const estadoOptions: { value: EstadoCliente; label: string }[] = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'POTENCIAL', label: 'Potencial' },
];

export function ClienteForm({
  open,
  onOpenChange,
  cliente,
  onSubmit,
  isLoading,
}: ClienteFormProps) {
  const isEditing = !!cliente;

  const form = useForm<ClienteFormData>({
    resolver: standardSchemaResolver(clienteSchema),
    defaultValues: {
      nombre: cliente?.nombre || '',
      razonSocial: cliente?.razonSocial || '',
      cuilCuit: cliente?.cuilCuit || '',
      estado: cliente?.estado || 'ACTIVO',
      fechaInicio: cliente?.fechaInicio?.split('T')[0] || '',
      notas: cliente?.notas || '',
    },
  });

  // Reset form when cliente changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (data: ClienteFormData) => {
    // Clean up empty strings
    const cleanedData = {
      ...data,
      fechaInicio: data.fechaInicio || undefined,
      notas: data.notas || undefined,
    };
    onSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modificá los datos del cliente.'
              : 'Completá los datos para crear un nuevo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre comercial</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Redbee Studios" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="razonSocial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón social</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Redbee S.A." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cuilCuit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIL/CUIT</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 30-12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Observaciones adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear cliente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
