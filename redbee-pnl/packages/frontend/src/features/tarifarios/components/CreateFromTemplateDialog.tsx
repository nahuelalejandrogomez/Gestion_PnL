import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTarifarios } from '../hooks/useTarifarios';

interface CreateFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNombre: string;
  onConfirm: (templateId: string) => void;
  isLoading?: boolean;
}

export function CreateFromTemplateDialog({
  open,
  onOpenChange,
  clienteId: _clienteId,
  clienteNombre,
  onConfirm,
  isLoading,
}: CreateFromTemplateDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Get templates (esTemplate = true)
  const { data: templatesData, isLoading: templatesLoading } = useTarifarios({
    esTemplate: true,
  });

  const templates = templatesData?.items || [];

  const handleConfirm = () => {
    if (selectedTemplateId) {
      onConfirm(selectedTemplateId);
      setSelectedTemplateId('');
    }
  };

  const handleCancel = () => {
    setSelectedTemplateId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-stone-800">Agregar desde Template</DialogTitle>
          <DialogDescription className="text-stone-500">
            Selecciona un tarifario template para copiar a {clienteNombre}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-stone-500">
                No hay templates disponibles. Crea un tarifario y márcalo como template.
              </p>
            ) : (
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Seleccionar template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nombre} ({template._count?.lineas || 0} líneas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTemplateId && (
            <p className="text-xs text-stone-500">
              Se creará un nuevo tarifario para {clienteNombre} copiando todas las líneas del template seleccionado.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-stone-200"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTemplateId || isLoading}
            className="bg-stone-800 hover:bg-stone-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear desde Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
