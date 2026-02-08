// Components
export { ClientesList } from './components/ClientesList';
export { ClienteDetail } from './components/ClienteDetail';
export { ClienteForm } from './components/ClienteForm';
export { ClienteCard } from './components/ClienteCard';
export { ClienteBadge } from './components/ClienteBadge';

// Hooks
export { useClientes, CLIENTES_QUERY_KEY } from './hooks/useClientes';
export { useCliente } from './hooks/useCliente';
export { useClienteMutations } from './hooks/useClienteMutations';

// API
export { clientesApi } from './api/clientesApi';

// Types
export type {
  Cliente,
  ClienteWithRelations,
  CreateClienteDto,
  UpdateClienteDto,
  QueryClienteParams,
  ClientesResponse,
  EstadoCliente,
} from './types/cliente.types';
