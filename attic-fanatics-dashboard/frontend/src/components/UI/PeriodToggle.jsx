import React from 'react';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function PeriodToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            value === p.value
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
