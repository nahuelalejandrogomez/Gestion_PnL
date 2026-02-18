/**
 * PnlsRealesTable - Vista PNLs Reales multi-métrica
 * ÉPICA 4 US-010: Tabla consolidada multi-métrica por cliente y mes
 * ÉPICA 4 US-011: Totales y validación multi-métrica
 *
 * Métricas mostradas:
 * - Revenue USD (revenueReal ?? revenueAsignado)
 * - Revenue ARS (convertido con FX rates)
 * - FTEs (ftesReales ?? ftesAsignados)
 * - Gross (gross calculado)
 * - Costos (recursosReales + otrosReales ?? costosProyectados)
 * - GM% (gmPct con color coding)
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PaisBadge } from '@/features/clientes/components/PaisBadge';
import { TipoComercialBadge } from '@/features/clientes/components/TipoComercialBadge';
import { useFilteredRollingData } from '../hooks/useFilteredRollingData';
import { MONTH_LABELS, fmtCurrency, fmtFte, fmtPct, colorForGm } from '@/features/pnl/utils/pnl.format';
import type { ClienteRollingData, PaisCliente, TipoComercialCliente } from '../types/rolling.types';

interface PnlsRealesTableProps {
  year: number;
  paisFilter: PaisCliente | 'TODOS';
  tipoComercialFilter: TipoComercialCliente | 'TODOS';
}

type Moneda = 'USD' | 'ARS';

export function PnlsRealesTable({ year, paisFilter, tipoComercialFilter }: PnlsRealesTableProps) {
  const { data, isLoading, error } = useFilteredRollingData(year, paisFilter, tipoComercialFilter);
  const [expandedClientes, setExpandedClientes] = useState<Set<string>>(new Set());
  const [moneda, setMoneda] = useState<Moneda>('USD');

  const toggleCliente = (clienteId: string) => {
    setExpandedClientes((prev) => {
      const next = new Set(prev);
      if (next.has(clienteId)) {
        next.delete(clienteId);
      } else {
        next.add(clienteId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">PNLs Reales (Multi-Métrica)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full bg-stone-100" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">PNLs Reales (Multi-Métrica)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center py-12">
            Error al cargar datos: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.clientes.length === 0) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">PNLs Reales (Multi-Métrica)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-stone-500 text-center py-12">
            No hay clientes activos con datos para {year}
          </p>
        </CardContent>
      </Card>
    );
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const fxRates = data.fxRates || {};

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-stone-800">
            PNLs Reales (Multi-Métrica) - {year}
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Currency Toggle */}
            <div className="inline-flex rounded-md shadow-sm border border-stone-200 bg-white">
              <button
                onClick={() => setMoneda('USD')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  moneda === 'USD'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setMoneda('ARS')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-stone-200 ${
                  moneda === 'ARS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                ARS
              </button>
            </div>
            <div className="text-xs text-stone-500">
              {data.clientes.length} cliente{data.clientes.length !== 1 ? 's' : ''} activo{data.clientes.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200">
                <th className="text-left py-2 px-3 font-semibold text-stone-600 w-48 sticky left-0 bg-stone-50/80 z-10">
                  Concepto / Métrica
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="text-right py-2 px-2 font-semibold text-stone-600 min-w-[80px]"
                  >
                    {MONTH_LABELS[m - 1]}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-bold text-stone-800 min-w-[90px] bg-stone-100/60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Renderizar cada cliente con métricas expandibles */}
              {data.clientes.map((cliente) => (
                <ClienteSection
                  key={cliente.clienteId}
                  cliente={cliente}
                  months={months}
                  fxRates={fxRates}
                  moneda={moneda}
                  isExpanded={expandedClientes.has(cliente.clienteId)}
                  onToggle={() => toggleCliente(cliente.clienteId)}
                />
              ))}

              {/* Totales consolidados */}
              <TotalesSection
                clientes={data.clientes}
                months={months}
                fxRates={fxRates}
                moneda={moneda}
              />
            </tbody>
          </table>
        </div>

        {data.totalClientes > data.clientes.length && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ {data.totalClientes - data.clientes.length} cliente
            {data.totalClientes - data.clientes.length !== 1 ? 's' : ''} sin datos para {year}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Helper para convertir USD a ARS
 */
function convertToARS(valueUSD: number, month: number, fxRates: Record<number, number>): number {
  const rate = fxRates[month] ?? 1;
  return valueUSD * rate;
}

/**
 * Sección de cliente: fila principal expandible + subfilas con métricas
 */
function ClienteSection({
  cliente,
  months,
  fxRates,
  moneda,
  isExpanded,
  onToggle,
}: {
  cliente: ClienteRollingData;
  months: number[];
  fxRates: Record<number, number>;
  moneda: Moneda;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Fila Principal (expandible) */}
      <tr className="border-t-2 border-stone-300 bg-stone-50/40 hover:bg-stone-100/60 transition-colors">
        <td className="py-2 px-3 sticky left-0 bg-stone-50/40 hover:bg-stone-100/60 z-10">
          <div className="flex flex-col gap-1">
            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 font-bold text-stone-800 hover:text-stone-900 w-full text-left"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
              )}
              <span>{cliente.clienteNombre}</span>
            </button>
            <div className="flex items-center gap-1 ml-5">
              <PaisBadge pais={cliente.pais} size="sm" />
              <TipoComercialBadge tipoComercial={cliente.tipoComercial} size="sm" />
            </div>
          </div>
        </td>
        {months.map((m) => {
          const monthData = cliente.meses[m];
          if (!monthData) {
            return (
              <td key={m} className="py-2 px-2 text-right tabular-nums text-stone-400">
                -
              </td>
            );
          }

          // Fila principal muestra Revenue (revenueReal ?? revenueAsignado)
          const hasReal = monthData.revenueReal !== null;
          let revenue = monthData.revenueReal ?? monthData.revenueAsignado;

          // Convertir a ARS si aplica
          if (moneda === 'ARS') {
            revenue = convertToARS(revenue, m, fxRates);
          }

          return (
            <td key={m} className="py-2 px-2 text-right tabular-nums font-semibold text-stone-800">
              <div className="flex items-center justify-end gap-1">
                {revenue > 0 ? fmtCurrency(revenue, moneda) : <span className="text-stone-300">-</span>}
                {hasReal && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-blue-500 text-blue-600 bg-blue-50">
                    Real
                  </Badge>
                )}
              </div>
            </td>
          );
        })}
        <td className="py-2 px-3 text-right tabular-nums font-bold text-stone-900 bg-stone-100/60">
          {(() => {
            // Total anual = suma de revenue mensual
            let totalAnual = 0;
            for (let m = 1; m <= 12; m++) {
              const monthData = cliente.meses[m];
              if (monthData) {
                let monthRevenue = monthData.revenueReal ?? monthData.revenueAsignado;
                if (moneda === 'ARS') {
                  monthRevenue = convertToARS(monthRevenue, m, fxRates);
                }
                totalAnual += monthRevenue;
              }
            }
            return fmtCurrency(totalAnual, moneda);
          })()}
        </td>
      </tr>

      {/* Subfilas de métricas (solo si expandido) */}
      {isExpanded && (
        <>
          {/* Subfila: Revenue (moneda según toggle) */}
          <MetricRow
            label="Revenue"
            months={months}
            cliente={cliente}
            metricType="revenue"
            displayMoneda={moneda}
            fxRates={fxRates}
          />

          {/* Subfila: FTEs */}
          <MetricRow
            label="FTEs"
            months={months}
            cliente={cliente}
            metricType="ftes"
            displayMoneda="USD"
            fxRates={fxRates}
          />

          {/* Subfila: Costos */}
          <MetricRow
            label="Costos"
            months={months}
            cliente={cliente}
            metricType="costos"
            displayMoneda={moneda}
            fxRates={fxRates}
          />

          {/* Subfila: Gross */}
          <MetricRow
            label="Gross"
            months={months}
            cliente={cliente}
            metricType="gross"
            displayMoneda={moneda}
            fxRates={fxRates}
          />

          {/* Subfila: GM% */}
          <MetricRow
            label="GM%"
            months={months}
            cliente={cliente}
            metricType="gmPct"
            displayMoneda="USD"
            fxRates={fxRates}
          />
        </>
      )}
    </>
  );
}

