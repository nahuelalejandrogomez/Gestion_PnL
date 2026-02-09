export { useConfig, useUpdateConfig, CONFIG_QUERY_KEY, DEFAULT_CONFIG } from './hooks/useConfig';
export { useFxRates, useUpsertFxRates, buildFxMap, FX_QUERY_KEY } from './hooks/useFx';
export { configApi } from './api/configApi';
export { fxApi } from './api/fxApi';
export { ConfiguracionPage } from './components/ConfiguracionPage';
export type { AppConfig } from './types/config.types';
export type { FxRateMonth, FxRatesResponse, FxRateItemInput } from './api/fxApi';
