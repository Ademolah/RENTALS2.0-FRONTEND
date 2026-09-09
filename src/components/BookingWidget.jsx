import { Star, ChevronDown } from 'lucide-react';

export default function BookingWidget({ price }) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-card sticky top-28">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-brand-dark">₦{price.toLocaleString()}</span>
          <span className="text-gray-500 text-sm">night</span>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 fill-brand-dark text-brand-dark" />
          <span className="font-semibold text-sm">4.85</span>
          <span className="text-gray-500 text-sm underline">(142 reviews)</span>
        </div>
      </div>

      {/* Inputs structure */}
      <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
        <div className="flex border-b border-gray-300">
          <div className="flex-1 p-3 border-r border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">Check-in</div>
            <div className="text-sm text-gray-500 mt-0.5">Add date</div>
          </div>
          <div className="flex-1 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">Check-out</div>
            <div className="text-sm text-gray-500 mt-0.5">Add date</div>
          </div>
        </div>
        <div className="p-3 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">Guests</div>
            <div className="text-sm text-gray-500 mt-0.5">1 guest</div>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <button className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-bold text-lg transition-colors shadow-md">
        Reserve
      </button>

      <p className="text-center text-gray-500 text-sm mt-4">You won't be charged yet</p>
    </div>
  );
}