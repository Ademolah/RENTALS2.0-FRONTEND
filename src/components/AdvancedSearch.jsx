import { Search, SlidersHorizontal } from 'lucide-react';

export default function AdvancedSearch() {
  return (
    <div className="w-full flex justify-center mt-4 md:mt-8 px-4 z-30 relative">
      
      {/* DESKTOP VIEW: Expanded Search Bar (Hidden on Mobile) */}
      <div className="hidden md:flex bg-white border border-gray-200 rounded-full shadow-search items-center max-w-4xl w-full divide-x divide-gray-200 transition-all hover:shadow-lg">
        
        {/* Location */}
        <button className="flex-1 text-left pl-8 pr-4 py-3 hover:bg-gray-50 rounded-l-full transition-colors group">
          <div className="text-xs font-bold tracking-wide text-brand-dark">Where</div>
          <div className="text-sm text-gray-500 group-hover:text-gray-700 truncate">Search destinations</div>
        </button>

        {/* Check In */}
        <button className="flex-1 text-left px-6 py-3 hover:bg-gray-50 transition-colors group">
          <div className="text-xs font-bold tracking-wide text-brand-dark">Check in</div>
          <div className="text-sm text-gray-500 group-hover:text-gray-700">Add dates</div>
        </button>

        {/* Check Out */}
        <button className="flex-1 text-left px-6 py-3 hover:bg-gray-50 transition-colors group">
          <div className="text-xs font-bold tracking-wide text-brand-dark">Check out</div>
          <div className="text-sm text-gray-500 group-hover:text-gray-700">Add dates</div>
        </button>

        {/* Guests & Search Button */}
        <div className="flex-1 flex justify-between items-center pl-6 pr-2 py-2 hover:bg-gray-50 rounded-r-full transition-colors cursor-pointer group">
          <div className="text-left">
            <div className="text-xs font-bold tracking-wide text-brand-dark">Who</div>
            <div className="text-sm text-gray-500 group-hover:text-gray-700">Add guests</div>
          </div>
          <button className="bg-brand-primary p-4 rounded-full text-white hover:bg-brand-hover transition-colors flex items-center justify-center shadow-md">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE VIEW: Compact Search Pill (Hidden on Desktop) */}
      <div className="md:hidden flex items-center bg-white border border-gray-200 rounded-full shadow-card w-full p-2 pl-4 cursor-pointer hover:shadow-md transition-shadow">
        <Search className="w-5 h-5 text-gray-800 mr-4" />
        <div className="flex flex-col flex-grow text-left">
          <span className="text-sm font-semibold text-brand-dark">Where to?</span>
          <span className="text-xs text-gray-500 flex items-center space-x-1">
            <span>Anywhere</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
            <span>Any week</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
            <span>Add guests</span>
          </span>
        </div>
        <div className="p-2 border border-gray-200 rounded-full ml-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-dark" />
        </div>
      </div>

    </div>
  );
}