// Components
export { ProyectosList } from './components/ProyectosList';
export { ProyectoDetail } from './components/ProyectoDetail';
export { ProyectoForm } from './components/ProyectoForm';
export { ProyectoCard } from './components/ProyectoCard';
export { ProyectoBadge } from './components/ProyectoBadge';
export { ProyectosTable } from './components/ProyectosTable';

// Hooks
export { useProyectos, PROYECTOS_QUERY_KEY } from './hooks/useProyectos';
export { useProyecto } from './hooks/useProyecto';
export { useProyectoMutations } from './hooks/useProyectoMutations';

// API
export { proyectosApi } from './api/proyectosApi';

// Types
export type {
  Proyecto,
  ProyectoWithRelations,
  CreateProyectoDto,
  UpdateProyectoDto,
  QueryProyectoParams,
  ProyectosResponse,
  TipoProyecto,
  EstadoProyecto,
} from './types/proyecto.types';
