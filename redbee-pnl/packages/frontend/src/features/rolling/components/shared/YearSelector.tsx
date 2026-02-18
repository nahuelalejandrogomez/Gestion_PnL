/**
 * YearSelector - Selector de año con dropdown
 * ÉPICA 1 US-003: Dropdown funcional con validación
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface YearSelectorProps {
  year: number;
  onChange: (year: number) => void;
}

export function YearSelector({ year, onChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Select value={String(year)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-24 h-9 bg-white border-stone-200 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
