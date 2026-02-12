import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useProyectoPnlYear } from '../hooks/useProyectoPnl';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Props {
  proyectoId: string;
}

type Moneda = 'USD' | 'ARS';

function fmtK(val: number, moneda: Moneda): string {
  const symbol = moneda === 'USD' ? 'U$' : '$';
  if (Math.abs(val) >= 1000) {
    return `${symbol}${(val / 1000).toFixed(1)}k`;
  }
  return `${symbol}${Math.round(val).toLocaleString('es-AR')}`;
}

function fmtPct(val: number | null): string {
  if (val === null) return '-';
  return `${val.toFixed(1)}%`;
}

function fmtFte(val: number): string {
  if (val === 0) return '-';
  return val.toFixed(1);
}

function colorForGm(gm: number | null): string {
  if (gm === null) return 'text-stone-400';
  if (gm >= 40) return 'text-emerald-600';
  if (gm >= 20) return 'text-amber-600';
  return 'text-red-600';
}

function colorForDiff(diff: number): string {
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-red-600';
  return 'text-stone-500';
}

export function ProyectoPnlGrid({ proyectoId }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [moneda, setMoneda] = useState<Moneda>('USD');

  const { data, isLoading } = useProyectoPnlYear(proyectoId, year);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  // Currency conversion helper
  const cv = (val: number, month: number): number => {
    if (!data || moneda === 'USD') return val;
    const fx = data.fxRates[month] || 1;
    return val * fx;
  };

  const cvTotal = (val: number): number => {
    if (!data || moneda === 'USD') return val;
    // For annual totals, use average FX
    let sumFx = 0;
    let countFx = 0;
    for (let m = 1; m <= 12; m++) {
      const fx = data.fxRates[m];
      if (fx) { sumFx += fx; countFx++; }
    }
    const avgFx = countFx > 0 ? sumFx / countFx : 1;
    return val * avgFx;
  };

  const fmt = (val: number, month?: number): string => {
    const converted = month != null ? cv(val, month) : cvTotal(val);
    return fmtK(converted, moneda);
  };

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader><CardTitle className="text-lg">P&L</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-96 w-full bg-stone-100" /></CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader><CardTitle className="text-lg">P&L</CardTitle></CardHeader>
        <CardContent><p className="text-stone-500 text-center py-12">No se pudo cargar P&L.</p></CardContent>
      </Card>
    );
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const t = data.totalesAnuales;

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-stone-800">
            P&L Mensual
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Currency toggle */}
            <div className="flex items-center rounded-md border border-stone-200 overflow-hidden">
              <button
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  moneda === 'USD'
                    ? 'bg-stone-800 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
                onClick={() => setMoneda('USD')}
              >
                USD
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  moneda === 'ARS'
                    ? 'bg-stone-800 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
                onClick={() => setMoneda('ARS')}
              >
                ARS
              </button>
            </div>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
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
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <KpiCard label="GM%" value={fmtPct(t.indicadores.gmPct)} colorClass={colorForGm(t.indicadores.gmPct)} />
          <KpiCard label="Revenue" value={fmt(t.revenue.asignado)} />
          <KpiCard label="Costos" value={fmt(t.costos.total)} />
          <KpiCard label="Margen" value={fmt(t.indicadores.diffAmount)} colorClass={colorForDiff(t.indicadores.diffAmount)} />
          <KpiCard label="FTEs Avg" value={fmtFte(t.indicadores.ftesAsignados)} />
          <KpiCard label="Blend Rate" value={t.indicadores.blendRate != null ? fmt(t.indicadores.blendRate) : '-'} />
          <KpiCard label="Blend Cost" value={t.indicadores.blendCost != null ? fmt(t.indicadores.blendCost) : '-'} />
        </div>

        {/* Monthly Grid */}
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200">
                <th className="text-left py-2 px-3 font-semibold text-stone-600 w-36 sticky left-0 bg-stone-50/80 z-10">
                  Concepto
                </th>
                {months.map((m) => (
                  <th key={m} className="text-right py-2 px-2 font-semibold text-stone-600 min-w-[72px]">
                    {MONTH_LABELS[m - 1]}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-bold text-stone-800 min-w-[80px] bg-stone-100/60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* REVENUE SECTION */}
              <SectionHeader label="REVENUE" />
              <DataRow
                label="Forecast"
                months={months}
                getValue={(m) => data.meses[m].revenue.forecast}
                getTotal={() => t.revenue.forecast}
                fmt={fmt}
                className="text-stone-600"
              />
              <DataRow
                label="Asignado"
                months={months}
                getValue={(m) => data.meses[m].revenue.asignado}
                getTotal={() => t.revenue.asignado}
                fmt={fmt}
                className="font-medium text-stone-800"
              />
              <DataRow
                label="No asignado"
                months={months}
                getValue={(m) => data.meses[m].revenue.noAsignado}
                getTotal={() => t.revenue.noAsignado}
                fmt={fmt}
                className="text-amber-600"
              />

              {/* COSTOS SECTION */}
              <SectionHeader label="COSTOS" />
              <DataRow
                label="Recursos"
                months={months}
                getValue={(m) => data.meses[m].costos.recursos}
                getTotal={() => t.costos.recursos}
                fmt={fmt}
                className="text-stone-600"
              />
              <DataRow
                label="Otros costos"
                months={months}
                getValue={(m) => data.meses[m].costos.otros}
                getTotal={() => t.costos.otros}
                fmt={fmt}
                className="text-stone-600"
              />
              <DataRow
                label="Guardias + Extras"
                months={months}
                getValue={(m) => data.meses[m].costos.guardiasExtras}
                getTotal={() => t.costos.guardiasExtras}
                fmt={fmt}
                className="text-stone-600"
              />
              <DataRow
                label="Total costos"
                months={months}
                getValue={(m) => data.meses[m].costos.total}
                getTotal={() => t.costos.total}
                fmt={fmt}
                className="font-medium text-stone-800"
                isBold
              />

              {/* INDICADORES SECTION */}
              <SectionHeader label="INDICADORES" />
              <IndicadorRow
                label="GM%"
                months={months}
                getValue={(m) => data.meses[m].indicadores.gmPct}
                getTotal={() => t.indicadores.gmPct}
                formatFn={fmtPct}
                colorFn={colorForGm}
              />
              <IndicadorRow
                label="Diff $"
                months={months}
                getValue={(m) => data.meses[m].indicadores.diffAmount}
                getTotal={() => t.indicadores.diffAmount}
                formatFn={(v) => v != null ? fmt(v) : '-'}
                colorFn={(v) => (v != null ? colorForDiff(v) : 'text-stone-400')}
              />
              <IndicadorRow
                label="Diff %"
                months={months}
                getValue={(m) => data.meses[m].indicadores.diffPct}
                getTotal={() => t.indicadores.diffPct}
                formatFn={fmtPct}
                colorFn={colorForGm}
              />
              <IndicadorRow
                label="FTEs Forecast"
                months={months}
                getValue={(m) => data.meses[m].indicadores.ftesForecast}
                getTotal={() => t.indicadores.ftesForecast}
                formatFn={(v) => v != null ? fmtFte(v) : '-'}
              />
              <IndicadorRow
                label="FTEs Asignados"
                months={months}
                getValue={(m) => data.meses[m].indicadores.ftesAsignados}
                getTotal={() => t.indicadores.ftesAsignados}
                formatFn={(v) => v != null ? fmtFte(v) : '-'}
              />
              <IndicadorRow
                label="FTEs No Asig."
                months={months}
                getValue={(m) => data.meses[m].indicadores.ftesNoAsignados}
                getTotal={() => t.indicadores.ftesNoAsignados}
                formatFn={(v) => v != null ? fmtFte(v) : '-'}
                colorFn={(v) => (v != null && v > 0 ? 'text-amber-600' : 'text-stone-500')}
              />
              <IndicadorRow
                label="Blend Rate"
                months={months}
                getValue={(m) => data.meses[m].indicadores.blendRate}
                getTotal={() => t.indicadores.blendRate}
                formatFn={(v) => v != null ? fmt(v) : '-'}
              />
              <IndicadorRow
                label="Blend Cost"
                months={months}
                getValue={(m) => data.meses[m].indicadores.blendCost}
                getTotal={() => t.indicadores.blendCost}
                formatFn={(v) => v != null ? fmt(v) : '-'}
              />
            </tbody>
          </table>
        </div>

        {moneda === 'ARS' && (
          <p className="text-xs text-stone-400 mt-2">
            Valores convertidos a ARS usando TC efectivo mensual.
            {data.monedaTarifario !== 'USD' && ` Tarifario en ${data.monedaTarifario}.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Sub-components ----------

function KpiCard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="rounded-lg border border-stone-200 p-3 bg-white">
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${colorClass || 'text-stone-800'}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr className="bg-stone-50/60 border-t border-stone-200">
      <td colSpan={14} className="py-1.5 px-3">
        <Badge variant="outline" className="text-[10px] font-semibold tracking-wider border-stone-300 text-stone-500">
          {label}
        </Badge>
      </td>
    </tr>
  );
}

interface DataRowProps {
  label: string;
  months: number[];
  getValue: (m: number) => number;
  getTotal: () => number;
  fmt: (val: number, month?: number) => string;
  className?: string;
  isBold?: boolean;
}

function DataRow({ label, months, getValue, getTotal, fmt, className = '', isBold }: DataRowProps) {
  const borderClass = isBold ? 'border-t border-stone-200' : 'border-t border-stone-50';
  return (
    <tr className={`${borderClass} hover:bg-stone-50/40 transition-colors`}>
      <td className={`py-1.5 px-3 text-stone-600 sticky left-0 bg-white z-10 ${isBold ? 'font-semibold' : ''}`}>
        {label}
      </td>
      {months.map((m) => {
        const val = getValue(m);
        return (
          <td key={m} className={`py-1.5 px-2 text-right tabular-nums ${className}`}>
            {val !== 0 ? fmt(val, m) : <span className="text-stone-300">-</span>}
          </td>
        );
      })}
      <td className={`py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 ${className}`}>
        {getTotal() !== 0 ? fmt(getTotal()) : <span className="text-stone-300">-</span>}
      </td>
    </tr>
  );
}

interface IndicadorRowProps {
  label: string;
  months: number[];
  getValue: (m: number) => number | null;
  getTotal: () => number | null;
  formatFn: (v: number | null) => string;
  colorFn?: (v: number | null) => string;
}

function IndicadorRow({ label, months, getValue, getTotal, formatFn, colorFn }: IndicadorRowProps) {
  return (
    <tr className="border-t border-stone-50 hover:bg-stone-50/40 transition-colors">
      <td className="py-1.5 px-3 text-stone-600 sticky left-0 bg-white z-10">{label}</td>
      {months.map((m) => {
        const val = getValue(m);
        const color = colorFn ? colorFn(val) : 'text-stone-600';
        return (
          <td key={m} className={`py-1.5 px-2 text-right tabular-nums ${color}`}>
            {formatFn(val)}
          </td>
        );
      })}
      <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60">
        <span className={colorFn ? colorFn(getTotal()) : 'text-stone-800'}>
          {formatFn(getTotal())}
        </span>
      </td>
    </tr>
  );
}
