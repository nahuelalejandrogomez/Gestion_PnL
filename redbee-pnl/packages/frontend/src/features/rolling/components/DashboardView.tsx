/**
 * DashboardView - Vista Dashboard con gráficos y tablas resumen
 * ÉPICA 5 US-013: Dashboard estructura base + 3 pie charts
 * ÉPICA 5 US-014: Tablas resumen y Base Instalada vs Nueva Venta
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRollingData } from '../hooks/useRollingData';
import { fmtCurrency, fmtFte, fmtPct } from '@/features/pnl/utils/pnl.format';

interface DashboardViewProps {
  year: number;
}

// Colores para los pie charts
const COLORS = {
  USD: '#3b82f6', // blue-500
  ARS: '#10b981', // green-500
  AR: '#8b5cf6', // violet-500
  CL: '#f59e0b', // amber-500
  UY: '#ec4899', // pink-500
  US: '#06b6d4', // cyan-500
  BI: '#22c55e', // green-500
  NV: '#eab308', // yellow-500
};

export function DashboardView({ year }: DashboardViewProps) {
  const { data, isLoading, error } = useRollingData(year);

  // Calcular agregados para los gráficos
  const dashboardData = useMemo(() => {
    if (!data || data.clientes.length === 0) {
      return null;
    }

    // Agregados por moneda
    const byMoneda: Record<string, { revenue: number; ftes: number }> = {
      USD: { revenue: 0, ftes: 0 },
      ARS: { revenue: 0, ftes: 0 },
    };

    // Agregados por región
    const byRegion: Record<string, { revenue: number; ftes: number }> = {
      AR: { revenue: 0, ftes: 0 },
      CL: { revenue: 0, ftes: 0 },
      UY: { revenue: 0, ftes: 0 },
      US: { revenue: 0, ftes: 0 },
    };

    // Base Instalada vs Nueva Venta (placeholder - necesita definición de negocio)
    let baseInstaladaRevenue = 0;
    let nuevaVentaRevenue = 0;
    let baseInstaladaFtes = 0;
    let nuevaVentaFtes = 0;

    for (const cliente of data.clientes) {
      let clienteRevenue = 0;
      let clienteFtes = 0;

      // Sumar todos los meses del cliente
      for (let m = 1; m <= 12; m++) {
        const monthData = cliente.meses[m];
        if (monthData) {
          clienteRevenue += monthData.revenueReal ?? monthData.revenueAsignado;
          clienteFtes += monthData.ftesReales ?? monthData.ftesAsignados;
        }
      }

      // Agregar por moneda
      byMoneda[cliente.moneda].revenue += clienteRevenue;
      byMoneda[cliente.moneda].ftes += clienteFtes;

      // Agregar por región
      byRegion[cliente.region].revenue += clienteRevenue;
      byRegion[cliente.region].ftes += clienteFtes;

      // Base Instalada vs Nueva Venta
      // TODO: Necesita campo en backend para identificar si es BI o NV
      // Por ahora, todos se consideran Base Instalada
      baseInstaladaRevenue += clienteRevenue;
      baseInstaladaFtes += clienteFtes;
    }

    // Formatear datos para pie charts
    const revenueByMoneda = Object.entries(byMoneda)
      .filter(([_, values]) => values.revenue > 0)
      .map(([moneda, values]) => ({
        name: moneda,
        value: values.revenue,
        percentage: 0, // Se calculará después
      }));

    const totalRevenueMoneda = revenueByMoneda.reduce((sum, item) => sum + item.value, 0);
    revenueByMoneda.forEach((item) => {
      item.percentage = totalRevenueMoneda > 0 ? (item.value / totalRevenueMoneda) * 100 : 0;
    });

    const revenueByRegion = Object.entries(byRegion)
      .filter(([_, values]) => values.revenue > 0)
      .map(([region, values]) => ({
        name: region,
        value: values.revenue,
        percentage: 0,
      }));

    const totalRevenueRegion = revenueByRegion.reduce((sum, item) => sum + item.value, 0);
    revenueByRegion.forEach((item) => {
      item.percentage = totalRevenueRegion > 0 ? (item.value / totalRevenueRegion) * 100 : 0;
    });

    const ftesByRegion = Object.entries(byRegion)
      .filter(([_, values]) => values.ftes > 0)
      .map(([region, values]) => ({
        name: region,
        value: values.ftes,
        percentage: 0,
      }));

    const totalFtesRegion = ftesByRegion.reduce((sum, item) => sum + item.value, 0);
    ftesByRegion.forEach((item) => {
      item.percentage = totalFtesRegion > 0 ? (item.value / totalFtesRegion) * 100 : 0;
    });

    return {
      revenueByMoneda,
      revenueByRegion,
      ftesByRegion,
      baseInstalada: {
        revenue: baseInstaladaRevenue,
        ftes: baseInstaladaFtes,
      },
      nuevaVenta: {
        revenue: nuevaVentaRevenue,
        ftes: nuevaVentaFtes,
      },
      totals: {
        revenue: totalRevenueMoneda,
        ftes: totalFtesRegion,
      },
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-stone-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Dashboard {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full bg-stone-100" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Dashboard {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-center py-12">
            Error al cargar datos: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.clientes.length === 0 || !dashboardData) {
    return (
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Dashboard {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-stone-500 text-center py-12">
            No hay datos disponibles para {year}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título y métricas generales */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-stone-800">
            Dashboard Consolidado - {year}
          </CardTitle>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-stone-500">Total Revenue</p>
              <p className="text-xl font-bold text-stone-900">
                {fmtCurrency(dashboardData.totals.revenue, 'USD')}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Total FTEs</p>
              <p className="text-xl font-bold text-stone-900">
                {fmtFte(dashboardData.totals.ftes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Clientes Activos</p>
              <p className="text-xl font-bold text-stone-900">{data.clientes.length}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue por Moneda */}
        <Card className="border-stone-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-700">
              Revenue por Moneda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dashboardData.revenueByMoneda}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${fmtPct((entry.percent || 0) * 100)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.revenueByMoneda.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => fmtCurrency(Number(value || 0), 'USD')}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Revenue por Región */}
        <Card className="border-stone-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-700">
              Revenue por Región
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dashboardData.revenueByRegion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${fmtPct((entry.percent || 0) * 100)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.revenueByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => fmtCurrency(Number(value || 0), 'USD')}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: FTEs por Región */}
        <Card className="border-stone-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-700">
              FTEs por Región
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dashboardData.ftesByRegion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${fmtPct((entry.percent || 0) * 100)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.ftesByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => fmtFte(Number(value || 0))}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Base Instalada vs Nueva Venta */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-stone-700">
            Base Instalada vs Nueva Venta
          </CardTitle>
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Clasificación BI/NV requiere campo en backend. Actualmente todos los clientes se consideran Base Instalada.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200">
                  <th className="text-left py-2 px-3 font-semibold text-stone-600">Concepto</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">Revenue USD</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">FTEs</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">% Revenue</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">% FTEs</th>
                </tr>
              </thead>
              <tbody>
                {/* Base Instalada */}
                <tr className="border-t border-stone-200 hover:bg-stone-50/40">
                  <td className="py-2 px-3 font-semibold text-green-700">Base Instalada</td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-800">
                    {fmtCurrency(dashboardData.baseInstalada.revenue, 'USD')}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-800">
                    {fmtFte(dashboardData.baseInstalada.ftes)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-green-700 font-semibold">
                    {dashboardData.totals.revenue > 0
                      ? fmtPct((dashboardData.baseInstalada.revenue / dashboardData.totals.revenue) * 100)
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-green-700 font-semibold">
                    {dashboardData.totals.ftes > 0
                      ? fmtPct((dashboardData.baseInstalada.ftes / dashboardData.totals.ftes) * 100)
                      : '-'}
                  </td>
                </tr>

                {/* Nueva Venta */}
                <tr className="border-t border-stone-200 hover:bg-stone-50/40">
                  <td className="py-2 px-3 font-semibold text-yellow-700">Nueva Venta</td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-800">
                    {fmtCurrency(dashboardData.nuevaVenta.revenue, 'USD')}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-800">
                    {fmtFte(dashboardData.nuevaVenta.ftes)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-yellow-700 font-semibold">
                    {dashboardData.totals.revenue > 0
                      ? fmtPct((dashboardData.nuevaVenta.revenue / dashboardData.totals.revenue) * 100)
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-yellow-700 font-semibold">
                    {dashboardData.totals.ftes > 0
                      ? fmtPct((dashboardData.nuevaVenta.ftes / dashboardData.totals.ftes) * 100)
                      : '-'}
                  </td>
                </tr>

                {/* Total */}
                <tr className="border-t-2 border-stone-400 bg-stone-100/80 font-bold">
                  <td className="py-2 px-3 text-stone-900">TOTAL</td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">
                    {fmtCurrency(dashboardData.totals.revenue, 'USD')}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">
                    {fmtFte(dashboardData.totals.ftes)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">100.0%</td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabla Resumen por Cliente */}
      <Card className="border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-stone-700">
            Resumen por Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200">
                  <th className="text-left py-2 px-3 font-semibold text-stone-600">Cliente</th>
                  <th className="text-center py-2 px-3 font-semibold text-stone-600">Región</th>
                  <th className="text-center py-2 px-3 font-semibold text-stone-600">Moneda</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">Revenue USD</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">FTEs</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">% Revenue</th>
                  <th className="text-right py-2 px-3 font-semibold text-stone-600">% FTEs</th>
                </tr>
              </thead>
              <tbody>
                {data.clientes.map((cliente) => {
                  let clienteRevenue = 0;
                  let clienteFtes = 0;

                  for (let m = 1; m <= 12; m++) {
                    const monthData = cliente.meses[m];
                    if (monthData) {
                      clienteRevenue += monthData.revenueReal ?? monthData.revenueAsignado;
                      clienteFtes += monthData.ftesReales ?? monthData.ftesAsignados;
                    }
                  }

                  const revPct = dashboardData.totals.revenue > 0
                    ? (clienteRevenue / dashboardData.totals.revenue) * 100
                    : 0;
                  const ftesPct = dashboardData.totals.ftes > 0
                    ? (clienteFtes / dashboardData.totals.ftes) * 100
                    : 0;

                  return (
                    <tr key={cliente.clienteId} className="border-t border-stone-200 hover:bg-stone-50/40">
                      <td className="py-2 px-3 font-semibold text-stone-800">{cliente.clienteNombre}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-stone-100 text-stone-700">
                          {cliente.region}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-700">
                          {cliente.moneda}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-stone-800">
                        {fmtCurrency(clienteRevenue, 'USD')}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-stone-800">
                        {fmtFte(clienteFtes)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-stone-600">
                        {fmtPct(revPct)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-stone-600">
                        {fmtPct(ftesPct)}
                      </td>
                    </tr>
                  );
                })}

                {/* Fila Total */}
                <tr className="border-t-2 border-stone-400 bg-stone-100/80 font-bold">
                  <td className="py-2 px-3 text-stone-900" colSpan={3}>TOTAL</td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">
                    {fmtCurrency(dashboardData.totals.revenue, 'USD')}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">
                    {fmtFte(dashboardData.totals.ftes)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">100.0%</td>
                  <td className="py-2 px-3 text-right tabular-nums text-stone-900">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Validación porcentajes */}
          {(() => {
            const sumRevPct = data.clientes.reduce((sum, cliente) => {
              let clienteRevenue = 0;
              for (let m = 1; m <= 12; m++) {
                const monthData = cliente.meses[m];
                if (monthData) {
                  clienteRevenue += monthData.revenueReal ?? monthData.revenueAsignado;
                }
              }
              return sum + (dashboardData.totals.revenue > 0 ? (clienteRevenue / dashboardData.totals.revenue) * 100 : 0);
            }, 0);

            const isValid = Math.abs(sumRevPct - 100) < 0.1;

            return !isValid ? (
              <p className="text-xs text-red-600 mt-2 font-semibold">
                ⚠️ Error de validación: Los porcentajes no suman 100% ({fmtPct(sumRevPct)})
              </p>
            ) : null;
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
