/**
 * RevenueTable - Vista Revenue
 * ÉPICA 3 US-007: Tabla consolidada Revenue por cliente
 * ÉPICA 3 US-008: Toggle USD/ARS y conversión moneda
 * ÉPICA 3 US-009: Totales Revenue y desvío Budget
 *
 * BUG FIX: Fila principal muestra SOLO backlog (igual que RfActualsTable)
 * - Fila principal expandible por cliente
 * - UX igual a P&L Cliente
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PaisBadge } from '@/features/clientes/components/PaisBadge';
import { TipoComercialBadge } from '@/features/clientes/components/TipoComercialBadge';
import { useRollingData } from '../hooks/useRollingData';
import { useRollingAggregates, type RollingAggregates } from '../hooks/useRollingAggregates';
import { MONTH_LABELS, fmtCurrency, colorForDiff, type Moneda } from '@/features/pnl/utils/pnl.format';
import type { ClienteRollingData } from '../types/rolling.types';
import { CurrencyToggle } from './shared/CurrencyToggle';

interface RevenueTableProps {
  year: number;
}

export function RevenueTable({ year }: RevenueTableProps) {
  const { data, isLoading, error } = useRollingData(year);
  const aggregates = useRollingAggregates(data);
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [expandedClientes, setExpandedClientes] = useState<Set<string>>(new Set());

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
          <CardTitle className="text-lg">Revenue</CardTitle>
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
          <CardTitle className="text-lg">Revenue</CardTitle>
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
          <CardTitle className="text-lg">Revenue</CardTitle>
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

  return (
    <Card className="border-stone-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-stone-800">
            Revenue - {year}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-xs text-stone-500">
              {data.clientes.length} cliente{data.clientes.length !== 1 ? 's' : ''} activo{data.clientes.length !== 1 ? 's' : ''}
            </div>
            <CurrencyToggle moneda={moneda} onChange={setMoneda} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200">
                <th className="text-left py-2 px-3 font-semibold text-stone-600 w-48 sticky left-0 bg-stone-50/80 z-10">
                  Concepto
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="text-right py-2 px-2 font-semibold text-stone-600 min-w-[100px]"
                  >
                    {MONTH_LABELS[m - 1]}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-bold text-stone-800 min-w-[110px] bg-stone-100/60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Renderizar cada cliente con fila principal expandible */}
              {data.clientes.map((cliente) => (
                <ClienteSection
                  key={cliente.clienteId}
                  cliente={cliente}
                  months={months}
                  moneda={moneda}
                  fxRates={data.fxRates}
                  isExpanded={expandedClientes.has(cliente.clienteId)}
                  onToggle={() => toggleCliente(cliente.clienteId)}
                />
              ))}

              {/* Totales consolidados */}
              {aggregates && (
                <TotalesSection
                  aggregates={aggregates}
                  months={months}
                  moneda={moneda}
                  fxRates={data.fxRates}
                />
              )}
            </tbody>
          </table>
        </div>

        {data.totalClientes > data.clientes.length && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ {data.totalClientes - data.clientes.length} cliente
            {data.totalClientes - data.clientes.length !== 1 ? 's' : ''} sin datos para {year}
          </p>
        )}

        {aggregates?.hasDiscrepancies && (
          <p className="text-xs text-red-600 mt-2 font-semibold">
            ❌ Error de validación: Discrepancias detectadas en totales. Revisa logs para detalles.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Convierte valor USD a ARS usando FX rates
 */
function convertToARS(valueUSD: number, month: number, fxRates: Record<number, number>): number {
  const fxRate = fxRates[month];
  if (!fxRate || fxRate === 1) {
    // Si no hay FX rate o es 1 (hardcoded), retornar el valor original
    return valueUSD;
  }
  return valueUSD * fxRate;
}

/**
 * Sección de cliente: fila principal expandible + subfilas Backlog/Potencial
 */
function ClienteSection({
  cliente,
  months,
  moneda,
  fxRates,
  isExpanded,
  onToggle,
}: {
  cliente: ClienteRollingData;
  months: number[];
  moneda: Moneda;
  fxRates: Record<number, number>;
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

          // Fila principal muestra SOLO backlog (lo que se va a facturar)
          // NO suma potencial - esto hace que coincida con P&L Cliente
          const hasReal = monthData.revenueReal !== null;
          let backlog = monthData.revenueReal ?? monthData.revenueAsignado;

          // Convertir a ARS si aplica
          if (moneda === 'ARS') {
            backlog = convertToARS(backlog, m, fxRates);
          }

          return (
            <td key={m} className="py-2 px-2 text-right tabular-nums font-semibold text-stone-800">
              <div className="flex items-center justify-end gap-1">
                {backlog > 0 ? fmtCurrency(backlog, moneda) : <span className="text-stone-300">-</span>}
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
            // Total anual = suma de backlog mensual (NO incluye potencial)
            let totalAnual = 0;
            for (let m = 1; m <= 12; m++) {
              const monthData = cliente.meses[m];
              if (monthData) {
                let monthBacklog = monthData.revenueReal ?? monthData.revenueAsignado;
                if (moneda === 'ARS') {
                  monthBacklog = convertToARS(monthBacklog, m, fxRates);
                }
                totalAnual += monthBacklog;
              }
            }
            return fmtCurrency(totalAnual, moneda);
          })()}
        </td>
      </tr>

      {/* Subfilas (solo si expandido) */}
      {isExpanded && (
        <>
          {/* Subfila: Backlog */}
          <tr className="border-t border-stone-100 hover:bg-stone-50/40 transition-colors">
            <td className="py-1.5 px-3 pl-8 text-stone-600 text-[11px] sticky left-0 bg-white z-10">
              Backlog
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

              // Backlog = revenueReal ?? revenueAsignado
              let backlog = monthData.revenueReal ?? monthData.revenueAsignado;

              // Convertir a ARS si aplica
              if (moneda === 'ARS') {
                backlog = convertToARS(backlog, m, fxRates);
              }

              return (
                <td key={m} className="py-1.5 px-2 text-right tabular-nums text-stone-600">
                  {backlog > 0 ? fmtCurrency(backlog, moneda) : <span className="text-stone-300">-</span>}
                </td>
              );
            })}
            <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-stone-600">
              -
            </td>
          </tr>

          {/* Subfila: Potencial */}
          <tr className="border-t border-stone-100 hover:bg-stone-50/40 transition-colors">
            <td className="py-1.5 px-3 pl-8 text-amber-600 text-[11px] sticky left-0 bg-white z-10">
              Potencial
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

              // Potencial = revenueNoAsignado (actualmente 0, mostrar "-")
              // TODO: Cuando se implemente funcionalidad potencial, descomentar:
              // let potencial = monthData.revenueNoAsignado;
              // if (moneda === 'ARS') {
              //   potencial = convertToARS(potencial, m, fxRates);
              // }
              // return potencial > 0 ? fmtCurrency(potencial, moneda) : "-";

              return (
                <td key={m} className="py-1.5 px-2 text-right tabular-nums text-amber-600">
                  <span className="text-stone-300">-</span>
                </td>
              );
            })}
            <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-amber-600">
              -
            </td>
          </tr>
        </>
      )}
    </>
  );
}

