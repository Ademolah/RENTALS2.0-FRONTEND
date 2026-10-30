import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building, Wallet, 
  Settings, CheckCircle2, XCircle, Eye, Loader2, 
  X, ShieldCheck, Mail, Phone, Clock,
  Home, Car, Menu, ListChecks, PlayCircle,
  MessageSquare, Link as LinkIcon, Copy // 💡 NEW
} from 'lucide-react';
import { 
  getHostApplications, approveHostApplication, rejectHostApplication,
  getDashboardStats, getEscrowLedger, getAssetOversight, toggleAssetStatus,
  updateAssetApprovalStatus,
  getPendingConciergeDrafts, generateConciergeCheckoutUrl // 💡 NEW
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
  const [notice, setNotice] = useState(null);
  const notify = (message, type = 'error') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
  };
  const errMsg = (error, fallback) => error?.response?.data?.message || fallback;
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Property Reviews and Media Viewing
  const [selectedListing, setSelectedListing] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null);

  // 💡 NEW: Concierge State
  const [conciergeDrafts, setConciergeDrafts] = useState([]);
  const [draftPrices, setDraftPrices] = useState({});
  const [generatedLinks, setGeneratedLinks] = useState({});
  const [linkLoading, setLinkLoading] = useState({});

  // 💡 NEW: Add the fetch trigger to your useEffect
  useEffect(() => {
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'escrow') fetchLedger();
    if (activeTab === 'assets' || activeTab === 'pending-assets') fetchAssets();
    if (activeTab === 'concierge') fetchConciergeDrafts(); // <-- ADD THIS
  }, [activeTab]);

  // 💡 NEW: The Fetcher Function
  const fetchConciergeDrafts = async () => {
    setLoading(true);
    try {
      const res = await getPendingConciergeDrafts();
      // 💡 SURGICAL FIX: Checks multiple levels to prevent the nested 'data.data' Axios bug
      const fetchedDrafts = res.data?.data?.drafts || res.data?.drafts || res?.drafts || [];
      setConciergeDrafts(fetchedDrafts);
    } catch (error) {
      notify(errMsg(error, "Could not load the concierge queue."));
    } finally {
      setLoading(false);
    }
  };

  // 💡 NEW: The Link Generator Action
  const handleGenerateLink = async (referenceCode, draftId) => {
    const finalAmount = draftPrices[draftId];
    if (!finalAmount || finalAmount <= 0) {
      notify('Please enter a valid negotiated price.');
      return;
    }

    setLinkLoading(prev => ({ ...prev, [draftId]: true }));
    try {
      const res = await generateConciergeCheckoutUrl({ referenceCode, finalAmount });
      
      // 💡 SURGICAL FIX: Dig into the nested Axios data object
      const checkoutUrl = res.data?.data?.checkoutUrl || res.data?.checkoutUrl || res?.checkoutUrl;
      
      if (checkoutUrl) {
        setGeneratedLinks(prev => ({ ...prev, [draftId]: checkoutUrl }));
      } else {
        notify("The payment link could not be created. Please try again.");
      }
    } catch (error) {
      console.error(error);
      notify(errMsg(error, 'Failed to generate link.'));
    } finally {
      setLinkLoading(prev => ({ ...prev, [draftId]: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    notify('Payment link copied. Paste it to the guest on WhatsApp.', 'success');
  };

  // --- FETCHERS ---
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getHostApplications();
      setApplications(res.data?.requests || res.data?.applications || res.data || []);
    } catch (error) {
      notify(errMsg(error, "Could not load host applications."));
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
      notify(errMsg(error, "Could not load platform stats."));
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
      notify(errMsg(error, "Could not load the escrow ledger."));
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
      notify(errMsg(error, "Could not load assets."));
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
      notify(errMsg(error, "Approval failed. Please try again."));
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
      notify(errMsg(error, "Rejection failed. Please try again."));
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
      notify(errMsg(error, "Could not update the asset."));
    }
  };

  const handleListingApproval = async (type, id, status) => {
    setActionLoading(true);
    try {
      await updateAssetApprovalStatus(type, id, status);
      setAssets(prev => ({
        ...prev,
        properties: prev.properties.map(p => p._id === id ? { ...p, status } : p),
        cars: prev.cars.map(c => c._id === id ? { ...c, status } : c)
      }));
      setSelectedListing(null); 
    } catch (error) {
      notify(errMsg(error, "Could not update the listing status."));
    } finally {
      setActionLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'concierge', label: 'Concierge Queue', icon: MessageSquare },
    { id: 'applications', label: 'Host Applications', icon: Users },
    { id: 'pending-assets', label: 'Pending Listings', icon: ListChecks },
    { id: 'assets', label: 'Asset Oversight', icon: Building },
    { id: 'escrow', label: 'Escrow Ledger', icon: Wallet },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const pendingListings = [
    ...assets.properties.filter(p => p.status === 'PENDING'),
    ...assets.cars.filter(c => c.status === 'PENDING')
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-brand-dark" />
          <span className="text-base font-display font-bold tracking-wider uppercase text-brand-dark">Rentals Admin</span>
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
      <aside className={`w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-brand-dark" />
          <span className="text-base font-display font-bold tracking-wider uppercase text-brand-dark">Rentals Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            let badgeCount = 0;
            if (item.id === 'applications') badgeCount = applications.length;
            if (item.id === 'pending-assets') badgeCount = pendingListings.length;
            if (item.id === 'concierge') badgeCount = conciergeDrafts.length;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); 
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-dark text-white shadow-md' 
                    : 'text-brand-text-secondary hover:bg-gray-100 hover:text-brand-dark'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-text-muted'}`} />
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-dark'}`}>
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
            <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-dark tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-base text-brand-text-secondary mt-1">Manage and oversee platform operations.</p>
          </div>
        </header>

        {notice && (
          <div role="alert" className={`mb-6 px-5 py-4 rounded-xl text-base font-semibold border ${notice.type === 'success' ? 'bg-status-available-soft text-status-available border-status-available/20' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {notice.message}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-8 max-w-2xl">
            <h2 className="text-xl font-display font-bold text-brand-dark mb-4">Platform rules</h2>
            <ul className="space-y-3 text-base text-brand-text-secondary">
              <li>Guests pay the listed price. The 5% commission is taken from the host payout (host receives 95%).</li>
              <li>Chauffeur service: N25,000 per 12 hours.</li>
              <li>Hosts and guests never see each other's personal details.</li>
              <li>Payouts are released after both sides confirm arrival.</li>
            </ul>
            <p className="mt-6 text-sm text-brand-text-muted">These rules are set on the server and shown here for reference.</p>
          </div>
        )}

        {/* --- TAB 1: OVERVIEW STATS --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-text-muted" /></div>
            ) : stats ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Network Card */}
                <div className="bg-white p-7 border border-gray-100 rounded-2xl shadow-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-display font-bold text-brand-text-muted uppercase tracking-widest">Network</h3>
                    <Users className="w-4 h-4 text-brand-text-muted" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-4xl font-display font-bold text-brand-dark tracking-tight">{stats.users.totalUsers}</div>
                      <div className="text-sm font-bold text-brand-text-muted mt-1">Total Registered Users</div>
                    </div>
                    <div className="pt-5 border-t border-gray-100 flex justify-between">
                      <div>
                        <div className="text-xl font-display font-bold text-brand-dark">{stats.users.totalHosts}</div>
                        <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Verified Hosts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-display font-bold text-amber-500">{stats.users.pendingHosts}</div>
                        <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Pending Apps</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Card */}
                <div className="bg-white p-7 border border-gray-100 rounded-2xl shadow-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-display font-bold text-brand-text-muted uppercase tracking-widest">Live Inventory</h3>
                    <Building className="w-4 h-4 text-brand-text-muted" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <div className="text-2xl font-display font-bold text-brand-dark">{stats.assets.totalShortlets}</div>
                      <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Shortlets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-brand-dark">{stats.assets.totalHotels}</div>
                      <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Hotels</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-brand-dark">{stats.assets.totalVip}</div>
                      <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">VIP Venues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-display font-bold text-brand-dark">{stats.assets.totalCars}</div>
                      <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Vehicles</div>
                    </div>
                  </div>
                  {stats.assets.pendingAssets > 0 && (
                     <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                       <span className="text-xs font-bold text-amber-500">{stats.assets.pendingAssets} Assets Pending Review</span>
                     </div>
                  )}
                </div>

                {/* Financial Ledger Card */}
                <div className="bg-brand-dark p-6 border border-gray-800 rounded-xl shadow-lg text-white">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-display font-bold text-brand-text-muted uppercase tracking-widest">Financial Ledger</h3>
                    <Wallet className="w-4 h-4 text-brand-text-muted" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-display font-bold tracking-tight">
                        ₦{(stats.financials.totalPlatformVolume / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm font-bold text-brand-text-muted mt-1">Total Transaction Volume</div>
                    </div>
                    <div className="pt-5 border-t border-gray-800 flex justify-between">
                      <div>
                        <div className="text-xl font-display font-bold text-emerald-400">₦{stats.financials.totalPlatformRevenue.toLocaleString()}</div>
                        <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Platform Cut (5%)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-display font-bold text-amber-400">₦{stats.financials.escrowCurrentlyHeld.toLocaleString()}</div>
                        <div className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mt-1">Escrow Held</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-brand-text-secondary font-bold">No stats available.</div>
            )}
          </div>
        )}

        {/* --- TAB 6: CONCIERGE QUEUE (WHATSAPP DRAFTS) --- */}
        {activeTab === 'concierge' && (
           <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
             <div className="min-w-[900px]">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Reference</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Guest</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Asset Requested</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted text-center">Negotiated Price (₦)</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted text-right">Generate Link</th>
                   </tr>
                 </thead>
                 <tbody>
                   {loading ? (
                     <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-text-muted" /></td></tr>
                   ) : conciergeDrafts.length === 0 ? (
                     <tr><td colSpan="5" className="p-8 text-center text-brand-text-secondary">No pending WhatsApp reservations.</td></tr>
                   ) : (
                     conciergeDrafts.map((draft) => {
                       const isCar = !!draft.carId;
                       const assetTitle = isCar ? `${draft.carId?.make} ${draft.carId?.model}` : draft.propertyId?.title;
                       const guestName = draft.userId ? `${draft.userId.firstName || ''} ${draft.userId.lastName || ''}`.trim() : 'Unknown';
                       const refCode = draft.paystackReference; // Temporary holding the WA-XXXXXX code
                       const link = generatedLinks[draft._id];

                       return (
                         <tr key={draft._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                           <td className="p-4 whitespace-nowrap">
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText(refCode);
                                 notify(`Reference ${refCode} copied.`, 'success');
                               }}
                               className="group flex items-center space-x-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-dark border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                               title="Copy Reference Code"
                             >
                               <span className="text-xs font-display font-bold tracking-widest">{refCode}</span>
                               <Copy className="w-3.5 h-3.5 text-brand-text-secondary group-hover:text-brand-dark transition-colors" />
                             </button>
                           </td>
                           <td className="p-4 text-sm font-bold text-brand-dark whitespace-nowrap">{guestName}</td>
                           <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
                           
                           <td className="p-4 text-center">
                             <input 
                               type="number"
                               placeholder="e.g. 450000"
                               disabled={!!link} // Lock input if link is already generated
                               value={draftPrices[draft._id] || ''}
                               onChange={(e) => setDraftPrices(prev => ({ ...prev, [draft._id]: e.target.value }))}
                               className="w-32 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-center disabled:bg-gray-100 disabled:text-brand-text-muted"
                             />
                           </td>
                           
                           <td className="p-4 text-right whitespace-nowrap">
                             {link ? (
                               <div className="flex items-center justify-end space-x-2 animate-in fade-in zoom-in duration-300">
                                 <input 
                                   type="text" 
                                   readOnly 
                                   value={link} 
                                   className="w-32 px-2 py-1.5 text-xs text-brand-text-secondary bg-gray-50 border border-gray-200 rounded outline-none truncate"
                                 />
                                 <button 
                                   onClick={() => copyToClipboard(link)}
                                   className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors"
                                 >
                                   <Copy className="w-3.5 h-3.5" /><span>Copy</span>
                                 </button>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => handleGenerateLink(refCode, draft._id)}
                                 disabled={linkLoading[draft._id]}
                                 className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-brand-dark hover:bg-brand-accent transition-colors px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
                               >
                                 {linkLoading[draft._id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                 <span>Generate</span>
                               </button>
                             )}
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

        {/* --- TAB 2: HOST APPLICATIONS --- */}
        {activeTab === 'applications' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Applicant Name</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">NIN / ID</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Location</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Status</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-brand-text-muted"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /></td></tr>
                  ) : applications.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-brand-text-muted font-medium">No pending host applications.</td></tr>
                  ) : (
                    applications.map((app) => {
                      const name = app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : (app.firstName || 'Unknown');
                      
                      // Dynamic Icon and Status Color Logic for Applications
                      const currentStatus = app.status || 'PENDING'; 
                      let statusColor = 'bg-gray-100 text-gray-600 border border-gray-200';
                      let StatusIcon = CheckCircle2; 

                      if (currentStatus === 'APPROVED') {
                        statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                        StatusIcon = CheckCircle2;
                      } else if (currentStatus === 'PENDING') {
                        statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';
                        StatusIcon = Clock;
                      } else if (currentStatus === 'REJECTED') {
                        statusColor = 'bg-red-50 text-red-600 border border-red-200';
                        StatusIcon = XCircle;
                      }

                      return (
                        <tr key={app._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-brand-dark whitespace-nowrap">{name}</td>
                          <td className="p-4 text-sm text-brand-text-secondary whitespace-nowrap">{app.nin || 'N/A'}</td>
                          <td className="p-4 text-sm text-brand-text-secondary whitespace-nowrap">{app.city}, {app.state}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{currentStatus}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedApp(app)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
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

        {/* --- TAB 3: PENDING LISTINGS (APPROVAL WORKFLOW) --- */}
        {activeTab === 'pending-assets' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Date Submitted</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Asset Title</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Category</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Host</th>
                    <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-text-muted" /></td></tr>
                  ) : pendingListings.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-brand-text-muted font-medium">No pending asset listings to review.</td></tr>
                  ) : (
                    pendingListings.map((asset) => {
                      const isCar = !!asset.make;
                      const title = isCar ? `${asset.make} ${asset.carModel}` : asset.title;
                      const hostName = asset.ownerId ? `${asset.ownerId.firstName || ''} ${asset.ownerId.lastName || ''}`.trim() : 'Unknown';

                      return (
                        <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{new Date(asset.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-brand-dark text-sm flex items-center space-x-2 whitespace-nowrap">
                            {isCar ? <Car className="w-4 h-4 text-brand-text-muted shrink-0"/> : <Home className="w-4 h-4 text-brand-text-muted shrink-0"/>}
                            <span className="truncate max-w-[250px]">{title}</span>
                          </td>
                          <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{isCar ? 'CAR' : asset.category}</td>
                          <td className="p-4 text-sm text-brand-text-secondary whitespace-nowrap">{hostName}</td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedListing(asset)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
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
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Asset</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Category</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Status</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted text-center">Verified Badge</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted text-center">Visibility</th>
                   </tr>
                 </thead>
                 <tbody>
                   {loading ? (
                     <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-text-muted" /></td></tr>
                   ) : (
                     [...assets.properties, ...assets.cars].map((asset) => {
                       const isCar = !!asset.make;
                       const typeStr = isCar ? 'CAR' : asset.category;
                       
                       // Safely pick carModel if it exists to match pending-assets list
                       const title = isCar ? `${asset.make} ${asset.carModel || asset.model}` : asset.title;
                       
                       // Dynamic Icon and Status Color Logic for Assets
                       const currentStatus = asset.status || 'APPROVED'; 
                       let statusColor = 'bg-gray-100 text-gray-600 border border-gray-200';
                       let StatusIcon = CheckCircle2; 

                       if (currentStatus === 'APPROVED') {
                         statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                         StatusIcon = CheckCircle2;
                       } else if (currentStatus === 'PENDING') {
                         statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';
                         StatusIcon = Clock;
                       } else if (currentStatus === 'REJECTED') {
                         statusColor = 'bg-red-50 text-red-600 border border-red-200';
                         StatusIcon = XCircle;
                       }

                       return (
                         <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                           <td className="p-4 font-bold text-brand-dark text-sm flex items-center space-x-2 whitespace-nowrap">
                             {isCar ? <Car className="w-4 h-4 text-brand-text-muted shrink-0"/> : <Home className="w-4 h-4 text-brand-text-muted shrink-0"/>}
                             <span className="truncate max-w-[250px]">{title}</span>
                           </td>
                           <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{typeStr}</td>
                           <td className="p-4 whitespace-nowrap">
                             <span className={`inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                               <StatusIcon className="w-3.5 h-3.5" />
                               <span>{currentStatus}</span>
                             </span>
                           </td>
                           <td className="p-4 text-center whitespace-nowrap">
                             <button 
                               onClick={() => handleToggleAsset(isCar ? 'CAR' : 'PROPERTY', asset._id, 'isVerified', asset.isVerified)}
                               className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${asset.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-brand-text-secondary border-gray-200'}`}
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
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Date</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Guest</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Asset</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Amount (NGN)</th>
                     <th className="p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted">Escrow Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {loading ? (
                     <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-text-muted" /></td></tr>
                   ) : ledger.length === 0 ? (
                     <tr><td colSpan="5" className="p-8 text-center text-brand-text-secondary">No escrow records found.</td></tr>
                   ) : (
                     ledger.map((record) => {
                       const isCar = !!record.carId;
                       const assetTitle = isCar ? `${record.carId?.make} ${record.carId?.model}` : record.propertyId?.title;
                       const guestName = record.userId ? `${record.userId.firstName || ''} ${record.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
                       const amount = (record.totalAmount || 0).toLocaleString();
                       const eStatus = record.escrowStatus || record.payoutStatus || 'PROCESSING';
                       
                       // Dynamic Icon and Status Color Logic for Escrow Ledger
                       let statusColor = 'bg-gray-100 text-gray-600 border border-gray-200';
                       let StatusIcon = Clock; 

                       if (eStatus === 'HELD' || eStatus === 'HELD_IN_ESCROW') {
                         statusColor = 'bg-amber-50 text-amber-600 border border-amber-200';
                         StatusIcon = Clock;
                       } else if (eStatus === 'RELEASED' || eStatus === 'RELEASED_TO_LANDLORD') {
                         statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                         StatusIcon = CheckCircle2;
                       }
 
                       return (
                         <tr key={record._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                           <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString()}</td>
                           <td className="p-4 text-sm font-bold text-brand-dark whitespace-nowrap">{guestName}</td>
                           <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
                           <td className="p-4 text-xl font-display font-bold text-brand-dark whitespace-nowrap">₦{amount}</td>
                           <td className="p-4 whitespace-nowrap">
                             <span className={`inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                               <StatusIcon className="w-3.5 h-3.5" />
                               <span>{eStatus.replace(/_/g, ' ')}</span>
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
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-elevated overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg md:text-xl font-display font-bold text-brand-dark">Application Review</h2>
                <p className="text-xs md:text-xs text-brand-text-secondary font-medium mt-1">ID: {selectedApp._id}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full text-brand-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 md:space-y-8">
              <div>
                <h3 className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted mb-3 md:mb-4">Applicant Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1">Full Name</span>
                    <span className="text-sm font-bold text-brand-dark">
                      {selectedApp.user ? `${selectedApp.user.firstName || ''} ${selectedApp.user.lastName || ''}` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1">NIN / ID Number</span>
                    <span className="text-sm font-bold text-brand-dark">{selectedApp.nin || 'Not Provided'}</span>
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
                className="w-full sm:flex-1 py-3.5 bg-brand-dark hover:bg-brand-accent text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve Host</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LISTING REVIEW MODAL (ASSETS) --- */}
      {selectedListing && (
        <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-elevated overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg md:text-xl font-display font-bold text-brand-dark">Review Listing Quality</h2>
                <p className="text-xs md:text-xs text-brand-text-secondary font-medium mt-1">
                  {selectedListing.make ? `${selectedListing.make} ${selectedListing.model}` : selectedListing.title} • {selectedListing.make ? 'CAR' : selectedListing.category}
                </p>
              </div>
              <button onClick={() => setSelectedListing(null)} className="p-2 hover:bg-gray-200 rounded-full text-brand-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <h3 className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted mb-2">Description</h3>
                 <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
                 <div className="mt-4 flex space-x-4">
                   <span className="text-xs font-bold text-brand-dark bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                     Price: ₦{selectedListing.pricePerNight || selectedListing.pricePer12Hours || 0}
                   </span>
                 </div>
              </div>

              {/* Media Gallery Grid */}
              <div>
                <h3 className="text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted mb-3">Media Inspection (Click to enlarge)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  
                  {/* Video Thumbnail (If exists) */}
                  {selectedListing.video && (
                    <div 
                      onClick={() => setMediaViewer({ url: selectedListing.video, type: 'video' })}
                      className="relative aspect-square bg-brand-dark rounded-xl overflow-hidden cursor-pointer group flex items-center justify-center border border-gray-200 shadow-sm"
                    >
                      <video src={selectedListing.video} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                      <PlayCircle className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform" />
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white font-bold">VIDEO</div>
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
                className="w-full sm:flex-1 py-3.5 bg-brand-dark hover:bg-brand-accent text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve to Live Feed</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL SCREEN MEDIA VIEWER --- */}
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
              <img src={mediaViewer.url} alt="Enlarged inspection" className="max-w-full max-h-full object-contain rounded-lg shadow-elevated" />
            ) : (
              <video src={mediaViewer.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-elevated" />
            )}
          </div>
        </div>
      )}

    </div>
  );
}