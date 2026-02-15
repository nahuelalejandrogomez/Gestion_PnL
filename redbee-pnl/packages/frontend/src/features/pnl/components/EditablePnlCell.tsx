import { useState, useEffect, useRef } from 'react';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  isEditable: boolean;
  isDirty: boolean;
  formatFn: (value: number | null) => string;
  className?: string;
}

export function EditablePnlCell({
  value,
  onChange,
  isEditable,
  isDirty,
  formatFn,
  className = '',
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditable) return;
    setInputValue(value !== null ? String(value) : '');
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = inputValue.trim() === '' ? null : Number(inputValue);
    if (!isNaN(numValue as number) || numValue === null) {
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const borderClass = isDirty
    ? 'border-2 border-blue-500'
    : isEditable
    ? 'border border-stone-200 hover:border-stone-300'
    : '';

  if (isEditing) {
    return (
      <td className={`py-1.5 px-2 text-right ${className}`}>
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full text-right text-xs bg-white ${borderClass} rounded px-1 py-0.5 focus:outline-none focus:border-blue-600`}
          min="0"
          step="0.01"
        />
      </td>
    );
  }

  return (
    <td
      className={`py-1.5 px-2 text-right tabular-nums cursor-pointer ${className} ${
        isEditable ? 'hover:bg-stone-100' : ''
      }`}
      onClick={handleClick}
    >
      <div className={`inline-block rounded px-1 ${borderClass}`}>
        {formatFn(value)}
      </div>
    </td>
  );
}
