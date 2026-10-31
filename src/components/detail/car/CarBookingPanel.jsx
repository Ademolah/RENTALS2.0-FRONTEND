import { Loader2, ShieldCheck, CheckCircle2, CalendarSearch } from 'lucide-react';
import { WhatsAppCheckout } from '../../ui';
import AvailabilityNotice from '../../AvailabilityNotice';
import CancellationNote from '../CancellationNote';
import { checkCarAvailability } from '../../../api/car';
import { addDays } from '../../../lib/availability';
import { slotRange, lagosIso } from './carHelpers';
import CarDatePicker from './CarDatePicker';
import { TimeAndDuration, BookingOptions } from './CarOptions';

function LiveReceipt({ pricing, durationSlots, needsChauffeur }) {
  return (
    <div className="space-y-2 pt-5 mt-5 border-t border-gray-100">
      <div className="flex justify-between text-gray-600 text-xs">
        <span className="underline decoration-gray-300 underline-offset-4">
          ₦{pricing.baseRate.toLocaleString()} x {durationSlots} slots
        </span>
        <span className="font-bold text-brand-dark">₦{pricing.rentalTotal.toLocaleString()}</span>
      </div>

      {needsChauffeur && (
        <div className="flex justify-between text-gray-600 text-xs animate-in slide-in-from-top-1 duration-200">
          <span className="underline decoration-gray-300 underline-offset-4 flex items-center"> Chauffeur Fee</span>
          <span className="font-bold text-brand-dark">₦{pricing.chauffeurRate.toLocaleString()}</span>
        </div>
      )}

      {pricing.deliveryRate > 0 && (
        <div className="flex justify-between text-gray-600 text-sm">
          <span className="underline decoration-gray-300 underline-offset-4">Delivery fee</span>
          <span className="font-bold text-brand-dark">₦{pricing.deliveryRate.toLocaleString()}</span>
        </div>
      )}

      <div className="flex justify-between font-display font-bold text-brand-dark text-base pt-3 border-t border-gray-200 mt-2">
        <span>Total</span>
        <span>₦{pricing.grandTotal.toLocaleString()}</span>
      </div>
    </div>
  );
}

function AvailabilityStatus({ car, booking }) {
  const { availabilityStatus, pickupDate, pickupTime, durationSlots, changePickupDate } = booking;
  if (availabilityStatus === 'available') {
    return (
      <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200 mt-2 animate-in fade-in">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-xs font-bold">Vehicle is available!</span>
      </div>
    );
  }
  if (availabilityStatus === 'booked') {
    return (
      <div className="mt-2">
        <AvailabilityNotice
          start={pickupDate}
          end={addDays(pickupDate, Math.max(1, Math.ceil(durationSlots / 2)))}
          isFree={async (d) => {
            const { start, end } = slotRange(d, pickupTime, durationSlots);
            return (await checkCarAvailability(car._id || car.id, { startDate: lagosIso(start), endDate: lagosIso(end) })).available !== false;
          }}
          onPick={(d) => changePickupDate(d)}
        />
      </div>
    );
  }
  return null;
}

// Right column of the car page: price, date and add-ons, availability, actions and live receipt.
export default function CarBookingPanel({ car, booking }) {
  const {
    pricing, durationSlots, needsChauffeur,
    bookingError, bookingLoading, isCheckingAvailability, availabilityStatus,
    isWhatsappLoading, pickupDate, pickupTime, showCalendar, setShowCalendar,
    selectPickupDate, changePickupTime, changeDuration,
    handleReservation, handleCheckAvailability, handleWhatsAppClick,
  } = booking;

  return (
    <div className="lg:col-span-1">
      <div className="bg-white border border-gray-100 p-6 lg:p-7 rounded-3xl shadow-elevated sticky top-28">

        <div className="flex items-baseline space-x-1 mb-5 pb-5 border-b border-gray-100 transition-all duration-300">
          <span className="text-4xl font-display font-bold text-brand-dark tracking-tight">
            ₦{pricing ? pricing.subtotal.toLocaleString() : Number(car.pricePer12Hours).toLocaleString()}
          </span>
          <span className="text-brand-text-secondary text-base font-medium">
            {pricing && durationSlots > 1 ? '/ total' : '/ 12 hrs'}
          </span>
        </div>

        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-start animate-in fade-in">
            <span>{bookingError}</span>
          </div>
        )}

        <form onSubmit={handleReservation} className="space-y-3">
          <div className="space-y-5 p-4 lg:p-5 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm relative">
            <CarDatePicker
              pickupDate={pickupDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              onSelect={selectPickupDate}
              bookedDates={car.bookedDates}
            />
            <div className="w-full h-px bg-gray-200/60"></div>
            <TimeAndDuration pickupTime={pickupTime} onTime={changePickupTime} durationSlots={durationSlots} onDuration={changeDuration} />
          </div>

          <BookingOptions car={car} booking={booking} />

          <AvailabilityStatus car={car} booking={booking} />

          <CancellationNote className="text-sm text-brand-text-secondary leading-relaxed" />

          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleCheckAvailability}
                disabled={isCheckingAvailability}
                className="w-1/2 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-brand-dark rounded-xl font-bold text-base transition-all flex items-center justify-center shadow-sm disabled:opacity-70 active:scale-95 duration-200"
              >
                {isCheckingAvailability ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CalendarSearch className="w-3.5 h-3.5 mr-1.5" />
                    Availability
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={bookingLoading || availabilityStatus === 'booked'}
                className="w-1/2 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-base transition-all shadow-md flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 duration-200"
              >
                {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reserve Now'}
              </button>
            </div>

            <WhatsAppCheckout onClick={handleWhatsAppClick} loading={!!isWhatsappLoading} />
          </div>
        </form>

        <div className="flex items-center justify-center space-x-1.5 text-brand-text-secondary mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Secure Payment Protection</span>
        </div>

        {pricing && <LiveReceipt pricing={pricing} durationSlots={durationSlots} needsChauffeur={needsChauffeur} />}
      </div>
    </div>
  );
}
