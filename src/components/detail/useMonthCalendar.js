import { useState } from 'react';

// Calendar day maths shared by the car and hotel date pickers.
export const toPickedIso = (dateObj) =>
  new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];

export function useMonthCalendar() {
  const [viewDate, setViewDate] = useState(() => new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const list = [];
    for (let i = 0; i < firstDay; i += 1) list.push(null);
    for (let i = 1; i <= daysInMonth; i += 1) list.push(new Date(year, month, i));
    return list;
  };

  const nextMonth = (e) => {
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  const prevMonth = (e) => {
    e.preventDefault();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  return { viewDate, today, days, nextMonth, prevMonth };
}
