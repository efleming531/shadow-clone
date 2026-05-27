import React from 'react';
import { fmtPercent, fmtNumber } from '../../utils/formatters';

const STAGES = [
  { key: 'leadsGenerated', label: 'Leads' },
  { key: 'callsBooked', label: 'Booked' },
  { key: 'callsShowed', label: 'Showed' },
  { key: 'callsClosed', label: 'Closed' },
];

export default function FunnelChart({ data }) {
  if (!data) return null;

  const values = STAGES.map(s => data[s.key] || 0);
  const max = values[0] || 1;

  return (
    <div className="space-y-2">
      {STAGES.map((stage, i) => {
        const val = values[i];
        const prev = i > 0 ? values[i - 1] : val;
        const dropOff = prev > 0 ? 1 - val / prev : 0;
        const width = (val / max) * 100;

        return (
          <div key={stage.key}>
            {i > 0 && (
              <div className="flex items-center gap-2 my-1 ml-4">
                <div className="h-4 w-px bg-border" />
                <span className="text-xs text-red-400 font-medium">
                  {fmtPercent(dropOff)} drop-off
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-14 text-right">{stage.label}</span>
              <div className="flex-1 bg-bg-elevated rounded-full h-8 relative overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60 flex items-center px-3 transition-all duration-500"
                  style={{ width: `${Math.max(width, 4)}%` }}
                >
                  <span className="text-xs font-bold text-white whitespace-nowrap">{fmtNumber(val)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
