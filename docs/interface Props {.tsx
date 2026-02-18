interface Props {
  year: number;
  onChange: (year: number) => void;
}

export function YearSelector({ year, onChange }: Props) {
  return (
    <div className="text-sm text-stone-600">
      Año: {year} {/* Placeholder - implementar en US-003 */}
    </div>
  );
}
