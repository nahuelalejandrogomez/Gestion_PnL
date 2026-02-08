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
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isEditing
              ? 'Modificá los datos del cliente.'
              : 'Completá los datos para crear un nuevo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-5 space-y-5">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">Nombre comercial</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Redbee Studios" 
                      className="h-11 bg-white border-slate-200 focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff]/20" 
                      {...field} 
                    />
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
                  <FormLabel className="text-slate-700 font-medium">Razón social</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Redbee S.A." 
                      className="h-11 bg-white border-slate-200 focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff]/20" 
                      {...field} 
                    />
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
                  <FormLabel className="text-slate-700 font-medium">CUIL/CUIT</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: 30-12345678-9" 
                      className="h-11 bg-white border-slate-200 focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff]/20 font-mono" 
                      {...field} 
                    />
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
                    <FormLabel className="text-slate-700 font-medium">Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-white border-slate-200">
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
                    <FormLabel className="text-slate-700 font-medium">Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="h-11 bg-white border-slate-200 focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff]/20" 
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
                  <FormLabel className="text-slate-700 font-medium">Notas <span className="font-normal text-slate-400">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Observaciones adicionales..." 
                      className="h-11 bg-white border-slate-200 focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff]/20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t border-slate-100 mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#0066ff] hover:bg-[#0052cc] text-white shadow-sm"
              >
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
