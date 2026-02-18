/**
 * RfActualsTable - Vista RF Actuals (FTEs)
 * ÉPICA 2 US-005: Tabla consolidada FTEs por cliente
 * ÉPICA 2 US-006: Totales y validación
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRollingData } from '../hooks/useRollingData';
import { useRollingAggregates } from '../hooks/useRollingAggregates';
import { MONTH_LABELS, fmtFte } from '@/features/pnl/utils/pnl.format';
import type { ClienteRollingData } from '../types/rolling.types';

interface RfActualsTableProps {
  year: number;
}

export function RfActualsTable({ year }: RfActualsTableProps) {
  const { data, isLoading, error } = useRollingData(year);
  const aggregates = useRollingAggregates(data);

  if (isLoading) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">RF Actuals (FTEs)</CardTitle>
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
          <CardTitle className="text-lg">RF Actuals (FTEs)</CardTitle>
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
          <CardTitle className="text-lg">RF Actuals (FTEs)</CardTitle>
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
            RF Actuals (FTEs) - {year}
          </CardTitle>
          <div className="text-xs text-stone-500">
            {data.clientes.length} cliente{data.clientes.length !== 1 ? 's' : ''} activo{data.clientes.length !== 1 ? 's' : ''}
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
                    className="text-right py-2 px-2 font-semibold text-stone-600 min-w-[72px]"
                  >
                    {MONTH_LABELS[m - 1]}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-bold text-stone-800 min-w-[80px] bg-stone-100/60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Renderizar cada cliente con 3 filas */}
              {data.clientes.map((cliente) => (
                <ClienteSection key={cliente.clienteId} cliente={cliente} months={months} />
              ))}

              {/* Totales consolidados */}
              {aggregates && (
                <TotalesSection aggregates={aggregates} months={months} />
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
 * Sección de 3 filas por cliente: Total, Backlog, Potencial
 */
function ClienteSection({
  cliente,
  months,
}: {
  cliente: ClienteRollingData;
  months: number[];
}) {
  return (
    <>
      {/* Fila Total */}
      <tr className="border-t-2 border-stone-300 bg-stone-50/40">
        <td className="py-2 px-3 font-bold text-stone-800 sticky left-0 bg-stone-50/40 z-10">
          {cliente.clienteNombre}
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

          // Total = ftesReales si existe, sino suma asignados + noAsignados
          const hasReal = monthData.ftesReales !== null;
          const total = hasReal
            ? monthData.ftesReales!
            : monthData.ftesAsignados + monthData.ftesNoAsignados;

          return (
            <td key={m} className="py-2 px-2 text-right tabular-nums font-semibold text-stone-800">
              <div className="flex items-center justify-end gap-1">
                {total > 0 ? fmtFte(total) : <span className="text-stone-300">-</span>}
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
          {fmtFte(cliente.totalesAnuales.ftes)}
        </td>
      </tr>

      {/* Fila Backlog */}
      <tr className="border-t border-stone-100 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-stone-600 sticky left-0 bg-white z-10">
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

          // Backlog = ftesReales si existe, sino ftesAsignados
          const backlog = monthData.ftesReales ?? monthData.ftesAsignados;

          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums text-stone-600">
              {backlog > 0 ? fmtFte(backlog) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-stone-600">
          -
        </td>
      </tr>

      {/* Fila Potencial */}
      <tr className="border-t border-stone-100 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-amber-600 sticky left-0 bg-white z-10">
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

          const potencial = monthData.ftesNoAsignados;

          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums text-amber-600">
              {potencial > 0 ? fmtFte(potencial) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-amber-600">
          -
        </td>
      </tr>
    </>
  );
}

/**
 * Sección de 3 filas de TOTALES: TOTAL, Backlog, Potencial
 */
function TotalesSection({
  aggregates,
  months,
}: {
  aggregates: { byMonth: Record<number, { total: number; backlog: number; potencial: number; isValid: boolean; discrepancy: number }>; annual: { total: number; backlog: number; potencial: number }; hasDiscrepancies: boolean };
  months: number[];
}) {
  return (
    <>
      {/* Fila TOTAL */}
      <tr className="border-t-4 border-stone-400 bg-stone-100/80">
        <td className="py-2 px-3 font-bold text-stone-900 uppercase text-[11px] sticky left-0 bg-stone-100/80 z-10">
          TOTAL FTEs
        </td>
        {months.map((m) => {
          const agg = aggregates.byMonth[m];
          return (
            <td key={m} className="py-2 px-2 text-right tabular-nums font-bold text-stone-900">
              <div className="flex items-center justify-end gap-1">
                {agg.total > 0 ? fmtFte(agg.total) : <span className="text-stone-300">-</span>}
                {!agg.isValid && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-red-500 text-red-600 bg-red-50">
                    ERR
                  </Badge>
                )}
              </div>
            </td>
          );
        })}
        <td className="py-2 px-3 text-right tabular-nums font-bold text-stone-900 bg-stone-200/60">
          {fmtFte(aggregates.annual.total)}
        </td>
      </tr>

      {/* Fila Backlog TOTAL */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-stone-700 font-semibold sticky left-0 bg-white z-10">
          Backlog Total
        </td>
        {months.map((m) => {
          const agg = aggregates.byMonth[m];
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums font-semibold text-stone-700">
              {agg.backlog > 0 ? fmtFte(agg.backlog) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-stone-700">
          {fmtFte(aggregates.annual.backlog)}
        </td>
      </tr>

      {/* Fila Potencial TOTAL */}
      <tr className="border-t border-stone-200 hover:bg-stone-50/40 transition-colors">
        <td className="py-1.5 px-3 pl-6 text-amber-700 font-semibold sticky left-0 bg-white z-10">
          Potencial Total
        </td>
        {months.map((m) => {
          const agg = aggregates.byMonth[m];
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums font-semibold text-amber-700">
              {agg.potencial > 0 ? fmtFte(agg.potencial) : <span className="text-stone-300">-</span>}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50/60 text-amber-700">
          {fmtFte(aggregates.annual.potencial)}
        </td>
      </tr>
    </>
  );
}
