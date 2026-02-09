import { useState, useRef, useEffect } from 'react';

function getCellColor(value: number): string {
  if (value === 0) return '';
  if (value <= 50) return 'bg-emerald-50';
  if (value <= 99) return 'bg-emerald-100';
  if (value === 100) return 'bg-emerald-200';
  if (value <= 149) return 'bg-amber-100';
  return 'bg-red-100';
}

interface PlannerCellProps {
  value: number;
  isDirty: boolean;
  onChange: (value: number) => void;
  onPaintStart: (value: number) => void;
  onPaintEnter: () => void;
}

export function PlannerCell({ value, isDirty, onChange, onPaintStart, onPaintEnter }: PlannerCellProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setLocalValue(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const num = Math.max(0, Math.min(200, Number(localValue) || 0));
    if (num !== value) {
      onChange(num);
    }
  };

  const bgColor = getCellColor(value);
  const dirtyMark = isDirty ? 'ring-1 ring-amber-400' : '';

  if (editing) {
    return (
      <td className="p-0">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={200}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setLocalValue(String(value)); }
          }}
          className="w-full h-8 text-center text-sm border-0 outline-none ring-2 ring-stone-400 rounded-sm bg-white"
        />
      </td>
    );
  }

  return (
    <td
      className={`p-0 cursor-pointer select-none ${bgColor} ${dirtyMark} border border-stone-100`}
      onClick={() => setEditing(true)}
      onMouseDown={(e) => {
        if (e.button === 0) onPaintStart(value);
      }}
      onMouseEnter={onPaintEnter}
    >
      <div className="w-full h-8 flex items-center justify-center text-sm text-stone-700">
        {value > 0 ? value : ''}
      </div>
    </td>
  );
}
