import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { configApi } from '../api/configApi';

export const CONFIG_QUERY_KEY = 'app-config';

// Default values (used when API is not available or returns null)
const DEFAULT_CONFIG = {
  costoEmpresaPct: 45,
};

export function useConfig() {
  return useQuery({
    queryKey: [CONFIG_QUERY_KEY],
    queryFn: configApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: DEFAULT_CONFIG,
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      configApi.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONFIG_QUERY_KEY] });
      toast.success('Configuración actualizada');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('[Config Update Error]', error);
      toast.error(error.response?.data?.message || 'Error al actualizar configuración');
    },
  });
}

export { DEFAULT_CONFIG };
