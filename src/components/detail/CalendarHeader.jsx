import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarHeader({ viewDate, onPrev, onNext }) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <button onClick={onPrev} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-display font-bold text-base tracking-widest uppercase text-brand-dark">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={onNext} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-display font-bold text-brand-text-muted tracking-widest uppercase">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>
    </>
  );
}
