export const STAGE_COLOR_MAP = {
  blue:   { badge: 'bg-blue-500/15 text-blue-400',    kanban: 'bg-blue-500/10 border-blue-500/20',    text: 'text-blue-400',    swatch: 'bg-blue-500' },
  purple: { badge: 'bg-purple-500/15 text-purple-400', kanban: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400',  swatch: 'bg-purple-500' },
  yellow: { badge: 'bg-yellow-500/15 text-yellow-400', kanban: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400',  swatch: 'bg-yellow-500' },
  orange: { badge: 'bg-orange-500/15 text-orange-400', kanban: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400',  swatch: 'bg-orange-500' },
  red:    { badge: 'bg-red-500/15 text-red-400',      kanban: 'bg-red-500/10 border-red-500/20',      text: 'text-red-400',     swatch: 'bg-red-500' },
  green:  { badge: 'bg-green-500/15 text-green-400',  kanban: 'bg-green-500/10 border-green-500/20',  text: 'text-green-400',   swatch: 'bg-green-500' },
  teal:   { badge: 'bg-teal-500/15 text-teal-400',    kanban: 'bg-teal-500/10 border-teal-500/20',    text: 'text-teal-400',    swatch: 'bg-teal-500' },
  cyan:   { badge: 'bg-cyan-500/15 text-cyan-400',    kanban: 'bg-cyan-500/10 border-cyan-500/20',    text: 'text-cyan-400',    swatch: 'bg-cyan-500' },
  pink:   { badge: 'bg-pink-500/15 text-pink-400',    kanban: 'bg-pink-500/10 border-pink-500/20',    text: 'text-pink-400',    swatch: 'bg-pink-500' },
  indigo: { badge: 'bg-indigo-500/15 text-indigo-400', kanban: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-400', swatch: 'bg-indigo-500' },
  gray:   { badge: 'bg-gray-500/15 text-gray-400',    kanban: 'bg-gray-500/10 border-gray-500/20',    text: 'text-gray-400',    swatch: 'bg-gray-500' },
};

export const COLOR_OPTIONS = Object.keys(STAGE_COLOR_MAP);

export function getBadge(color) {
  return STAGE_COLOR_MAP[color]?.badge ?? STAGE_COLOR_MAP.gray.badge;
}

export function getKanban(color) {
  return STAGE_COLOR_MAP[color]?.kanban ?? STAGE_COLOR_MAP.gray.kanban;
}

export function getText(color) {
  return STAGE_COLOR_MAP[color]?.text ?? STAGE_COLOR_MAP.gray.text;
}
