export const fmtCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

export const fmtPercent = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(1)}%`;
};

export const fmtNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(val));
};

export const fmtDays = (val) => {
  if (!val) return '0d';
  return `${val.toFixed(1)}d`;
};

export const fmtMinutes = (val) => {
  if (!val) return '0m';
  return `${val.toFixed(1)}m`;
};

export const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtX = (val) => {
  if (!val) return '0x';
  return `${val.toFixed(2)}x`;
};
