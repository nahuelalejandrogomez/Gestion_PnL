/**
 * PaisFilter - Filtro de clientes por país
 * ÉPICA Cliente 3 US-009: Filtros por país en Rolling
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaisCliente } from '../../types/rolling.types';

interface PaisFilterProps {
  value: PaisCliente | 'TODOS';
  onChange: (pais: PaisCliente | 'TODOS') => void;
}

const paisOptions: { value: PaisCliente | 'TODOS'; label: string }[] = [
  { value: 'TODOS', label: 'Todos los países' },
  { value: 'AR', label: 'Argentina' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'CL', label: 'Chile' },
  { value: 'MX', label: 'México' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'BR', label: 'Brasil' },
  { value: 'PE', label: 'Perú' },
  { value: 'CO', label: 'Colombia' },
  { value: 'OTRO', label: 'Otro' },
];

export function PaisFilter({ value, onChange }: PaisFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PaisCliente | 'TODOS')}>
      <SelectTrigger className="w-52 h-10 bg-white border-stone-200 focus:ring-stone-300">
        <SelectValue placeholder="Filtrar por país" />
      </SelectTrigger>
      <SelectContent>
        {paisOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
