import React, { useState, useMemo } from 'react';

export default function SortableTable({ columns, data, onRowClick, emptyMessage = 'No data available' }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-elevated">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider select-none ${col.sortable !== false ? 'cursor-pointer hover:text-white' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable !== false && sortKey === col.key && (
                    <span className="text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-text-secondary">
                <p className="text-2xl mb-2">📭</p>
                <p>{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-border/50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-bg-elevated' : 'hover:bg-bg-elevated/50'}`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-text-primary">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
