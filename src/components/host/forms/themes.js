// Class sets for the host listing forms. Each theme reproduces one existing look exactly.
export const FIELD_THEMES = {
  // "Studio" create forms (property, VIP)
  studio: {
    label: 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2',
    control: 'w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white',
    textarea: 'w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-base transition-all bg-gray-50/30 focus:bg-white resize-none',
  },
  // Studio edit form (VIP)
  studioEdit: {
    label: 'block text-xs font-bold uppercase text-gray-500 mb-2',
    control: 'w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-base bg-gray-50/50',
    textarea: 'w-full px-5 py-4 rounded-xl border border-gray-300 focus:border-gray-900 outline-none text-base bg-gray-50/50 resize-none',
  },
  // Edit forms (shortlet, car, hotel)
  edit: {
    label: 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2',
    control: 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-primary/50 outline-none',
    textarea: 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none resize-none',
  },
  // Compact car create form
  compact: {
    label: 'block text-xs font-semibold text-gray-700 mb-2',
    control: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-base transition-colors',
  },
  // Hotel wizard
  wizard: {
    label: 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2',
    control: 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all',
    textarea: 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all resize-none',
  },
};

export const joinClass = (...parts) => parts.filter(Boolean).join(' ');
