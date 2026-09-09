import { useState } from 'react';
import { 
  Building2, Users, Wallet, Calendar, Plus, 
  CheckCircle2, Clock, ShieldCheck, ArrowUpRight, 
  Landmark, AlertCircle
} from 'lucide-react';
import AddPropertyModal from '../components/AddPropertyModal';

export default function LandlordDashboard() {
  const [activeTab, setActiveTab] = useState('guests');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock initial state for checked-in guests matching backend structure
  const [reservations, setReservations] = useState([
    {
      id: 'RES-8921',
      guestName: 'Chidi Okonkwo',
      propertyTitle: 'Minimalist Luxury Suite - Ikoyi',
      checkInDate: '2026-09-07',
      checkOutDate: '2026-09-14',
      daysRemaining: 5,
      totalAmount: 1050000,
      status: 'CHECKED_IN', // Options: 'BOOKED', 'CHECKED_IN', 'COMPLETED'
      escrowStatus: 'HELD_IN_ESCROW'
    },
    {
      id: 'RES-4410',
      guestName: 'Amina Bello',
      propertyTitle: 'Waterfront Penthouse - Victoria Island',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-15',
      daysRemaining: 5,
      totalAmount: 850000,
      status: 'BOOKED',
      escrowStatus: 'HELD_IN_ESCROW'
    }
  ]);

  // Bank account configuration state for Paystack payouts
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Guaranty Trust Bank (GTB)',
    accountNumber: '0123456789',
    accountName: 'Oyinmax Properties Ltd',
    isVerified: true
  });

  const handleStatusChange = (id, newStatus) => {
    setReservations(prev => prev.map(res => {
      if (res.id === id) {
        return { ...res, status: newStatus };
      }
      return res;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-gray-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Landlord Portal
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-500 text-xs font-medium">Verified Partner</span>
            </div>
            <h1 className="text-3xl font-extrabold text-brand-dark mt-1">Host Operations Center</h1>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-hover text-white font-bold px-5 py-3.5 rounded-2xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>List New Property</span>
          </button>
        </div>

        {/* METRICS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-8">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex justify-between items-start text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-brand-dark">₦4,250,000</span>
              <div className="flex items-center space-x-1 text-emerald-600 text-xs mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.2% from last month</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex justify-between items-start text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Occupancy</span>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-brand-dark">1 Active Guest</span>
              <p className="text-xs text-gray-500 mt-1">1 upcoming arrival scheduled</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex justify-between items-start text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Escrow Balance</span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-brand-dark">₦1,900,000</span>
              <p className="text-xs text-gray-500 mt-1">Protected by Rentals Escrow</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex justify-between items-start text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Listed Properties</span>
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-brand-dark">3 Active</span>
              <p className="text-xs text-emerald-600 mt-1 font-medium">100% verified status</p>
            </div>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-gray-200 mb-6 space-x-8">
          <button
            onClick={() => setActiveTab('guests')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'guests'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-dark'
            }`}
          >
            Live Guest Check-In & Reservations
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'payouts'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-dark'
            }`}
          >
            Payout Settlement Setup
          </button>
        </div>

        {/* TAB 1: GUEST CHECK-IN & RESERVATIONS MANAGER */}
        {activeTab === 'guests' && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-bold text-brand-dark">Current Guest Schedules</h3>
                <p className="text-xs text-gray-500">Manage real-time guest arrivals and check-in confirmation</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6">Guest & Property</th>
                    <th className="py-4 px-6">Dates</th>
                    <th className="py-4 px-6">Days Remaining</th>
                    <th className="py-4 px-6">Payout Escrow</th>
                    <th className="py-4 px-6">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      <td className="py-4 px-6">
                        <div className="font-bold text-brand-dark">{res.guestName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{res.propertyTitle}</div>
                        <span className="text-[10px] font-mono text-gray-400">{res.id}</span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1.5 text-xs text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{res.checkInDate} to {res.checkOutDate}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {res.status === 'CHECKED_IN' ? (
                          <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{res.daysRemaining} Days Left</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Pending Arrival</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-brand-dark">₦{res.totalAmount.toLocaleString()}</div>
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {res.escrowStatus}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {res.status === 'BOOKED' && (
                          <button
                            onClick={() => handleStatusChange(res.id, 'CHECKED_IN')}
                            className="bg-brand-primary hover:bg-brand-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Checked In</span>
                          </button>
                        )}

                        {res.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleStatusChange(res.id, 'COMPLETED')}
                            className="bg-gray-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                          >
                            Confirm Checkout
                          </button>
                        )}

                        {res.status === 'COMPLETED' && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Stay Complete</span>
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PAYOUT SETTLEMENT SETUP */}
        {activeTab === 'payouts' && (
          <div className="max-w-2xl bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex items-center space-x-3 pb-6 border-b border-gray-100">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-brand-dark">Bank Settlement Account</h3>
                <p className="text-xs text-gray-500">Paystack automated disbursements are transferred directly to this account</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Bank Name</label>
                <input 
                  type="text" 
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">NUBAN Account Number</label>
                <input 
                  type="text" 
                  maxLength={10}
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">Verified Account Name</label>
                <input 
                  type="text" 
                  disabled
                  value={bankDetails.accountName}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 text-sm font-semibold cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Paystack Recipient Verified</span>
                </div>
                <button className="bg-brand-primary hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">
                  Save Settlement Details
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <AddPropertyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}