/**
 * Componente para renderizar una fila de métrica
 */
function MetricRow({
  label,
  months,
  cliente,
  metricType,
  displayMoneda,
  fxRates,
}: {
  label: string;
  months: number[];
  cliente: ClienteRollingData;
  metricType: 'revenue' | 'ftes' | 'costos' | 'gross' | 'gmPct';
  displayMoneda: Moneda;
  fxRates: Record<number, number>;
}) {
  // Determinar color y estilo según métrica
  const labelClass =
    metricType === 'gmPct'
      ? 'text-stone-700 font-semibold'
      : metricType === 'gross'
      ? 'text-green-700'
      : metricType === 'costos'
      ? 'text-red-700'
      : 'text-stone-600';

  // Calcular total anual
  let totalAnual = 0;
  let countMonths = 0;

  for (let m = 1; m <= 12; m++) {
    const monthData = cliente.meses[m];
    if (!monthData) continue;

    let value = 0;
    switch (metricType) {
      case 'revenue':
        value = monthData.revenueReal ?? monthData.revenueAsignado;
        if (displayMoneda === 'ARS') {
          value = convertToARS(value, m, fxRates);
        }
        totalAnual += value;
        countMonths++;
        break;
      case 'ftes':
        value = monthData.ftesReales ?? monthData.ftesAsignados;
        totalAnual += value;
        countMonths++;
        break;
      case 'costos':
        value =
          (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
        if (displayMoneda === 'ARS') {
          value = convertToARS(value, m, fxRates);
        }
        totalAnual += value;
        countMonths++;
        break;
      case 'gross':
        // Recalcular Gross = revenue efectivo - costos efectivos
        const revenueGross = monthData.revenueReal ?? monthData.revenueAsignado;
        const costosGross = (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
        value = revenueGross - costosGross;
        if (displayMoneda === 'ARS') {
          value = convertToARS(value, m, fxRates);
        }
        totalAnual += value;
        countMonths++;
        break;
      case 'gmPct':
        // Recalcular GM% = (Gross / Revenue) * 100
        const revenueGm = monthData.revenueReal ?? monthData.revenueAsignado;
        const costosGm = (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
        const grossGm = revenueGm - costosGm;
        if (revenueGm > 0) {
          const gmPctCalc = (grossGm / revenueGm) * 100;
          totalAnual += gmPctCalc;
          countMonths++;
        }
        break;
    }
  }

  // Para GM%, mostrar promedio; para otros, suma
  const totalDisplay =
    metricType === 'gmPct' && countMonths > 0
      ? totalAnual / countMonths
      : totalAnual;

  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50/40 transition-colors">
      <td className={`py-1.5 px-3 pl-8 text-[11px] sticky left-0 bg-white z-10 ${labelClass}`}>
        {label}
      </td>
      {months.map((m) => {
        const monthData = cliente.meses[m];
        if (!monthData) {
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums text-stone-400">
              -
            </td>
          );
        }

        let value: number | null = null;
        let formattedValue = '-';

        switch (metricType) {
          case 'revenue':
            value = monthData.revenueReal ?? monthData.revenueAsignado;
            if (displayMoneda === 'ARS') {
              value = convertToARS(value, m, fxRates);
            }
            formattedValue = value > 0 ? fmtCurrency(value, displayMoneda) : '-';
            break;
          case 'ftes':
            value = monthData.ftesReales ?? monthData.ftesAsignados;
            formattedValue = value > 0 ? fmtFte(value) : '-';
            break;
          case 'costos':
            value =
              (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
            if (displayMoneda === 'ARS') {
              value = convertToARS(value, m, fxRates);
            }
            formattedValue = value > 0 ? fmtCurrency(value, displayMoneda) : '-';
            break;
          case 'gross':
            // Recalcular Gross = revenue efectivo - costos efectivos
            {
              const revenueGross = monthData.revenueReal ?? monthData.revenueAsignado;
              const costosGross = (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
              value = revenueGross - costosGross;
              if (displayMoneda === 'ARS') {
                value = convertToARS(value, m, fxRates);
              }
              formattedValue = fmtCurrency(value, displayMoneda);
            }
            break;
          case 'gmPct':
            // Recalcular GM% = (Gross / Revenue) * 100
            {
              const revenueGm = monthData.revenueReal ?? monthData.revenueAsignado;
              const costosGm = (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
              const grossGm = revenueGm - costosGm;
              if (revenueGm > 0) {
                value = (grossGm / revenueGm) * 100;
                formattedValue = fmtPct(value);
              }
            }
            break;
        }

        const cellClass =
          metricType === 'gmPct' && value !== null
            ? colorForGm(value)
            : metricType === 'gross'
            ? value && value < 0
              ? 'text-red-600'
              : 'text-green-700'
            : 'text-stone-600';

        return (
          <td key={m} className={`py-1.5 px-2 text-right tabular-nums ${cellClass}`}>
            {formattedValue}
          </td>
        );
      })}
      <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60">
        {(() => {
          if (metricType === 'gmPct') {
            return countMonths > 0 ? fmtPct(totalDisplay) : '-';
          } else if (metricType === 'ftes') {
            return fmtFte(totalDisplay);
          } else {
            return totalDisplay > 0 ? fmtCurrency(totalDisplay, displayMoneda) : '-';
          }
        })()}
      </td>
    </tr>
  );
}

/**
 * Sección de TOTALES consolidados
 */
function TotalesSection({
  clientes,
  months,
  fxRates,
  moneda,
}: {
  clientes: ClienteRollingData[];
  months: number[];
  fxRates: Record<number, number>;
  moneda: Moneda;
}) {
  // Calcular totales por mes y anual para cada métrica
  const aggregates: Record<
    number,
    {
      revenue: number;
      ftes: number;
      costos: number;
      gross: number;
      gmPct: number | null;
    }
  > = {};

  for (let m = 1; m <= 12; m++) {
    let revMonth = 0;
    let ftesMonth = 0;
    let costosMonth = 0;

    for (const cliente of clientes) {
      const monthData = cliente.meses[m];
      if (!monthData) continue;

      revMonth += monthData.revenueReal ?? monthData.revenueAsignado;
      ftesMonth += monthData.ftesReales ?? monthData.ftesAsignados;
      costosMonth +=
        (monthData.recursosReales ?? 0) + (monthData.otrosReales ?? 0) || monthData.costosProyectados;
    }

    // Recalcular Gross = revenue total - costos total
    const grossMonth = revMonth - costosMonth;

    // Recalcular GM% = (Gross / Revenue) * 100
    const gmPctMonth = revMonth > 0 ? (grossMonth / revMonth) * 100 : null;

    aggregates[m] = {
      revenue: revMonth,
      ftes: ftesMonth,
      costos: costosMonth,
      gross: grossMonth,
      gmPct: gmPctMonth,
    };
  }

  // Calcular totales anuales
  let revAnual = 0;
  let ftesAnual = 0;
  let costosAnual = 0;

  for (let m = 1; m <= 12; m++) {
    revAnual += aggregates[m].revenue;
    ftesAnual += aggregates[m].ftes;
    costosAnual += aggregates[m].costos;
  }

  // Recalcular Gross anual = revenue anual - costos anual
  const grossAnual = revAnual - costosAnual;

  // Recalcular GM% anual = (Gross anual / Revenue anual) * 100
  const gmAnual = revAnual > 0 ? (grossAnual / revAnual) * 100 : null;

  return (
    <>
      {/* Fila TOTAL Revenue */}
      <tr className="border-t-4 border-stone-400 bg-stone-100/80">
        <td className="py-2 px-3 font-bold text-stone-900 uppercase text-[11px] sticky left-0 bg-stone-100/80 z-10">
          TOTAL REVENUE
        </td>
        {months.map((m) => {
          let value = aggregates[m].revenue;
          if (moneda === 'ARS') {
            value = convertToARS(value, m, fxRates);
          }
          return (
            <td key={m} className="py-2 px-2 text-right tabular-nums font-bold text-stone-900">
              {value > 0 ? fmtCurrency(value, moneda) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-2 px-3 text-right tabular-nums font-bold text-stone-900 bg-stone-200/60">
          {(() => {
            let total = revAnual;
            if (moneda === 'ARS') {
              total = 0;
              for (let m = 1; m <= 12; m++) {
                total += convertToARS(aggregates[m].revenue, m, fxRates);
              }
            }
            return fmtCurrency(total, moneda);
          })()}
        </td>
      </tr>

      {/* Fila TOTAL FTEs */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-stone-700 font-semibold sticky left-0 bg-white z-10">
          Total FTEs
        </td>
        {months.map((m) => {
          const value = aggregates[m].ftes;
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums font-semibold text-stone-700">
              {value > 0 ? fmtFte(value) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-stone-700">
          {fmtFte(ftesAnual)}
        </td>
      </tr>

      {/* Fila TOTAL Costos */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-red-700 font-semibold sticky left-0 bg-white z-10">
          Total Costos
        </td>
        {months.map((m) => {
          let value = aggregates[m].costos;
          if (moneda === 'ARS') {
            value = convertToARS(value, m, fxRates);
          }
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums font-semibold text-red-700">
              {value > 0 ? fmtCurrency(value, moneda) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-red-700">
          {(() => {
            let total = costosAnual;
            if (moneda === 'ARS') {
              total = 0;
              for (let m = 1; m <= 12; m++) {
                total += convertToARS(aggregates[m].costos, m, fxRates);
              }
            }
            return fmtCurrency(total, moneda);
          })()}
        </td>
      </tr>

      {/* Fila TOTAL Gross */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-green-700 font-semibold sticky left-0 bg-white z-10">
          Total Gross
        </td>
        {months.map((m) => {
          let value = aggregates[m].gross;
          if (moneda === 'ARS') {
            value = convertToARS(value, m, fxRates);
          }
          const colorClass = value < 0 ? 'text-red-600' : 'text-green-700';
          return (
            <td key={m} className={`py-1.5 px-2 text-right tabular-nums font-semibold ${colorClass}`}>
              {fmtCurrency(value, moneda)}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-green-700">
          {(() => {
            let total = grossAnual;
            if (moneda === 'ARS') {
              total = 0;
              for (let m = 1; m <= 12; m++) {
                total += convertToARS(aggregates[m].gross, m, fxRates);
              }
            }
            return fmtCurrency(total, moneda);
          })()}
        </td>
      </tr>

      {/* Fila TOTAL GM% */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-stone-800 font-bold sticky left-0 bg-white z-10">
          Promedio GM%
        </td>
        {months.map((m) => {
          const value = aggregates[m].gmPct;
          if (value === null) {
            return (
              <td key={m} className="py-1.5 px-2 text-right tabular-nums text-stone-400">
                -
              </td>
            );
          }
          const colorClass = colorForGm(value);
          return (
            <td key={m} className={`py-1.5 px-2 text-right tabular-nums font-bold ${colorClass}`}>
              {fmtPct(value)}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-bold bg-stone-50/60">
          {gmAnual !== null ? (
            <span className={colorForGm(gmAnual)}>{fmtPct(gmAnual)}</span>
          ) : (
            <span className="text-stone-400">-</span>
          )}
        </td>
      </tr>
    </>
  );
}
