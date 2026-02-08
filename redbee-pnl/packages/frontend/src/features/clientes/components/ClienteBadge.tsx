import { Badge } from '@/components/ui/badge';
import type { EstadoCliente } from '../types/cliente.types';

interface ClienteBadgeProps {
  estado: EstadoCliente;
}

const estadoConfig: Record<EstadoCliente, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ACTIVO: { label: 'Activo', variant: 'default' },
  INACTIVO: { label: 'Inactivo', variant: 'secondary' },
  POTENCIAL: { label: 'Potencial', variant: 'outline' },
};

export function ClienteBadge({ estado }: ClienteBadgeProps) {
  const config = estadoConfig[estado];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