/**
 * Sección de 3 filas de TOTALES: TOTAL, Backlog, Potencial
 * + Fila opcional de Desvío Budget (US-009)
 */
function TotalesSection({
  aggregates,
  months,
  moneda,
  fxRates,
}: {
  aggregates: RollingAggregates;
  months: number[];
  moneda: Moneda;
  fxRates: Record<number, number>;
}) {
  const revenueAgg = aggregates.revenue;

  return (
    <>
      {/* Fila TOTAL */}
      <tr className="border-t-4 border-stone-400 bg-stone-100/80">
        <td className="py-2 px-3 font-bold text-stone-900 uppercase text-[11px] sticky left-0 bg-stone-100/80 z-10">
          TOTAL REVENUE
        </td>
        {months.map((m) => {
          const revAgg = revenueAgg.byMonth[m];
          let total = revAgg.total;

          // Convertir a ARS si aplica
          if (moneda === 'ARS') {
            total = convertToARS(total, m, fxRates);
          }

          return (
            <td key={m} className="py-2 px-2 text-right tabular-nums font-bold text-stone-900">
              <div className="flex items-center justify-end gap-1">
                {total > 0 ? fmtCurrency(total, moneda) : <span className="text-stone-300">-</span>}
                {!revAgg.isValid && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-red-500 text-red-600 bg-red-50">
                    ERR
                  </Badge>
                )}
              </div>
            </td>
          );
        })}
        <td className="py-2 px-3 text-right tabular-nums font-bold text-stone-900 bg-stone-200/60">
          {(() => {
            let totalAnual = revenueAgg.annual.total;
            if (moneda === 'ARS') {
              // Convertir total anual: sumar cada mes convertido
              totalAnual = 0;
              for (let m = 1; m <= 12; m++) {
                const monthTotal = revenueAgg.byMonth[m].total;
                totalAnual += convertToARS(monthTotal, m, fxRates);
              }
            }
            return fmtCurrency(totalAnual, moneda);
          })()}
        </td>
      </tr>

      {/* Fila Backlog TOTAL */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-stone-700 font-semibold sticky left-0 bg-white z-10">
          Backlog Total
        </td>
        {months.map((m) => {
          const revAgg = revenueAgg.byMonth[m];
          let backlog = revAgg.backlog;

          // Convertir a ARS si aplica
          if (moneda === 'ARS') {
            backlog = convertToARS(backlog, m, fxRates);
          }

          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums font-semibold text-stone-700">
              {backlog > 0 ? fmtCurrency(backlog, moneda) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-stone-700">
          {(() => {
            let backlogAnual = revenueAgg.annual.backlog;
            if (moneda === 'ARS') {
              backlogAnual = 0;
              for (let m = 1; m <= 12; m++) {
                const monthBacklog = revenueAgg.byMonth[m].backlog;
                backlogAnual += convertToARS(monthBacklog, m, fxRates);
              }
            }
            return fmtCurrency(backlogAnual, moneda);
          })()}
        </td>
      </tr>

      {/* Fila Potencial TOTAL */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-amber-700 font-semibold sticky left-0 bg-white z-10">
          Potencial Total
        </td>
        {months.map((m) => {
          // Potencial = 0 (funcionalidad no implementada)
          // TODO: Cuando se implemente, descomentar: const revAgg = revenueAgg.byMonth[m];
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums font-semibold text-amber-700">
              <span className="text-stone-300">-</span>
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-amber-700">
          -
        </td>
      </tr>

      {/* Fila Desvío Budget (US-009) */}
      {/* Mostrar solo cuando budget > 0 (actualmente siempre 0 - placeholder) */}
      {revenueAgg.annual.budget > 0 && (
        <tr className="border-t-2 border-stone-300 bg-stone-50/60">
          <td className="py-2 px-3 font-bold text-stone-700 uppercase text-[11px] sticky left-0 bg-stone-50/60 z-10">
            DESVÍO BUDGET
          </td>
          {months.map((m) => {
            const revAgg = revenueAgg.byMonth[m];
            let desvio = revAgg.desvio;

            // Convertir a ARS si aplica
            if (moneda === 'ARS') {
              const totalARS = convertToARS(revAgg.total, m, fxRates);
              const budgetARS = convertToARS(revAgg.budget, m, fxRates);
              desvio = totalARS - budgetARS;
            }

            const colorClass = colorForDiff(desvio);

            return (
              <td key={m} className={`py-2 px-2 text-right tabular-nums font-semibold ${colorClass}`}>
                {desvio !== 0 ? fmtCurrency(desvio, moneda) : <span className="text-stone-300">-</span>}
                {revAgg.desvioPct !== null && desvio !== 0 && (
                  <span className="text-[9px] ml-1">
                    ({revAgg.desvioPct > 0 ? '+' : ''}{revAgg.desvioPct.toFixed(1)}%)
                  </span>
                )}
              </td>
            );
          })}
          <td className={`py-2 px-3 text-right tabular-nums font-bold bg-stone-100/60 ${colorForDiff(revenueAgg.annual.desvio)}`}>
            {revenueAgg.annual.desvio !== 0 ? fmtCurrency(revenueAgg.annual.desvio, moneda) : '-'}
            {revenueAgg.annual.desvioPct !== null && revenueAgg.annual.desvio !== 0 && (
              <span className="text-[9px] ml-1">
                ({revenueAgg.annual.desvioPct > 0 ? '+' : ''}{revenueAgg.annual.desvioPct.toFixed(1)}%)
              </span>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
