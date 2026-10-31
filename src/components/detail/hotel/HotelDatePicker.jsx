import { toLocalISO } from '../../../lib/dates';
import CalendarHeader from '../CalendarHeader';
import { useMonthCalendar } from '../useMonthCalendar';

const shortDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function DateBlock({ label, value, active, onClick, className }) {
  return (
    <div onClick={onClick} className={`${className} ${active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
      <label className="text-xs font-display font-bold text-brand-text-secondary uppercase tracking-widest mb-1 block">{label}</label>
      <div className={`text-base ${value ? 'font-bold text-brand-dark' : 'font-medium text-brand-text-muted'}`}>
        {value ? shortDate(value) : 'Add Date'}
      </div>
    </div>
  );
}

// "Select your dates" section: check-in and check-out blocks with one calendar popover.
export default function HotelDatePicker({ booking, city }) {
  const {
    checkInDate, checkOutDate, showCalendar, setShowCalendar, calendarMode, openCalendar, selectDate, nights,
  } = booking;
  const calendar = useMonthCalendar();

  return (
    <div id="dates-section" className="pt-2 pb-4">
      <h2 className="text-3xl font-display font-bold text-brand-dark tracking-tight mb-2">Select your dates</h2>
      <p className="text-brand-text-secondary text-base font-medium mb-6">
        {checkInDate && checkOutDate
          ? `${nights} ${nights === 1 ? 'night' : 'nights'} in ${city}`
          : 'Add your travel dates for exact pricing'}
      </p>

      <div className="relative max-w-xl">
        <div className={`border rounded-2xl overflow-hidden bg-white shadow-sm transition-all flex flex-col sm:flex-row ${showCalendar ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-gray-300'}`}>
          <DateBlock
            label="Check-In"
            value={checkInDate}
            active={calendarMode === 'checkIn' && showCalendar}
            onClick={() => openCalendar('checkIn')}
            className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-gray-300 cursor-pointer transition-colors"
          />
          <DateBlock
            label="Checkout"
            value={checkOutDate}
            active={calendarMode === 'checkOut' && showCalendar}
            onClick={() => openCalendar('checkOut')}
            className="flex-1 p-4 cursor-pointer transition-colors"
          />
        </div>

        {showCalendar && (
          <div className="absolute top-[85px] sm:top-[75px] left-0 mt-2 w-full sm:w-[320px] bg-white border border-gray-200 shadow-elevated rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95">
            <CalendarHeader viewDate={calendar.viewDate} onPrev={calendar.prevMonth} onNext={calendar.nextMonth} />
            <div className="grid grid-cols-7 gap-y-2">
              {calendar.days().map((dateObj, i) => {
                if (!dateObj) return <div key={i} className="h-8"></div>;

                const dateStr = toLocalISO(dateObj);
                const isPast = dateObj < calendar.today;
                const isSelectedIn = dateStr === checkInDate;
                const isSelectedOut = dateStr === checkOutDate;
                const isBetween = checkInDate && checkOutDate && dateStr > checkInDate && dateStr < checkOutDate;

                const isDisabledForCheckOut = calendarMode === 'checkOut' && checkInDate && dateStr <= checkInDate;
                const disabled = isPast || isDisabledForCheckOut;

                let bgClass = 'hover:bg-gray-100 text-brand-dark';
                if (disabled) bgClass = 'text-gray-300 cursor-not-allowed';
                if (isBetween) bgClass = 'bg-brand-primary/10 text-brand-dark';
                if (isSelectedIn || isSelectedOut) bgClass = 'bg-brand-primary text-white shadow-md';

                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={(e) => { e.preventDefault(); selectDate(dateObj); }}
                    className={`h-9 w-9 mx-auto rounded-full text-sm font-bold transition-all flex items-center justify-center ${bgClass}`}
                  >
                    {dateObj.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">
                Selecting: {calendarMode === 'checkIn' ? 'Check-in' : 'Check-out'}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); setShowCalendar(false); }}
                className="text-xs font-bold text-brand-dark underline underline-offset-2 hover:text-brand-primary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
