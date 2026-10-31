// Class sets for the selectable pills in the listing forms.
export const CHIP_STYLES = {
  amenity: {
    wrap: 'flex flex-wrap gap-3',
    chip: 'px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border',
    on: 'bg-gray-900 text-white border-gray-900 shadow-md',
    off: 'bg-white text-gray-600 border-gray-200 hover:border-gray-900',
  },
  feature: {
    wrap: 'flex flex-wrap gap-2.5',
    chip: 'px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border',
    on: 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]',
    off: 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900',
  },
  day: {
    wrap: 'flex flex-wrap gap-2',
    chip: 'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border',
    on: 'bg-gray-900 text-white border-gray-900 shadow-md',
    off: 'bg-white text-gray-600 border-gray-200 hover:border-gray-900',
  },
  service: {
    wrap: 'flex flex-wrap gap-2 mb-4',
    chip: 'px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border',
    on: 'bg-gray-900 text-white border-gray-900 shadow-md',
    off: 'bg-white text-gray-600 border-gray-200 hover:border-gray-900',
  },
  editDay: {
    wrap: 'flex flex-wrap gap-2',
    chip: 'px-4 py-2 rounded-lg text-sm font-semibold transition-all border',
    on: 'bg-gray-900 text-white border-gray-900',
    off: 'bg-white text-gray-600 border-gray-200 hover:border-gray-900',
  },
  editService: {
    wrap: 'flex flex-wrap gap-2',
    chip: 'px-4 py-2 rounded-full text-xs font-semibold transition-all border',
    on: 'bg-gray-900 text-white border-gray-900',
    off: 'bg-white text-gray-600 border-gray-200 hover:border-gray-900',
  },
};
