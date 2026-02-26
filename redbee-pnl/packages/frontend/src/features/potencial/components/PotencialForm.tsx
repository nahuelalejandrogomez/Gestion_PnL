/**
 * PotencialForm — Alta y edición de ClientePotencial (B-27)
 * Fuente: SPEC/modules/potencial.md
 *
 * Campos: nombre, descripcion, probabilidadCierre (requerido), estado,
 *         fechaEstimadaCierre, moneda, notas
 * Líneas: perfilId + nombreLinea + meses (ftes, revenueEstimado) — grilla 12 meses
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { perfilesApi } from '@/features/perfiles/api/perfilesApi';
import { MONTH_LABELS } from '@/features/pnl/utils/pnl.format';
import type {
  ClientePotencial,
  CreateClientePotencialDto,
  UpsertLineaDto,
  EstadoPotencial,
  Moneda,
} from '../types/potencial.types';

// ─── Tipos internos del form ───────────────────────────────────────────────────

interface LineaForm {
  id?: string;
  perfilId: string;
  nombreLinea: string;
  meses: Record<number, { ftes: string; revenueEstimado: string }>; // key: month 1-12
}

function emptyLinea(): LineaForm {
  const meses: Record<number, { ftes: string; revenueEstimado: string }> = {};
  for (let m = 1; m <= 12; m++) {
    meses[m] = { ftes: '', revenueEstimado: '' };
  }
  return { perfilId: '', nombreLinea: '', meses };
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface PotencialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  potencial: ClientePotencial | null;
  onSubmit: (
    data: { potencial: CreateClientePotencialDto; lineas: UpsertLineaDto[] },
    potencialId?: string,
  ) => void;
  isLoading: boolean;
}

export function PotencialForm({
  open,
  onOpenChange,
  potencial,
  onSubmit,
  isLoading,
}: PotencialFormProps) {
  const isEditing = !!potencial;
  const currentYear = new Date().getFullYear();

  // Estado del form principal
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [probabilidad, setProbabilidad] = useState('');
  const [estado, setEstado] = useState<EstadoPotencial>('ACTIVO');
  const [fechaCierre, setFechaCierre] = useState('');
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Perfiles disponibles
  const { data: perfilesData } = useQuery({
    queryKey: ['perfiles'],
    queryFn: () => perfilesApi.getAll({ limit: 200 }),
    staleTime: 10 * 60 * 1000,
    enabled: open,
  });
  const perfiles = perfilesData?.data ?? [];

  // Inicializar form al abrir
  useEffect(() => {
    if (!open) return;
    if (potencial) {
      setNombre(potencial.nombre);
      setDescripcion(potencial.descripcion ?? '');
      setProbabilidad(String(potencial.probabilidadCierre));
      setEstado(potencial.estado);
      setFechaCierre(potencial.fechaEstimadaCierre ? potencial.fechaEstimadaCierre.substring(0, 10) : '');
      setMoneda(potencial.moneda);
      setNotas(potencial.notas ?? '');

      // Cargar líneas existentes
      setLineas(
        potencial.lineas.map((l) => {
          const mesesMap: Record<number, { ftes: string; revenueEstimado: string }> = {};
          for (let m = 1; m <= 12; m++) {
            mesesMap[m] = { ftes: '', revenueEstimado: '' };
          }
          for (const mes of l.meses) {
            if (mes.year === currentYear) {
              mesesMap[mes.month] = {
                ftes: mes.ftes > 0 ? String(mes.ftes) : '',
                revenueEstimado: mes.revenueEstimado > 0 ? String(mes.revenueEstimado) : '',
              };
            }
          }
          return {
            id: l.id,
            perfilId: l.perfilId,
            nombreLinea: l.nombreLinea ?? '',
            meses: mesesMap,
          };
        }),
      );
    } else {
      setNombre('');
      setDescripcion('');
      setProbabilidad('');
      setEstado('ACTIVO');
      setFechaCierre('');
      setMoneda('USD');
      setNotas('');
      setLineas([]);
    }
    setErrors({});
  }, [open, potencial, currentYear]);

  // Validación
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    const prob = parseFloat(probabilidad);
    if (isNaN(prob) || prob < 0 || prob > 100) {
      e.probabilidad = 'Debe ser un número entre 0 y 100';
    }
    for (let i = 0; i < lineas.length; i++) {
      if (!lineas[i].perfilId) {
        e[`linea_${i}_perfil`] = 'Seleccioná un perfil';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const potencialDto: CreateClientePotencialDto = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      probabilidadCierre: parseFloat(probabilidad),
      estado,
      fechaEstimadaCierre: fechaCierre || undefined,
      moneda,
      notas: notas.trim() || undefined,
    };

    // Armar DTOs de líneas — solo incluye meses con valores
    const lineasDto: UpsertLineaDto[] = lineas
      .filter(l => l.perfilId)
      .map((l) => {
        const mesesDto = [];
        for (let m = 1; m <= 12; m++) {
          const cell = l.meses[m];
          const ftes = parseFloat(cell.ftes);
          const rev = parseFloat(cell.revenueEstimado);
          if (!isNaN(ftes) && ftes > 0) {
            mesesDto.push({
              year: currentYear,
              month: m,
              ftes: isNaN(ftes) ? 0 : ftes,
              revenueEstimado: isNaN(rev) ? 0 : rev,
            });
          }
        }
        return {
          id: l.id,
          perfilId: l.perfilId,
          nombreLinea: l.nombreLinea.trim() || undefined,
          meses: mesesDto,
        };
      });

    onSubmit({ potencial: potencialDto, lineas: lineasDto }, potencial?.id);
  };

  const addLinea = () => setLineas(prev => [...prev, emptyLinea()]);

  const removeLinea = (idx: number) =>
    setLineas(prev => prev.filter((_, i) => i !== idx));

  const updateLinea = (idx: number, field: 'perfilId' | 'nombreLinea', value: string) =>
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));

  const updateLineaMes = (lineaIdx: number, month: number, field: 'ftes' | 'revenueEstimado', value: string) =>
    setLineas(prev => prev.map((l, i) => {
      if (i !== lineaIdx) return l;
      return { ...l, meses: { ...l.meses, [month]: { ...l.meses[month], [field]: value } } };
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-stone-200">
        <DialogHeader>
          <DialogTitle className="text-stone-800">
            {isEditing ? `Editar — ${potencial?.nombre}` : 'Nuevo Potencial'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* ── Datos principales ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-stone-700">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Proyecto Analytics 2026"
                className={errors.nombre ? 'border-red-400' : 'border-stone-200'}
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-stone-700">
                Probabilidad de cierre (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={probabilidad}
                onChange={e => setProbabilidad(e.target.value)}
                placeholder="0 – 100"
                className={errors.probabilidad ? 'border-red-400' : 'border-stone-200'}
              />
              {errors.probabilidad && <p className="text-xs text-red-500">{errors.probabilidad}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-stone-700">Estado</Label>
              <Select value={estado} onValueChange={v => setEstado(v as EstadoPotencial)}>
                <SelectTrigger className="border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="GANADO">Ganado</SelectItem>
                  <SelectItem value="PERDIDO">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-stone-700">Moneda</Label>
              <Select value={moneda} onValueChange={v => setMoneda(v as Moneda)}>
                <SelectTrigger className="border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-stone-700">Fecha estimada de cierre</Label>
              <Input
                type="date"
                value={fechaCierre}
                onChange={e => setFechaCierre(e.target.value)}
                className="border-stone-200"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-stone-700">Descripción</Label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Descripción opcional..."
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-stone-700">Notas</Label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2}
                placeholder="Notas internas..."
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          </div>

          {/* ── Líneas ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-700">Líneas de staffing</p>
                <p className="text-xs text-stone-400">
                  FTEs y revenue estimado por perfil para {currentYear}. Los costos son 0 (potencial no tiene nómina).
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addLinea}
                className="border-stone-200 text-stone-600 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar línea
              </Button>
            </div>

            {lineas.map((linea, idx) => (
              <div key={idx} className="rounded-lg border border-stone-200 bg-stone-50/40 p-4 space-y-3">
                {/* Cabecera de línea */}
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-stone-600">
                      Perfil <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={linea.perfilId}
                      onValueChange={v => updateLinea(idx, 'perfilId', v)}
                    >
                      <SelectTrigger className={`h-8 text-xs border-stone-200 ${errors[`linea_${idx}_perfil`] ? 'border-red-400' : ''}`}>
                        <SelectValue placeholder="Seleccioná un perfil..." />
                      </SelectTrigger>
                      <SelectContent>
                        {perfiles.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}{p.nivel ? ` — ${p.nivel}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`linea_${idx}_perfil`] && (
                      <p className="text-xs text-red-500">{errors[`linea_${idx}_perfil`]}</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-stone-600">Nombre de línea (opcional)</Label>
                    <Input
                      value={linea.nombreLinea}
                      onChange={e => updateLinea(idx, 'nombreLinea', e.target.value)}
                      placeholder="Ej: Dev Backend"
                      className="h-8 text-xs border-stone-200"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLinea(idx)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Grilla meses */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-stone-200">
                        <th className="text-left py-1 pr-2 text-stone-500 font-medium w-20">Campo</th>
                        {MONTH_LABELS.map(m => (
                          <th key={m} className="text-center py-1 px-1 text-stone-500 font-medium min-w-[56px]">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-stone-100">
                        <td className="py-1 pr-2 text-stone-500 font-medium">FTEs</td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <td key={m} className="py-1 px-1">
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={linea.meses[m]?.ftes ?? ''}
                              onChange={e => updateLineaMes(idx, m, 'ftes', e.target.value)}
                              placeholder="0"
                              className="h-6 text-[11px] border-stone-200 px-1.5 text-center [appearance:textfield]"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1 pr-2 text-stone-500 font-medium">Rev. est.</td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <td key={m} className="py-1 px-1">
                            <Input
                              type="number"
                              min={0}
                              value={linea.meses[m]?.revenueEstimado ?? ''}
                              onChange={e => updateLineaMes(idx, m, 'revenueEstimado', e.target.value)}
                              placeholder="0"
                              className="h-6 text-[11px] border-stone-200 px-1.5 text-center [appearance:textfield]"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Revenue estimado en {moneda}. Los costos son 0 por diseño (el potencial no tiene costo de nómina).
                  </p>
                </div>
              </div>
            ))}

            {lineas.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-4">
                Sin líneas de staffing. Podés guardar el potencial sin líneas y agregarlas después.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-stone-100 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-stone-200 text-stone-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-stone-800 hover:bg-stone-900 text-white"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear potencial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
