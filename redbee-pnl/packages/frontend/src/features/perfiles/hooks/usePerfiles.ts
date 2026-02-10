import { useQuery } from '@tanstack/react-query';
import { perfilesApi } from '../api/perfilesApi';

export const PERFILES_QUERY_KEY = 'perfiles';

export function usePerfiles(params?: { page?: number; limit?: number; estado?: string }) {
  return useQuery({
    queryKey: [PERFILES_QUERY_KEY, params],
    queryFn: () => perfilesApi.getAll(params),
  });
}
