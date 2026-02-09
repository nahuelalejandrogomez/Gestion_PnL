import { api } from '@/lib/api';

// Types
export interface FxRateMonth {
  month: number;
  real: number | null;
  plan: number | null;
  effective: number | null;
  isFallback: boolean;
}

export interface FxRatesResponse {
  year: number;
  rates: FxRateMonth[];
}

export interface FxRateItemInput {
  month: number;
  real?: number | null;
  plan?: number | null;
}

// API functions
export const fxApi = {
  /**
   * Get FX rates for a year
   */
  getByYear: async (year: number): Promise<FxRatesResponse> => {
    const { data } = await api.get<FxRatesResponse>('/fx', { params: { year } });
    return data;
  },

  /**
   * Upsert FX rates for a year
   */
  upsertRates: async (year: number, items: FxRateItemInput[]): Promise<{ updated: number }> => {
    const { data } = await api.put<{ updated: number }>('/fx', { items }, { params: { year } });
    return data;
  },
};
