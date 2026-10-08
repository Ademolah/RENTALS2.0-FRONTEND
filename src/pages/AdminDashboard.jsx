import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building, Wallet, 
  Settings, CheckCircle2, XCircle, Eye, Loader2, 
  Search, Filter, X, ShieldCheck, Mail, Phone, Clock,
  TrendingUp, Home, Car, Menu
} from 'lucide-react';
import { 
  getHostApplications, approveHostApplication, rejectHostApplication,
  getDashboardStats, getEscrowLedger, getAssetOversight, toggleAssetStatus 
} from '../api/admin'; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('applications');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- STATE ---
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ properties: [], cars: [] });
  
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // --- ROUTER EFFECT ---
  useEffect(() => {
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'escrow') fetchLedger();
    if (activeTab === 'assets') fetchAssets();
  }, [activeTab]);

  // --- FETCHERS ---
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getHostApplications();
      setApplications(res.data?.requests || res.data?.applications || res.data || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await getEscrowLedger();
      setLedger(res.data?.ledger || []);
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await getAssetOversight();
      setAssets({
        properties: res.data?.properties || [],
        cars: res.data?.cars || []
      });
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveHostApplication(id);
      setApplications(apps => apps.filter(app => app._id !== id));
      setSelectedApp(null);
    } catch (error) {
      console.error("Approval failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      await rejectHostApplication(id, 'Failed internal verification');
      setApplications(apps => apps.filter(app => app._id !== id));
      setSelectedApp(null);
    } catch (error) {
      console.error("Rejection failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAsset = async (type, id, field, currentValue) => {
    try {
      const payload = { [field]: !currentValue };
      await toggleAssetStatus(type, id, payload);
      
      if (type === 'PROPERTY' || type === 'SHORTLET' || type === 'HOTEL' || type === 'VIP RESERVATION') {
        setAssets(prev => ({
          ...prev,
          properties: prev.properties.map(p => p._id === id ? { ...p, ...payload } : p)
        }));
      } else {
        setAssets(prev => ({
          ...prev,
          cars: prev.cars.map(c => c._id === id ? { ...c, ...payload } : c)
        }));
      }
    } catch (error) {
      console.error("Failed to toggle asset", error);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Host Applications', icon: Users },
    { id: 'assets', label: 'Asset Oversight', icon: Building },
    { id: 'escrow', label: 'Escrow Ledger', icon: Wallet },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-gray-900" />
          <span className="text-sm font-black tracking-widest uppercase text-gray-900">Rentals Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* --- SIDEBAR COMMAND CENTER --- */}
      <aside className={`w-64 bg-white border-r border-gray-200 fixed h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-gray-900" />
          <span className="text-sm font-black tracking-widest uppercase text-gray-900">Rentals Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); // Close mobile menu on click
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {item.id === 'applications' && applications.length > 0 && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-dark'}`}>
                    {applications.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-[100vw] overflow-hidden">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Manage and oversee platform operations.</p>
          </div>
        </header>

        {/* --- TAB 1: OVERVIEW STATS --- */}
       {/* --- TAB 1: OVERVIEW STATS --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : stats ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Network Card */}
                <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network</h3>
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-black text-gray-900 tracking-tight">{stats.users.totalUsers}</div>
                      <div className="text-sm font-bold text-gray-400 mt-1">Total Registered Users</div>
                    </div>
                    <div className="pt-5 border-t border-gray-100 flex justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-gray-900">{stats.users.totalHosts}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Verified Hosts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-brand-primary">{stats.users.pendingHosts}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Pending Apps</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Card */}
                <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Inventory</h3>
                    <Building className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <div className="text-2xl font-black text-gray-900">{stats.assets.totalShortlets}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Shortlets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-gray-900">{stats.assets.totalHotels}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Hotels</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-gray-900">{stats.assets.totalVip}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">VIP Venues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-gray-900">{stats.assets.totalCars}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Vehicles</div>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Card (Dark Mode) */}
                <div className="bg-gray-900 p-6 border border-gray-800 rounded-xl shadow-lg text-white">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Ledger</h3>
                    <Wallet className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-black tracking-tight">
                        ₦{(stats.financials.totalPlatformVolume / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm font-bold text-gray-400 mt-1">Total Transaction Volume</div>
                    </div>
                    <div className="pt-5 border-t border-gray-800 flex justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-emerald-400">₦{stats.financials.totalPlatformRevenue.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Platform Cut (5%)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-amber-400">₦{stats.financials.escrowCurrentlyHeld.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Escrow Held</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-gray-500 font-bold">No stats available.</div>
            )}
          </div>
        )}

        {/* --- TAB 2: HOST APPLICATIONS --- */}
        {activeTab === 'applications' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Applicant Name</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">NIN / ID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Location</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /></td></tr>
                  ) : applications.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No pending host applications.</td></tr>
                  ) : (
                    applications.map((app) => {
                      const name = app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : (app.firstName || 'Unknown');
                      return (
                        <tr key={app._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900 whitespace-nowrap">{name}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{app.nin || 'N/A'}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{app.city}, {app.state}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-200 w-fit">
                              <Clock className="w-3 h-3 mr-1" /> {app.status}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedApp(app)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-gray-900 hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /><span>Review</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: ASSET OVERSIGHT --- */}
        {activeTab === 'assets' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Host</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Verified Badge</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                  ) : (
                    [...assets.properties, ...assets.cars].map((asset) => {
                      const isCar = !!asset.make;
                      const typeStr = isCar ? 'CAR' : asset.category;
                      const title = isCar ? `${asset.make} ${asset.model}` : asset.title;
                      const hostName = asset.ownerId ? `${asset.ownerId.firstName || ''}` : 'Unknown';

                      return (
                        <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900 text-sm flex items-center space-x-2 whitespace-nowrap">
                            {isCar ? <Car className="w-4 h-4 text-gray-400 shrink-0"/> : <Home className="w-4 h-4 text-gray-400 shrink-0"/>}
                            <span className="truncate max-w-[250px]">{title}</span>
                          </td>
                          <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{typeStr}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{hostName}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button 
                              onClick={() => handleToggleAsset(typeStr, asset._id, 'isVerified', asset.isVerified)}
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${asset.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                            >
                              {asset.isVerified ? 'Verified' : 'Unverified'}
                            </button>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button 
                              onClick={() => handleToggleAsset(typeStr, asset._id, 'isAvailable', asset.isAvailable)}
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${asset.isAvailable ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                            >
                              {asset.isAvailable ? 'Live' : 'Hidden'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 4: ESCROW LEDGER --- */}
        {activeTab === 'escrow' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Guest</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount (NGN)</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Escrow Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                  ) : ledger.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No escrow records found.</td></tr>
                  ) : (
                    ledger.map((record) => {
                      const isCar = !!record.carId;
                      const assetTitle = isCar ? `${record.carId?.make} ${record.carId?.model}` : record.propertyId?.title;
                      const guestName = record.userId ? `${record.userId.firstName || ''} ${record.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
                      const amount = (record.totalAmount || 0).toLocaleString();
                      const eStatus = record.escrowStatus || record.payoutStatus || 'PROCESSING';
                      
                      let statusColor = 'bg-gray-100 text-gray-600';
                      if (eStatus === 'HELD' || eStatus === 'HELD_IN_ESCROW') statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';
                      if (eStatus === 'RELEASED' || eStatus === 'RELEASED_TO_LANDLORD') statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';

                      return (
                        <tr key={record._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-sm font-bold text-gray-900 whitespace-nowrap">{guestName}</td>
                          <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
                          <td className="p-4 text-sm font-extrabold text-gray-900 whitespace-nowrap">₦{amount}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                              {eStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </main>

      {/* --- APPLICATION REVIEW MODAL --- */}
      {selectedApp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Application Review</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">ID: {selectedApp._id}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 md:space-y-8">
              
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 md:mb-4">Applicant Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</span>
                    <span className="text-sm font-bold text-gray-900">
                      {selectedApp.user ? `${selectedApp.user.firstName || ''} ${selectedApp.user.lastName || ''}` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">NIN / ID Number</span>
                    <span className="text-sm font-bold text-gray-900">{selectedApp.nin || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 md:mb-4">Contact & Location</h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center space-x-3 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedApp.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedApp.user?.phoneNumber || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm">
                    <Building className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedApp.address}, {selectedApp.city}, {selectedApp.state}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={() => handleReject(selectedApp._id)}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-3.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Reject</>}
              </button>
              <button 
                onClick={() => handleApprove(selectedApp._id)}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve Host</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}