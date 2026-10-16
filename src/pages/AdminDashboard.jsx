import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building, Wallet, 
  Settings, CheckCircle2, XCircle, Eye, Loader2, 
  X, ShieldCheck, Mail, Phone, Clock,
  Home, Car, Menu, ListChecks, PlayCircle
} from 'lucide-react';
import { 
  getHostApplications, approveHostApplication, rejectHostApplication,
  getDashboardStats, getEscrowLedger, getAssetOversight, toggleAssetStatus,
  updateAssetApprovalStatus // 💡 NEW: Imported the approval function we made yesterday
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

  // 💡 NEW STATE: For Property Reviews and Media Viewing
  const [selectedListing, setSelectedListing] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null); // stores { url: string, type: 'image' | 'video' }

  // --- ROUTER EFFECT ---
  useEffect(() => {
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'escrow') fetchLedger();
    if (activeTab === 'assets' || activeTab === 'pending-assets') fetchAssets();
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

  // 💡 NEW ACTION: Approve or Reject Property Listings
  const handleListingApproval = async (type, id, status) => {
    setActionLoading(true);
    try {
      await updateAssetApprovalStatus(type, id, status);
      // Immediately update local state so it disappears from the pending list
      setAssets(prev => ({
        ...prev,
        properties: prev.properties.map(p => p._id === id ? { ...p, status } : p),
        cars: prev.cars.map(c => c._id === id ? { ...c, status } : c)
      }));
      setSelectedListing(null); // Close the modal
    } catch (error) {
      console.error("Failed to update listing status", error);
    } finally {
      setActionLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Host Applications', icon: Users },
    { id: 'pending-assets', label: 'Pending Listings', icon: ListChecks }, // 💡 NEW TAB
    { id: 'assets', label: 'Asset Oversight', icon: Building },
    { id: 'escrow', label: 'Escrow Ledger', icon: Wallet },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  // Derive pending listings
  const pendingListings = [
    ...assets.properties.filter(p => p.status === 'PENDING'),
    ...assets.cars.filter(c => c.status === 'PENDING')
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
            
            // Dynamic Badges
            let badgeCount = 0;
            if (item.id === 'applications') badgeCount = applications.length;
            if (item.id === 'pending-assets') badgeCount = pendingListings.length;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); 
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-gray-900'}`}>
                    {badgeCount}
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
                        <div className="text-sm font-extrabold text-amber-500">{stats.users.pendingHosts}</div>
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
                  {/* Show pending assets count if it exists in stats */}
                  {stats.assets.pendingAssets > 0 && (
                     <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                       <span className="text-xs font-bold text-amber-500">{stats.assets.pendingAssets} Assets Pending Review</span>
                     </div>
                  )}
                </div>

                {/* Financial Ledger Card */}
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

        {/* --- 💡 NEW TAB 3: PENDING LISTINGS (APPROVAL WORKFLOW) --- */}
        {activeTab === 'pending-assets' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date Submitted</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Title</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Host</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                  ) : pendingListings.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No pending asset listings to review.</td></tr>
                  ) : (
                    pendingListings.map((asset) => {
                      const isCar = !!asset.make;
                      const title = isCar ? `${asset.make} ${asset.carModel}` : asset.title;
                      const hostName = asset.ownerId ? `${asset.ownerId.firstName || ''} ${asset.ownerId.lastName || ''}`.trim() : 'Unknown';

                      return (
                        <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{new Date(asset.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-gray-900 text-sm flex items-center space-x-2 whitespace-nowrap">
                            {isCar ? <Car className="w-4 h-4 text-gray-400 shrink-0"/> : <Home className="w-4 h-4 text-gray-400 shrink-0"/>}
                            <span className="truncate max-w-[250px]">{title}</span>
                          </td>
                          <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{isCar ? 'CAR' : asset.category}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{hostName}</td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedListing(asset)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-gray-900 hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /><span>Review Quality</span>
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

        {/* --- TAB 4: ASSET OVERSIGHT (ALL LISTINGS) --- */}
        {activeTab === 'assets' && (
           <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
             <div className="min-w-[800px]">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
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
                       
                       let statusColor = 'bg-gray-100 text-gray-600';
                       if (asset.status === 'APPROVED') statusColor = 'bg-emerald-50 text-emerald-600';
                       if (asset.status === 'PENDING') statusColor = 'bg-amber-50 text-amber-600';
                       if (asset.status === 'REJECTED') statusColor = 'bg-red-50 text-red-600';
 
                       return (
                         <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                           <td className="p-4 font-bold text-gray-900 text-sm flex items-center space-x-2 whitespace-nowrap">
                             {isCar ? <Car className="w-4 h-4 text-gray-400 shrink-0"/> : <Home className="w-4 h-4 text-gray-400 shrink-0"/>}
                             <span className="truncate max-w-[250px]">{title}</span>
                           </td>
                           <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{typeStr}</td>
                           <td className="p-4 whitespace-nowrap">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                               {asset.status || 'APPROVED'} {/* Fallback for older listings */}
                             </span>
                           </td>
                           <td className="p-4 text-center whitespace-nowrap">
                             <button 
                               onClick={() => handleToggleAsset(isCar ? 'CAR' : 'PROPERTY', asset._id, 'isVerified', asset.isVerified)}
                               className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${asset.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                             >
                               {asset.isVerified ? 'Verified' : 'Unverified'}
                             </button>
                           </td>
                           <td className="p-4 text-center whitespace-nowrap">
                             <button 
                               onClick={() => handleToggleAsset(isCar ? 'CAR' : 'PROPERTY', asset._id, 'isAvailable', asset.isAvailable)}
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

        {/* --- TAB 5: ESCROW LEDGER --- */}
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

      {/* --- APPLICATION REVIEW MODAL (HOSTS) --- */}
      {selectedApp && (
        <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

      {/* --- 💡 NEW: LISTING REVIEW MODAL (ASSETS) --- */}
      {selectedListing && (
        <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Review Listing Quality</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">
                  {selectedListing.make ? `${selectedListing.make} ${selectedListing.model}` : selectedListing.title} • {selectedListing.make ? 'CAR' : selectedListing.category}
                </p>
              </div>
              <button onClick={() => setSelectedListing(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</h3>
                 <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
                 <div className="mt-4 flex space-x-4">
                   <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                     Price: ₦{selectedListing.pricePerNight || selectedListing.pricePer12Hours || 0}
                   </span>
                 </div>
              </div>

              {/* Media Gallery Grid */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Media Inspection (Click to enlarge)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  
                  {/* Video Thumbnail (If exists) */}
                  {selectedListing.video && (
                    <div 
                      onClick={() => setMediaViewer({ url: selectedListing.video, type: 'video' })}
                      className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-pointer group flex items-center justify-center border border-gray-200 shadow-sm"
                    >
                      <video src={selectedListing.video} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                      <PlayCircle className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform" />
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-bold">VIDEO</div>
                    </div>
                  )}

                  {/* Image Thumbnails */}
                  {selectedListing.images?.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setMediaViewer({ url: img, type: 'image' })}
                      className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 shadow-sm relative"
                    >
                      <img src={img} alt={`Listing ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={() => handleListingApproval(selectedListing.make ? 'CAR' : 'PROPERTY', selectedListing._id, 'REJECTED')}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-3.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Reject Quality</>}
              </button>
              <button 
                onClick={() => handleListingApproval(selectedListing.make ? 'CAR' : 'PROPERTY', selectedListing._id, 'APPROVED')}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve to Live Feed</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 💡 NEW: FULL SCREEN MEDIA VIEWER --- */}
      {mediaViewer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in zoom-in duration-200">
          <button 
            onClick={() => setMediaViewer(null)} 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
            {mediaViewer.type === 'image' ? (
              <img src={mediaViewer.url} alt="Enlarged inspection" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            ) : (
              <video src={mediaViewer.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}

    </div>
  );
}