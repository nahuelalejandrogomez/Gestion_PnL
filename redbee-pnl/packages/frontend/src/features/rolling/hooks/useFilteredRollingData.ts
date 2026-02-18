/**
 * useFilteredRollingData - Hook para filtrar datos Rolling por país y tipoComercial
 * ÉPICA Cliente 3 US-009: Filtros por país
 * ÉPICA Cliente 4 US-013: Filtros combinados
 */

import { useMemo } from 'react';
import { useRollingData } from './useRollingData';
import type { PaisCliente, TipoComercialCliente, RollingData } from '../types/rolling.types';

export function useFilteredRollingData(
  year: number,
  paisFilter: PaisCliente | 'TODOS',
  tipoComercialFilter: TipoComercialCliente | 'TODOS'
) {
  const rollingDataQuery = useRollingData(year);

  const filteredData = useMemo(() => {
    if (!rollingDataQuery.data) {
      return rollingDataQuery.data;
    }

    // Si no hay filtros activos, devolver data original
    if (paisFilter === 'TODOS' && tipoComercialFilter === 'TODOS') {
      return rollingDataQuery.data;
    }

    // Filtrar clientes por país y/o tipoComercial (AND logic)
    const filteredClientes = rollingDataQuery.data.clientes.filter((cliente) => {
      const matchesPais = paisFilter === 'TODOS' || cliente.pais === paisFilter;
      const matchesTipo = tipoComercialFilter === 'TODOS' || cliente.tipoComercial === tipoComercialFilter;
      return matchesPais && matchesTipo;
    });

    const filtered: RollingData = {
      ...rollingDataQuery.data,
      clientes: filteredClientes,
    };

    return filtered;
  }, [rollingDataQuery.data, paisFilter, tipoComercialFilter]);

  return {
    ...rollingDataQuery,
    data: filteredData,
  };
}
