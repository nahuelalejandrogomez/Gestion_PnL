import { useState, useRef, useEffect } from 'react';

interface ManualCostCellProps {
  value: number;
  isDirty: boolean;
  onChange: (value: number) => void;
  formatFn: (value: number) => string;
  onPaintStart?: (value: number) => void;
  onPaintEnter?: () => void;
}

export function ManualCostCell({ value, isDirty, onChange, formatFn, onPaintStart, onPaintEnter }: ManualCostCellProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setLocalValue(String(Math.round(value)));
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const num = Math.max(0, Number(localValue) || 0);
    if (num !== value) {
      onChange(num);
    }
  };

  const dirtyMark = isDirty ? 'ring-1 ring-amber-400' : '';

  if (editing) {
    return (
      <td className="p-0">
        <input
          ref={inputRef}
          type="number"
          min={0}
          step={1000}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setLocalValue(String(Math.round(value))); }
          }}
          className="w-full h-8 text-center text-xs border-0 outline-none ring-2 ring-stone-400 rounded-sm bg-white"
        />
      </td>
    );
  }

  return (
    <td
      className={`p-0 cursor-pointer select-none ${dirtyMark} border border-stone-100 bg-stone-50/50`}
      onClick={() => setEditing(true)}
      onMouseDown={(e) => {
        if (e.button === 0 && onPaintStart) onPaintStart(value);
      }}
      onMouseEnter={onPaintEnter}
    >
      <div className="w-full h-8 flex items-center justify-center text-xs text-stone-600">
        {value > 0 ? formatFn(value) : '-'}
      </div>
    </td>
  );
}
