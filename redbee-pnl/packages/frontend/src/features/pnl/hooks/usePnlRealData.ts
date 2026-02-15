import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pnlApi } from '../api/pnlApi';
import type { ClientePnlRealMesDto } from '../api/pnlApi';
import { PNL_QUERY_KEY } from './useProyectoPnl';

type CellKey = `${number}-${string}`; // "month-field" format
type DirtyData = Map<CellKey, number | null>;

export function usePnlRealData(clienteId: string, year: number) {
  const queryClient = useQueryClient();
  const [dirtyData, setDirtyData] = useState<DirtyData>(new Map());

  const saveMutation = useMutation({
    mutationFn: async (data: Map<CellKey, number | null>) => {
      // Convertir Map a array de meses agrupados por month
      const monthsMap = new Map<number, ClientePnlRealMesDto>();

      data.forEach((value, key) => {
        const [monthStr, field] = key.split('-');
        const month = Number(monthStr);

        if (!monthsMap.has(month)) {
          monthsMap.set(month, { month });
        }

        const mesDto = monthsMap.get(month)!;

        if (field === 'revenueReal') {
          mesDto.revenueReal = value ?? undefined;
        } else if (field === 'recursosReales') {
          mesDto.recursosReales = value ?? undefined;
        } else if (field === 'otrosReales') {
          mesDto.otrosReales = value ?? undefined;
        } else if (field === 'ftesReales') {
          mesDto.ftesReales = value ?? undefined;
        }
      });

      const meses = Array.from(monthsMap.values());

      return pnlApi.updateClientePnlReal(clienteId, year, { meses });
    },
    onSuccess: () => {
      // Invalidar el query del P&L del cliente para refrescar datos
      queryClient.invalidateQueries({
        queryKey: [PNL_QUERY_KEY, 'cliente', clienteId, year],
      });
      // Limpiar dirty state
      setDirtyData(new Map());
    },
  });

  const handleCellEdit = useCallback((month: number, field: string, value: number | null) => {
    setDirtyData((prev) => {
      const next = new Map(prev);
      const key: CellKey = `${month}-${field}`;
      next.set(key, value);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (dirtyData.size > 0) {
      saveMutation.mutate(dirtyData);
    }
  }, [dirtyData, saveMutation]);

  const handleCancel = useCallback(() => {
    setDirtyData(new Map());
  }, []);

  const isDirty = useCallback((month: number, field: string): boolean => {
    const key: CellKey = `${month}-${field}`;
    return dirtyData.has(key);
  }, [dirtyData]);

  const getDirtyValue = useCallback((month: number, field: string): number | null | undefined => {
    const key: CellKey = `${month}-${field}`;
    return dirtyData.get(key);
  }, [dirtyData]);

  return {
    dirtyData,
    handleCellEdit,
    handleSave,
    handleCancel,
    isDirty,
    getDirtyValue,
    isSaving: saveMutation.isPending,
    hasDirtyData: dirtyData.size > 0,
  };
}
