import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRollingData } from '../hooks/useRollingData';
import { fmtFte, MONTH_LABELS } from '@/features/pnl/utils/pnl.format';
import type { ClienteRollingData } from '../types/rolling.types';

interface Props {
  year: number;
}

export function RfActualsTable({ year }: Props) {
  const { data, isLoading, error } = useRollingData(year);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>RF Actuals - Vista por FTEs</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-96 w-full" /></CardContent>
      </Card>
    );
  }
  
  if (error || !data) {
    return (
      <Card>
        <CardHeader><CardTitle>RF Actuals - Vista por FTEs</CardTitle></CardHeader>
        <CardContent>
          <p className="text-red-600">Error cargando datos</p>
        </CardContent>
      </Card>
    );
  }
  
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">RF Actuals - Vista por FTEs</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-stone-50">
              <th className="text-left py-2 px-3 font-semibold sticky left-0 bg-stone-50 z-10">
                Concepto
              </th>
              {months.map(m => (
                <th key={m} className="text-right py-2 px-2 min-w-[72px]">
                  {MONTH_LABELS[m - 1]}
                </th>
              ))}
              <th className="text-right py-2 px-3 bg-stone-100 min-w-[80px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Clientes Section */}
            {data.clientes.map(cliente => (
              <ClienteFtesRows key={cliente.clienteId} cliente={cliente} months={months} />
            ))}
            
            {/* Forecasts Section */}
            {data.forecasts.length > 0 && (
              <>
                <SectionDivider />
                {data.forecasts.map(forecast => (
                  <ForecastFtesRow key={forecast.forecastId} forecast={forecast} months={months} />
                ))}
              </>
            )}
            
            {/* Totals Section */}
            <SectionDivider />
            <TotalFtesRows totales={data.totales} months={months} />
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ClienteFtesRows({ cliente, months }: { cliente: ClienteRollingData; months: number[] }) {
  return (
    <>
      {/* Total Row */}
      <tr className="border-t hover:bg-stone-50">
        <td className="py-1.5 px-3 font-semibold sticky left-0 bg-white z-10">
          {cliente.clienteNombre}
        </td>
        {months.map(m => {
          const total = cliente.meses[m].ftesAsignados + cliente.meses[m].ftesNoAsignados;
          const hasReal = cliente.meses[m].ftesReales !== null;
          
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums">
              <div className="flex items-center justify-end gap-1">
                {fmtFte(total)}
                {hasReal && (
                  <Badge variant="outline" className="text-[9px] px-1 h-4 border-blue-500 text-blue-600">
                    Real
                  </Badge>
                )}
              </div>
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums font-semibold bg-stone-50">
          {fmtFte(cliente.totalesAnuales.ftes)}
        </td>
      </tr>
      
      {/* Backlog + Comprometido */}
      <tr className="border-t border-stone-50 hover:bg-stone-50">
        <td className="py-1.5 px-3 pl-6 text-stone-600 sticky left-0 bg-white z-10">
          {cliente.clienteNombre} Backlog + Comprometido
        </td>
        {months.map(m => {
          const value = cliente.meses[m].ftesReales ?? cliente.meses[m].ftesAsignados;
          return (
            <td key={m} className="py-1.5 px-2 text-right tabular-nums">
              {fmtFte(value)}
            </td>
          );
        })}
        <td className="py-1.5 px-3 text-right tabular-nums bg-stone-50">
          {fmtFte(cliente.totalesAnuales.ftesBacklog)}
        </td>
      </tr>
      
      {/* Potencial */}
      <tr className="border-t border-stone-50 hover:bg-stone-50">
        <td className="py-1.5 px-3 pl-6 text-amber-600 sticky left-0 bg-white z-10">
          {cliente.clienteNombre} Potencial
        </td>
        {months.map(m => (
          <td key={m} className="py-1.5 px-2 text-right tabular-nums text-amber-600">
            {fmtFte(cliente.meses[m].ftesNoAsignados)}
          </td>
        ))}
        <td className="py-1.5 px-3 text-right tabular-nums bg-stone-50 text-amber-600">
          {fmtFte(cliente.totalesAnuales.ftesPotencial)}
        </td>
      </tr>
    </>
  );
}

// ...existing code for other components...
