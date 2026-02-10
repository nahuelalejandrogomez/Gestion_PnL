import { useState } from 'react';
import { useClienteContratos } from '../hooks/useClienteContratos';
import { useCreateContrato, useUpdateContrato } from '../hooks/useContratoMutations';
import type { Contrato, CreateContratoDto, TipoContrato, EstadoContrato } from '../types/contrato.types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  FolderOpen, 
  Plus, 
  ExternalLink, 
  CheckCircle2,
  AlertCircle,
  Pencil,
} from 'lucide-react';

interface ContratosSectionProps {
  clienteId: string;
}

const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  MARCO: 'Marco',
  SOW: 'SOW',
  AMENDMENT: 'Adenda',
  MSA: 'MSA',
};

const ESTADO_CONTRATO_LABELS: Record<EstadoContrato, string> = {
  VIGENTE: 'Vigente',
  VENCIDO: 'Vencido',
  TERMINADO: 'Terminado',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function inferDriveType(url: string): 'folder' | 'file' | null {
  if (url.includes('/folders/') || url.includes('folderview')) return 'folder';
  if (url.includes('/file/') || url.includes('/d/')) return 'file';
  return null;
}

export function ContratosSection({ clienteId }: ContratosSectionProps) {
  const { data: contratos, isLoading, error } = useClienteContratos(clienteId);
  const createMutation = useCreateContrato(clienteId);
  const updateMutation = useUpdateContrato(clienteId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoContrato>('SOW');
  const [documentoDriveUrl, setDocumentoDriveUrl] = useState('');
  const [fechaFirma, setFechaFirma] = useState('');
  const [fechaInicioVigencia, setFechaInicioVigencia] = useState('');
  const [marcarVigente, setMarcarVigente] = useState(true);

  const resetForm = () => {
    setNombre('');
    setTipo('SOW');
    setDocumentoDriveUrl('');
    setFechaFirma(new Date().toISOString().split('T')[0]);
    setFechaInicioVigencia(new Date().toISOString().split('T')[0]);
    setMarcarVigente(true);
    setEditingContrato(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setNombre(contrato.nombre);
    setTipo(contrato.tipo);
    setDocumentoDriveUrl(contrato.documentoDriveUrl || '');
    setFechaFirma(contrato.fechaFirma.split('T')[0]);
    setFechaInicioVigencia(contrato.fechaInicioVigencia.split('T')[0]);
    setMarcarVigente(contrato.estado === 'VIGENTE');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || !fechaFirma || !fechaInicioVigencia) return;

    const dto: CreateContratoDto = {
      nombre: nombre.trim(),
      tipo,
      fechaFirma,
      fechaInicioVigencia,
      documentoDriveUrl: documentoDriveUrl.trim() || undefined,
      estado: marcarVigente ? 'VIGENTE' : 'VENCIDO',
    };

    try {
      if (editingContrato) {
        await updateMutation.mutateAsync({ id: editingContrato.id, dto });
      } else {
        await createMutation.mutateAsync(dto);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contratos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Error al cargar contratos</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const vigentes = contratos?.filter(c => c.estado === 'VIGENTE') || [];
  const otros = contratos?.filter(c => c.estado !== 'VIGENTE') || [];
  const sortedContratos = [...vigentes, ...otros];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Contratos</CardTitle>
          <CardDescription>
            Documentos y acuerdos con el cliente
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingContrato ? 'Editar Contrato' : 'Nuevo Contrato'}
              </DialogTitle>
              <DialogDescription>
                {editingContrato 
                  ? 'Modificar los datos del contrato' 
                  : 'Agregar un nuevo contrato o documento'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre / Título *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Contrato Marco 2026"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoContrato)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CONTRATO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fechaFirma">Fecha Firma *</Label>
                  <Input
                    id="fechaFirma"
                    type="date"
                    value={fechaFirma}
                    onChange={(e) => setFechaFirma(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaInicioVigencia">Inicio Vigencia *</Label>
                  <Input
                    id="fechaInicioVigencia"
                    type="date"
                    value={fechaInicioVigencia}
                    onChange={(e) => setFechaInicioVigencia(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="driveUrl">Link a Drive (opcional)</Label>
                <Input
                  id="driveUrl"
                  value={documentoDriveUrl}
                  onChange={(e) => setDocumentoDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Puede ser un archivo o una carpeta de Google Drive
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="vigente"
                  checked={marcarVigente}
                  onChange={(e) => setMarcarVigente(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="vigente" className="text-sm font-normal cursor-pointer">
                  Marcar como vigente (desactiva otros vigentes)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!nombre.trim() || !fechaFirma || !fechaInicioVigencia || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedContratos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay contratos registrados</p>
            <Button 
              variant="link" 
              className="mt-2 text-sm"
              onClick={openCreateDialog}
            >
              Agregar el primer contrato
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedContratos.map((contrato) => {
              const driveType = contrato.documentoDriveUrl 
                ? inferDriveType(contrato.documentoDriveUrl) 
                : null;
              const isVigente = contrato.estado === 'VIGENTE';
              
              return (
                <div
                  key={contrato.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isVigente 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${isVigente ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {driveType === 'folder' ? (
                        <FolderOpen className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {contrato.nombre}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {TIPO_CONTRATO_LABELS[contrato.tipo]}
                        </Badge>
                        {isVigente && (
                          <Badge className="bg-green-600 text-white text-xs flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Vigente
                          </Badge>
                        )}
                        {contrato.estado === 'VENCIDO' && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            {ESTADO_CONTRATO_LABELS[contrato.estado]}
                          </Badge>
                        )}
                        {contrato.estado === 'TERMINADO' && (
                          <Badge variant="outline" className="text-xs text-stone-500">
                            {ESTADO_CONTRATO_LABELS[contrato.estado]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vigencia: {formatDate(contrato.fechaInicioVigencia)}
                        {contrato.fechaFinVigencia && ` — ${formatDate(contrato.fechaFinVigencia)}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(contrato)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {contrato.documentoDriveUrl && (
                      <Button
                        size="sm"
                        variant={isVigente ? 'default' : 'outline'}
                        className={isVigente ? 'bg-green-600 hover:bg-green-700' : ''}
                        asChild
                      >
                        <a
                          href={contrato.documentoDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Abrir
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
