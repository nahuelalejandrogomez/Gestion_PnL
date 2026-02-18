/**
 * useFilteredRollingData - Hook para filtrar datos Rolling por país
 * ÉPICA Cliente 3 US-009: Filtros por país
 */

import { useMemo } from 'react';
import { useRollingData } from './useRollingData';
import type { PaisCliente, RollingData } from '../types/rolling.types';

export function useFilteredRollingData(year: number, paisFilter: PaisCliente | 'TODOS') {
  const rollingDataQuery = useRollingData(year);

  const filteredData = useMemo(() => {
    if (!rollingDataQuery.data || paisFilter === 'TODOS') {
      return rollingDataQuery.data;
    }

    // Filtrar clientes por país
    const filteredClientes = rollingDataQuery.data.clientes.filter(
      (cliente) => cliente.pais === paisFilter
    );

    const filtered: RollingData = {
      ...rollingDataQuery.data,
      clientes: filteredClientes,
    };

    return filtered;
  }, [rollingDataQuery.data, paisFilter]);

  return {
    ...rollingDataQuery,
    data: filteredData,
  };
}
