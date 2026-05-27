const computeMetrics = (data) => {
  const totals = data.reduce(
    (acc, row) => ({
      adSpend: acc.adSpend + (row.adSpend || 0),
      impressions: acc.impressions + (row.impressions || 0),
      clicks: acc.clicks + (row.clicks || 0),
      leadsGenerated: acc.leadsGenerated + (row.leadsGenerated || 0),
      formCompletions: acc.formCompletions + (row.formCompletions || 0),
      callsBooked: acc.callsBooked + (row.callsBooked || 0),
      callsShowed: acc.callsShowed + (row.callsShowed || 0),
      callsClosed: acc.callsClosed + (row.callsClosed || 0),
      revenue: acc.revenue + (row.revenue || 0),
      cashCollected: acc.cashCollected + (row.cashCollected || 0),
    }),
    {
      adSpend: 0, impressions: 0, clicks: 0, leadsGenerated: 0,
      formCompletions: 0, callsBooked: 0, callsShowed: 0,
      callsClosed: 0, revenue: 0, cashCollected: 0,
    }
  );

  const safe = (num, den) => (den === 0 ? 0 : num / den);

  return {
    ...totals,
    cpl: safe(totals.adSpend, totals.leadsGenerated),
    cpm: safe(totals.adSpend * 1000, totals.impressions),
    ctr: safe(totals.clicks, totals.impressions),
    formCompletionRate: safe(totals.formCompletions, totals.leadsGenerated),
    showRate: safe(totals.callsShowed, totals.callsBooked),
    closeRate: safe(totals.callsClosed, totals.callsShowed),
    roas: safe(totals.revenue, totals.adSpend),
    costPerBookedInspection: safe(totals.adSpend, totals.callsBooked),
    costPerInspection: safe(totals.adSpend, totals.callsShowed),
    grossPerBookedInspection: safe(totals.revenue, totals.callsBooked),
    collectedPerBookedInspection: safe(totals.cashCollected, totals.callsBooked),
    aov: safe(totals.revenue, totals.callsClosed),
  };
};

const getDateRange = (period) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarterly':
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

module.exports = { computeMetrics, getDateRange };
