import { useState } from 'react';
import { AlertTriangle, DollarSign, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProyectoPnl } from '../hooks/useProyectoPnl';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  proyectoId: string;
}

export function ProyectoPnlResumen({ proyectoId }: Props) {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const { data, isLoading } = useProyectoPnl(proyectoId, anio, mes);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
          <SelectTrigger className="w-40 h-9 bg-white border-stone-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((label, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="w-24 h-9 bg-white border-stone-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data?.requiresTarifarios && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{data.revenueWarning}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-stone-200 bg-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Costos directos</span>
              </div>
              <p className="text-xl font-semibold text-stone-800">{formatCurrency(data.costosDirectos)}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200 bg-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">FTEs</span>
              </div>
              <p className="text-xl font-semibold text-stone-800">{data.ftes}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200 bg-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Horas / mes</span>
              </div>
              <p className="text-xl font-semibold text-stone-800">
                {data.detalle.reduce((sum, d) => sum + d.horasMes, 0).toFixed(0)}
              </p>
              <p className="text-xs text-stone-400">base {data.horasBaseMes}h</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200 bg-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Recursos</span>
              </div>
              <p className="text-xl font-semibold text-stone-800">{data.detalle.length}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {data && data.detalle.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="text-left py-2.5 px-4 font-medium text-stone-500">Recurso</th>
                <th className="text-left py-2.5 px-4 font-medium text-stone-500">Perfil</th>
                <th className="text-right py-2.5 px-4 font-medium text-stone-500">%</th>
                <th className="text-left py-2.5 px-4 font-medium text-stone-500">Tipo</th>
                <th className="text-right py-2.5 px-4 font-medium text-stone-500">Hs/mes</th>
                <th className="text-right py-2.5 px-4 font-medium text-stone-500">Costo mensual</th>
                <th className="text-right py-2.5 px-4 font-medium text-stone-500">Costo asignado</th>
              </tr>
            </thead>
            <tbody>
              {data.detalle.map((d) => (
                <tr key={d.recursoId} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="py-2.5 px-4 text-stone-800">{d.recursoNombre}</td>
                  <td className="py-2.5 px-4 text-stone-600">{d.perfilNombre}</td>
                  <td className="py-2.5 px-4 text-right text-stone-700">{d.porcentajeAsignacion}%</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-600">
                      {d.tipoTiempo}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-stone-700">{d.horasMes}</td>
                  <td className="py-2.5 px-4 text-right text-stone-700">{formatCurrency(d.costoMensualRecurso)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-stone-800">{formatCurrency(d.costoAsignacion)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50/80 border-t border-stone-200">
                <td colSpan={4} className="py-2.5 px-4 font-medium text-stone-700">Total</td>
                <td className="py-2.5 px-4 text-right font-medium text-stone-700">
                  {data.detalle.reduce((s, d) => s + d.horasMes, 0).toFixed(0)}
                </td>
                <td className="py-2.5 px-4" />
                <td className="py-2.5 px-4 text-right font-semibold text-stone-800">{formatCurrency(data.costosDirectos)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {data && data.detalle.length === 0 && (
        <p className="text-stone-500 text-center py-12">
          No hay asignaciones activas para {MESES[mes - 1]} {anio}.
        </p>
      )}
    </div>
  );
}
