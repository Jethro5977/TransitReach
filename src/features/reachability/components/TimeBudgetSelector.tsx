interface TimeBudgetProps {
  value: number;
  onChange: (min: number) => void;
}

export function TimeBudgetSelector({ value, onChange }: TimeBudgetProps) {
  const options = [15, 30, 45, 60];
  return (
    <div className="relative flex items-center gap-1.5 p-1 glass-chip rounded-xl">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`chip ${value === opt ? 'chip-selected' : 'chip-unselected'}`}
          style={{ padding: '6px 14px' }}
        >
          {opt} min
        </button>
      ))}
    </div>
  );
}
