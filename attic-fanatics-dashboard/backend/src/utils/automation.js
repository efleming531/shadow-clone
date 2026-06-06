async function runAutomations(trigger, payload, prisma) {
  const result = { triggered: 0, executed: 0, errors: [] };
  try {
    if (!payload.tenantId) return result;

    const rules = await prisma.automationRule.findMany({
      where: { tenantId: payload.tenantId, trigger, active: true }
    });
    result.triggered = rules.length;

    for (const rule of rules) {
      const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
      const actions = Array.isArray(rule.actions) ? rule.actions : [];

      // Evaluate conditions (simple field equality checks)
      const conditionsMet = conditions.every(c => {
        const fieldValue = payload[c.field];
        return c.operator === 'equals' ? String(fieldValue) === String(c.value) : true;
      });
      if (!conditionsMet) continue;

      for (const action of actions) {
        try {
          if (action.type === 'assign_rep') {
            // Find rep with fewest open leads
            const reps = await prisma.user.findMany({
              where: { tenantId: payload.tenantId, role: { in: ['sales_rep', 'REP', 'MANAGER'] }, active: true }
            });
            if (reps.length > 0) {
              // Count open leads per rep
              const counts = await Promise.all(reps.map(async r => {
                const count = await prisma.lead.count({
                  where: { assignedRepId: r.id, status: { notIn: ['closed_won', 'closed_lost'] } }
                });
                return { rep: r, count };
              }));
              counts.sort((a, b) => a.count - b.count);
              const assignTo = counts[0].rep;
              await prisma.lead.update({
                where: { id: payload.id },
                data: { assignedRepId: assignTo.id }
              });
              result.executed++;
            }
          } else if (action.type === 'send_notification') {
            // Find the assigned rep
            const lead = await prisma.lead.findUnique({ where: { id: payload.id } });
            if (lead?.assignedRepId) {
              await prisma.notification.create({
                data: {
                  userId: lead.assignedRepId,
                  type: 'new_lead',
                  title: action.config?.title || 'New Lead',
                  body: action.config?.body || 'A new lead has been assigned to you.',
                  link: `/leads/${lead.id}`,
                }
              });
              result.executed++;
            }
          } else if (action.type === 'log') {
            console.log('[Automation]', rule.name, action);
            result.executed++;
          }
        } catch (actionErr) {
          console.error('[Automation] Action error:', actionErr.message);
          result.errors.push({ action: action.type, error: actionErr.message });
        }
      }
    }
  } catch (err) {
    console.error('[Automation] Engine error:', err.message);
    result.errors.push({ error: err.message });
  }
  return result;
}

module.exports = { runAutomations };
