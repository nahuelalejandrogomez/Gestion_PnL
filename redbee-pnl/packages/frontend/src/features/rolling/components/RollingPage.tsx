/**
 * RollingPage - Dashboard consolidado P&L todos clientes
 * ÉPICA 1 US-003: Selector año con URL sync
 * ÉPICA 2 US-005: Integración RfActualsTable
 * ÉPICA 3 US-007-009: Integración RevenueTable
 * ÉPICA 4 US-010-011: Integración PnlsRealesTable
 * ÉPICA 5 US-013-014: Integración DashboardView
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YearSelector } from './shared/YearSelector';
import { PaisFilter } from './shared/PaisFilter';
import { TipoComercialFilter } from './shared/TipoComercialFilter';
import { RfActualsTable } from './RfActualsTable';
import { RevenueTable } from './RevenueTable';
import { PnlsRealesTable } from './PnlsRealesTable';
import { DashboardView } from './DashboardView';
import { useRollingData } from '../hooks/useRollingData';
import { logger } from '@/utils/logger';
import type { ActiveTab, PaisCliente, TipoComercialCliente } from '../types/rolling.types';

export function RollingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const currentYear = now.getFullYear();

  // Parse year from URL or default to current
  const yearParam = searchParams.get('year');
  const initialYear = yearParam ? Number(yearParam) : currentYear;

  // Validate year (2020 <= year <= current + 1)
  const validYear = initialYear >= 2020 && initialYear <= currentYear + 1
    ? initialYear
    : currentYear;

  // Parse país filter from URL or default to 'TODOS'
  const paisParam = searchParams.get('pais');
  const validPaises: Array<PaisCliente | 'TODOS'> = ['TODOS', 'AR', 'UY', 'CL', 'MX', 'US', 'BR', 'PE', 'CO', 'OTRO'];
  const initialPais = paisParam && validPaises.includes(paisParam as PaisCliente | 'TODOS')
    ? (paisParam as PaisCliente | 'TODOS')
    : 'TODOS';

  // Parse tipoComercial filter from URL or default to 'TODOS'
  const tipoParam = searchParams.get('tipo');
  const validTipos: Array<TipoComercialCliente | 'TODOS'> = ['TODOS', 'BASE_INSTALADA', 'NUEVA_VENTA'];
  const initialTipo = tipoParam && validTipos.includes(tipoParam as TipoComercialCliente | 'TODOS')
    ? (tipoParam as TipoComercialCliente | 'TODOS')
    : 'TODOS';

  const [year, setYear] = useState(validYear);
  const [activeTab, setActiveTab] = useState<ActiveTab>('rf-actuals');
  const [paisFilter, setPaisFilter] = useState<PaisCliente | 'TODOS'>(initialPais);
  const [tipoComercialFilter, setTipoComercialFilter] = useState<TipoComercialCliente | 'TODOS'>(initialTipo);

  // Fetch data to show filtered count
  const { data: rollingData } = useRollingData(year);

  // Calculate filtered count (combined filters)
  const filteredCount = useMemo(() => {
    if (!rollingData) return { filtered: 0, total: 0 };

    const total = rollingData.clientes.length;
    const filtered = rollingData.clientes.filter(c => {
      const matchesPais = paisFilter === 'TODOS' || c.pais === paisFilter;
      const matchesTipo = tipoComercialFilter === 'TODOS' || c.tipoComercial === tipoComercialFilter;
      return matchesPais && matchesTipo;
    }).length;

    return { filtered, total };
  }, [rollingData, paisFilter, tipoComercialFilter]);

  const handleTabChange = (newTab: string) => {
    const from = activeTab;
    const to = newTab as ActiveTab;

    logger.debug('[Rolling]', 'Tab changed', {
      from,
      to,
      timestamp: Date.now(),
    });

    setActiveTab(to);
  };

  const handleYearChange = (newYear: number) => {
    const from = year;

    logger.debug('[Rolling]', 'Year changed', {
      from,
      to: newYear,
      timestamp: Date.now(),
    });

    setYear(newYear);

    // Preserve all filter params when updating year
    const newParams: Record<string, string> = { year: String(newYear) };
    if (paisFilter !== 'TODOS') {
      newParams.pais = paisFilter;
    }
    if (tipoComercialFilter !== 'TODOS') {
      newParams.tipo = tipoComercialFilter;
    }
    setSearchParams(newParams);
  };

  const handlePaisFilterChange = (newPais: PaisCliente | 'TODOS') => {
    logger.debug('[Rolling]', 'País filter changed', {
      from: paisFilter,
      to: newPais,
      timestamp: Date.now(),
    });

    setPaisFilter(newPais);

    // Preserve all params when updating pais
    const newParams: Record<string, string> = { year: String(year) };
    if (newPais !== 'TODOS') {
      newParams.pais = newPais;
    }
    if (tipoComercialFilter !== 'TODOS') {
      newParams.tipo = tipoComercialFilter;
    }
    setSearchParams(newParams);
  };

  const handleTipoComercialFilterChange = (newTipo: TipoComercialCliente | 'TODOS') => {
    logger.debug('[Rolling]', 'Tipo Comercial filter changed', {
      from: tipoComercialFilter,
      to: newTipo,
      timestamp: Date.now(),
    });

    setTipoComercialFilter(newTipo);

    // Preserve all params when updating tipo
    const newParams: Record<string, string> = { year: String(year) };
    if (paisFilter !== 'TODOS') {
      newParams.pais = paisFilter;
    }
    if (newTipo !== 'TODOS') {
      newParams.tipo = newTipo;
    }
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Rolling Forecast</h1>
          <p className="text-sm text-stone-500 mt-1">
            Consolidado P&L de todos los clientes
          </p>
          {rollingData && (
            <div className="mt-2 text-xs">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium">
                {filteredCount.filtered === filteredCount.total ? (
                  <>
                    {filteredCount.total} cliente{filteredCount.total !== 1 ? 's' : ''} activo{filteredCount.total !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <span className="text-amber-700">{filteredCount.filtered}</span>
                    <span className="mx-1">/</span>
                    <span>{filteredCount.total}</span>
                    <span className="ml-1">clientes</span>
                    {(paisFilter !== 'TODOS' || tipoComercialFilter !== 'TODOS') && (
                      <span className="ml-1 text-stone-500">
                        (
                        {paisFilter !== 'TODOS' && `país: ${paisFilter}`}
                        {paisFilter !== 'TODOS' && tipoComercialFilter !== 'TODOS' && ', '}
                        {tipoComercialFilter !== 'TODOS' && `tipo: ${tipoComercialFilter === 'BASE_INSTALADA' ? 'BI' : 'NV'}`}
                        )
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PaisFilter value={paisFilter} onChange={handlePaisFilterChange} />
          <TipoComercialFilter value={tipoComercialFilter} onChange={handleTipoComercialFilterChange} />
          <YearSelector year={year} onChange={handleYearChange} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="rf-actuals">RF Actuals</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pnls">PNLs Reales</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="rf-actuals" className="mt-6">
          <RfActualsTable year={year} paisFilter={paisFilter} tipoComercialFilter={tipoComercialFilter} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <RevenueTable year={year} paisFilter={paisFilter} tipoComercialFilter={tipoComercialFilter} />
        </TabsContent>

        <TabsContent value="pnls" className="mt-6">
          <PnlsRealesTable year={year} paisFilter={paisFilter} tipoComercialFilter={tipoComercialFilter} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardView year={year} paisFilter={paisFilter} tipoComercialFilter={tipoComercialFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
