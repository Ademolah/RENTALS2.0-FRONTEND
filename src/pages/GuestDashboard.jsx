import { ShieldCheck, Calendar, MapPin, Key } from 'lucide-react';

export default function GuestDashboard() {
  const bookings = [
    {
      id: 'RES-8921',
      title: 'Minimalist Luxury Suite with Ocean View',
      location: 'Ikoyi, Lagos',
      checkIn: 'Sep 07, 2026',
      checkOut: 'Sep 14, 2026',
      status: 'CHECKED_IN',
      code: '8492-KEY'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
            Guest Account
          </span>
          <h1 className="text-3xl font-extrabold text-brand-dark mt-1">Trips & Reservations</h1>
        </div>

        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Active Stay
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{booking.id}</span>
                </div>

                <h3 className="font-bold text-lg text-brand-dark">{booking.title}</h3>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{booking.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{booking.checkIn} - {booking.checkOut}</span>
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200/80 p-4 rounded-xl flex items-center justify-between md:justify-end space-x-4 shrink-0">
                <div>
                  <div className="text-[10px] font-bold uppercase text-gray-400 flex items-center space-x-1">
                    <Key className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Access Code</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-brand-dark">{booking.code}</div>
                </div>

                <div className="pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Escrow Protected</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}