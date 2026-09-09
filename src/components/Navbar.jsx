import { useState } from 'react';
import { Home, Key, Map, Building2, Menu, UserCircle, Search as SearchIcon } from 'lucide-react';

export default function Navbar() {
  const [activeTab, setActiveTab] = useState('apartments');

  const categories = [
    { id: 'apartments', label: 'Apartments', icon: Home },
    { id: 'shortlet', label: 'Shortlets', icon: Key },
    { id: 'vacation', label: 'Vacation', icon: Map },
    { id: 'hotel', label: 'Hotels', icon: Building2 },
  ];

  return (
    <>
      {/* TOP NAVBAR (Desktop & Mobile Shell) */}
      <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center cursor-pointer text-brand-primary">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center mr-2 shadow-sm">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <span className="font-bold text-2xl hidden lg:block text-brand-primary tracking-tight">
                Rentals
              </span>
            </div>

            {/* DESKTOP CATEGORY TABS (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 justify-center px-8">
              <div className="flex space-x-1 bg-gray-50 p-1 rounded-full border border-gray-100 shadow-inner">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeTab === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.id)}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white shadow-sm text-brand-dark' 
                          : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : ''}`} />
                      <span>{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auth & Menu Section */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block font-medium text-sm text-brand-dark cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-full transition-colors">
                List your property
              </div>
              
              <button className="flex items-center space-x-3 border border-gray-200 p-2 pl-4 rounded-full hover:shadow-md transition-shadow bg-white">
                <Menu className="w-5 h-5 text-gray-500" />
                <UserCircle className="w-8 h-8 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 pb-safe">
        <div className="flex h-full justify-between items-center max-w-md mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeTab === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className="flex flex-col items-center justify-center w-full space-y-1"
              >
                <Icon 
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-brand-primary' : 'text-gray-400'
                  }`} 
                />
                <span 
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-brand-dark' : 'text-gray-500'
                  }`}
                >
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}