import { Calendar as CalendarIcon } from 'lucide-react';
import { toLocalISO } from '../../../lib/dates';
import { isDayBooked } from '../../../lib/availability';
import CalendarHeader from '../CalendarHeader';
import { useMonthCalendar } from '../useMonthCalendar';

// Pick-up date field with its calendar popover. Booked days are struck out.
export default function CarDatePicker({ pickupDate, showCalendar, setShowCalendar, onSelect, bookedDates }) {
  const calendar = useMonthCalendar();

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 mb-2.5">
        <CalendarIcon className="w-3.5 h-3.5 text-brand-text-muted" />
        <label className="text-xs font-bold uppercase tracking-widest text-brand-dark">Pickup Date</label>
      </div>

      <div
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full bg-white border rounded-xl py-3.5 pl-4 pr-4 cursor-pointer transition-colors flex items-center justify-between ${showCalendar ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <span className={pickupDate ? 'text-brand-dark font-bold text-base' : 'text-brand-text-muted font-medium text-base'}>
          {pickupDate ? new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
        </span>
      </div>

      {showCalendar && (
        <div className="absolute top-[70px] left-0 w-full bg-white border border-gray-200 shadow-elevated rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95">
          <CalendarHeader viewDate={calendar.viewDate} onPrev={calendar.prevMonth} onNext={calendar.nextMonth} />
          <div className="grid grid-cols-7 gap-y-2">
            {calendar.days().map((dateObj, i) => {
              if (!dateObj) return <div key={i} className="h-8"></div>;

              const dateStr = toLocalISO(dateObj);
              const isPast = dateObj < calendar.today;
              const isSelected = dateStr === pickupDate;
              const isTaken = isDayBooked(bookedDates, dateStr);

              let bgClass = 'hover:bg-gray-100 text-brand-dark';
              if (isPast) bgClass = 'text-gray-300 cursor-not-allowed';
              if (isTaken && !isPast) bgClass = 'text-gray-400 line-through cursor-not-allowed bg-gray-50';
              if (isSelected) bgClass = 'bg-gray-900 text-white shadow-md';

              return (
                <button
                  key={i}
                  disabled={isPast || isTaken}
                  onClick={(e) => { e.preventDefault(); onSelect(dateObj); }}
                  className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center ${bgClass}`}
                >
                  {dateObj.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-right">
            <button
              onClick={(e) => { e.preventDefault(); setShowCalendar(false); }}
              className="text-xs font-bold text-brand-dark underline underline-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
