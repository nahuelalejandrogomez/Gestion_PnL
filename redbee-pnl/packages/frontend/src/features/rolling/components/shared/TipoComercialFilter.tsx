/**
 * TipoComercialFilter - Filtro de clientes por tipo comercial
 * ÉPICA Cliente 4 US-013: Filtros combinados en Rolling
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TipoComercialCliente } from '../../types/rolling.types';

interface TipoComercialFilterProps {
  value: TipoComercialCliente | 'TODOS';
  onChange: (tipo: TipoComercialCliente | 'TODOS') => void;
}

const tipoComercialOptions: { value: TipoComercialCliente | 'TODOS'; label: string }[] = [
  { value: 'TODOS', label: 'Todos los tipos' },
  { value: 'BASE_INSTALADA', label: 'Base Instalada' },
  { value: 'NUEVA_VENTA', label: 'Nueva Venta' },
];

export function TipoComercialFilter({ value, onChange }: TipoComercialFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TipoComercialCliente | 'TODOS')}>
      <SelectTrigger className="w-48 h-10 bg-white border-stone-200 focus:ring-stone-300">
        <SelectValue placeholder="Filtrar por tipo" />
      </SelectTrigger>
      <SelectContent>
        {tipoComercialOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
