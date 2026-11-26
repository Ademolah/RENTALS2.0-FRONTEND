import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building, Wallet, 
  Settings, CheckCircle2, XCircle, Eye, Loader2, 
  X, ShieldCheck, Mail, Phone, Clock,
  Home, Car, Menu, ListChecks, PlayCircle,
  MessageSquare, Link as LinkIcon, Copy, Search, Landmark, Headphones,
  ChevronLeft, ChevronRight, UserCog
} from 'lucide-react';
import { 
  getHostApplications, approveHostApplication, rejectHostApplication,
  getDashboardStats, getEscrowLedger, getAssetOversight, toggleAssetStatus,
  updateAssetApprovalStatus,
  getPendingConciergeDrafts, generateConciergeCheckoutUrl, getAllUsers, getUserDetails,
  updateUserRole
} from '../api/admin';
import { getSupportTicketsApi } from '../api/support';
import AdminSupportConsole from '../components/AdminSupportConsole';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || '').toUpperCase();
  const isSupportOnly = normalizedRole === 'SUPPORT_AGENT';
  const isSuperAdmin = normalizedRole === 'ADMIN';

  const [activeTab, setActiveTab] = useState(() =>
    String(user?.role || '').toUpperCase() === 'SUPPORT_AGENT' ? 'support' : 'applications'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- STATE ---
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ properties: [], cars: [] });
  
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Property Reviews and Media Viewing
  const [selectedListing, setSelectedListing] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null);

  // Concierge State
  const [conciergeDrafts, setConciergeDrafts] = useState([]);
  const [draftPrices, setDraftPrices] = useState({});
  const [generatedLinks, setGeneratedLinks] = useState({});
  const [linkLoading, setLinkLoading] = useState({});

  // User Directory & Regulatory Dossier State
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [selectedUserDossier, setSelectedUserDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Live Support Desk unread/open badge count
  const [supportAttentionCount, setSupportAttentionCount] = useState(0);

  // Enforce Support-only tab lock if user is a SUPPORT_AGENT
  useEffect(() => {
    if (isSupportOnly && activeTab !== 'support') {
      setActiveTab('support');
    }
  }, [isSupportOnly, activeTab]);

  useEffect(() => {
    getSupportTicketsApi({ limit: 50 })
      .then((res) => {
        const list = res?.data?.tickets || res?.data?.items || res?.tickets || [];
        const count = list.filter(
          (t) => Number(t.unreadByStaff || 0) > 0 || t.status === 'OPEN'
        ).length;
        setSupportAttentionCount(count);
      })
      .catch(() => {});
  }, []);

  // Debounced fetch when on the 'users' tab (Super Admin only)
  useEffect(() => {
    if (!isSuperAdmin || activeTab !== 'users') return;
    const timer = setTimeout(() => {
      fetchUsers(1, userEmailSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, userEmailSearch, isSuperAdmin]);

  const fetchUsers = async (page = 1, search = userEmailSearch) => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const res = await getAllUsers({ page, limit: 20, search: search.trim() });
      setUsersList(res?.data?.users || []);
      if (res?.pagination) {
        setUsersPagination(res.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectUser = async (userSummary) => {
    if (!isSuperAdmin) return;
    setSelectedUserDossier({ user: userSummary });
    setDossierLoading(true);
    try {
      const res = await getUserDetails(userSummary._id);
      if (res?.data) {
        setSelectedUserDossier(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch user dossier:', error);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleUpdateUserRole = async (targetUser, nextRole) => {
    if (!isSuperAdmin || !targetUser?._id || targetUser._id === user?._id) return;

    const fullName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email;
    const actionLabel =
      nextRole === 'SUPPORT_AGENT'
        ? `Promote ${fullName} to Support Agent? They will gain access to the Support Desk.`
        : `Revoke Support Agent access for ${fullName} and revert them to standard USER?`;

    if (!window.confirm(actionLabel)) return;

    setRoleUpdating(true);
    try {
      await updateUserRole(targetUser._id, nextRole);

      setUsersList((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: nextRole } : u))
      );

      setSelectedUserDossier((prev) =>
        prev ? { ...prev, user: { ...prev.user, role: nextRole } } : prev
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert(error.response?.data?.message || 'Failed to update user role.');
    } finally {
      setRoleUpdating(false);
    }
  };

  // Single unified tab router effect (Super Admin data tabs)
  useEffect(() => {
    if (!isSuperAdmin) return;
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'escrow') fetchLedger();
    if (activeTab === 'assets' || activeTab === 'pending-assets') fetchAssets();
    if (activeTab === 'concierge') fetchConciergeDrafts();
  }, [activeTab, isSuperAdmin]);

  const fetchConciergeDrafts = async () => {
    setLoading(true);
    try {
      const res = await getPendingConciergeDrafts();
      const fetchedDrafts = res.data?.data?.drafts || res.data?.drafts || res?.drafts || [];
      setConciergeDrafts(fetchedDrafts);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async (referenceCode, draftId) => {
    const finalAmount = draftPrices[draftId];
    if (!finalAmount || finalAmount <= 0) {
      alert('Please enter a valid negotiated price.');
      return;
    }

    setLinkLoading(prev => ({ ...prev, [draftId]: true }));
    try {
      const res = await generateConciergeCheckoutUrl({ referenceCode, finalAmount });
      const checkoutUrl = res.data?.data?.checkoutUrl || res.data?.checkoutUrl || res?.checkoutUrl;
      
      if (checkoutUrl) {
        setGeneratedLinks(prev => ({ ...prev, [draftId]: checkoutUrl }));
      } else {
        alert("Payment gateway did not return a valid link.");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to generate link.');
    } finally {
      setLinkLoading(prev => ({ ...prev, [draftId]: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Payment link copied! You can now paste this to the guest on WhatsApp.');
  };

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

  const handleListingApproval = async (type, id, status) => {
    try {
      let reason = undefined;

      if (status === 'REJECTED') {
        reason = window.prompt("Please provide a reason for rejecting this listing (this will be sent to the host):");
        if (reason === null) {
          return; 
        }
        if (reason.trim() === '') {
          reason = "Listing does not meet platform quality standards.";
        }
      }

      setActionLoading(true);
      await updateAssetApprovalStatus(type, id, status, reason);
      
      setAssets(prev => ({
        ...prev,
        properties: prev.properties.map(p => p._id === id ? { ...p, status } : p),
        cars: prev.cars.map(c => c._id === id ? { ...c, status } : c)
      }));
      setSelectedListing(null); 
    } catch (error) {
      console.error("Failed to update listing status", error);
    } finally {
      setActionLoading(false);
    }
  };

  const allNavItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'support', label: 'Support Desk', icon: Headphones },
    { id: 'concierge', label: 'Concierge Queue', icon: MessageSquare },
    { id: 'applications', label: 'Host Applications', icon: Users },
    { id: 'pending-assets', label: 'Pending Listings', icon: ListChecks },
    { id: 'assets', label: 'Asset Oversight', icon: Building },
    { id: 'escrow', label: 'Payout Ledger', icon: Wallet },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  // Scope sidebar strictly to Support Desk for SUPPORT_AGENT staff
  const navItems = isSupportOnly
    ? allNavItems.filter((item) => item.id === 'support')
    : allNavItems;

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
          <span className="text-sm font-black tracking-widest uppercase text-gray-900">
            {isSupportOnly ? 'Support Desk' : 'Rentals Admin'}
          </span>
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
          <span className="text-sm font-black tracking-widest uppercase text-gray-900">
            {isSupportOnly ? 'Support Desk' : 'Rentals Admin'}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            let badgeCount = 0;
            if (item.id === 'support') badgeCount = supportAttentionCount;
            if (item.id === 'applications') badgeCount = applications.length;
            if (item.id === 'pending-assets') badgeCount = pendingListings.length;
            if (item.id === 'concierge') badgeCount = conciergeDrafts.length;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isSupportOnly && item.id !== 'support') return;
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
              {isSupportOnly ? 'Support Desk' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">
              {isSupportOnly
                ? 'Respond to live guest and host support tickets.'
                : 'Manage and oversee platform operations.'}
            </p>
          </div>
        </header>

        {/* --- TAB: LIVE SUPPORT DESK (Accessible by ADMIN & SUPPORT_AGENT) --- */}
        {(activeTab === 'support' || isSupportOnly) && (
          <AdminSupportConsole
            onAttentionCountChange={setSupportAttentionCount}
            onInspectUser={isSuperAdmin ? handleInspectUser : undefined}
          />
        )}

        {/* --- SUPER ADMIN ONLY TABS --- */}
        {isSuperAdmin && activeTab === 'overview' && (
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
                        {(() => {
                          const vol = Number(stats.financials?.totalPlatformVolume || 0);
                          if (vol >= 1_000_000_000) return `₦${(vol / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B`;
                          if (vol >= 1_000_000) return `₦${(vol / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
                          return `₦${vol.toLocaleString()}`;
                        })()}
                      </div>
                      <div className="text-sm font-bold text-gray-400 mt-1">Total Transaction Volume</div>
                    </div>
                    <div className="pt-5 border-t border-gray-800 flex justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-emerald-400">₦{(stats.financials?.totalPlatformRevenue || 0).toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Platform Cut (5%)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-amber-400">₦{(stats.financials?.escrowCurrentlyHeld || 0).toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Funds Held</div>
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

        {/* --- TAB: USER DIRECTORY --- */}
        {isSuperAdmin && activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Search & Count Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  placeholder="Search user by email address..."
                  className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-900 outline-none transition-all"
                />
                {userEmailSearch && (
                  <button
                    type="button"
                    onClick={() => setUserEmailSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-gray-500">
                Showing <span className="text-gray-900">{usersList.length}</span> of{' '}
                <span className="text-gray-900">{usersPagination.total}</span> registered users
              </div>
            </div>

            {/* Mobile Card List (< md) */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : usersList.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500 font-medium">
                  No users found matching "{userEmailSearch}".
                </div>
              ) : (
                usersList.map((u) => {
                  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unnamed User';
                  const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';
                  const roleBadge =
                    u.role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : u.role === 'SUPPORT_AGENT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : u.role === 'LANDLORD'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';

                  return (
                    <div
                      key={u._id}
                      onClick={() => handleInspectUser(u)}
                      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {u.profilePicture ? (
                            <img src={u.profilePicture} alt={fullName} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border shrink-0 ${roleBadge}`}>
                          {u.role}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">{u.phoneNumber || 'No phone'}</span>
                        <span className="inline-flex items-center font-bold text-gray-900">
                          <Eye className="w-3.5 h-3.5 mr-1 text-gray-400" /> View Details
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Profile</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                  ) : usersList.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500 font-medium">No users found matching "{userEmailSearch}".</td></tr>
                  ) : (
                    usersList.map((u) => {
                      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unnamed User';
                      const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';
                      const roleBadge =
                        u.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : u.role === 'SUPPORT_AGENT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : u.role === 'LANDLORD'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200';

                      return (
                        <tr
                          key={u._id}
                          onClick={() => handleInspectUser(u)}
                          className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer"
                        >
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {u.profilePicture ? (
                                <img src={u.profilePicture} alt={fullName} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                  {initials}
                                </div>
                              )}
                              <span className="text-sm font-bold text-gray-900">{fullName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{u.email}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{u.phoneNumber || '—'}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border ${roleBadge}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {u.bankDetails?.accountNumber ? (
                              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                                {u.bankDetails.bankName}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Not Linked</span>
                            )}
                          </td>
                          <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInspectUser(u);
                              }}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-gray-900 hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /><span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {usersPagination.totalPages > 1 && (
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                <button
                  type="button"
                  disabled={usersPagination.page <= 1 || loading}
                  onClick={() => fetchUsers(usersPagination.page - 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-bold text-gray-600">
                  Page {usersPagination.page} of {usersPagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={usersPagination.page >= usersPagination.totalPages || loading}
                  onClick={() => fetchUsers(usersPagination.page + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: CONCIERGE QUEUE (WHATSAPP DRAFTS) --- */}
        {isSuperAdmin && activeTab === 'concierge' && (
           <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
             <div className="min-w-[900px]">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Reference</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Guest</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Requested</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Negotiated Price (₦)</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Generate Link</th>
                   </tr>
                 </thead>
                 <tbody>
                   {loading ? (
                     <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                   ) : conciergeDrafts.length === 0 ? (
                     <tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending WhatsApp reservations.</td></tr>
                   ) : (
                     conciergeDrafts.map((draft) => {
                       const isCar = !!draft.carId;
                       const assetTitle = isCar ? `${draft.carId?.make} ${draft.carId?.carModel}` : draft.propertyId?.title;
                       const guestName = draft.userId ? `${draft.userId.firstName || ''} ${draft.userId.lastName || ''}`.trim() : 'Unknown';
                       const refCode = draft.paystackReference;
                       const link = generatedLinks[draft._id];

                       return (
                         <tr key={draft._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                           <td className="p-4 whitespace-nowrap">
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText(refCode);
                                 alert(`Reference ${refCode} copied to clipboard!`);
                               }}
                               className="group flex items-center space-x-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                               title="Copy Reference Code"
                             >
                               <span className="text-xs font-black tracking-widest">{refCode}</span>
                               <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900 transition-colors" />
                             </button>
                           </td>
                           <td className="p-4 text-sm font-bold text-gray-900 whitespace-nowrap">{guestName}</td>
                           <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
                           
                           <td className="p-4 text-center">
                             <input 
                               type="number"
                               placeholder="e.g. 450000"
                               disabled={!!link}
                               value={draftPrices[draft._id] || ''}
                               onChange={(e) => setDraftPrices(prev => ({ ...prev, [draft._id]: e.target.value }))}
                               className="w-32 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-center disabled:bg-gray-100 disabled:text-gray-400"
                             />
                           </td>
                           
                           <td className="p-4 text-right whitespace-nowrap">
                             {link ? (
                               <div className="flex items-center justify-end space-x-2 animate-in fade-in zoom-in duration-300">
                                 <input 
                                   type="text" 
                                   readOnly 
                                   value={link} 
                                   className="w-32 px-2 py-1.5 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded outline-none truncate"
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
                                 className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-gray-900 hover:bg-black transition-colors px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
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

        {/* --- TAB: HOST APPLICATIONS --- */}
        {isSuperAdmin && activeTab === 'applications' && (
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
                          <td className="p-4 font-bold text-gray-900 whitespace-nowrap">{name}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{app.nin || 'N/A'}</td>
                          <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{app.city}, {app.state}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{currentStatus}</span>
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

        {/* --- TAB: PENDING LISTINGS (APPROVAL WORKFLOW) --- */}
        {isSuperAdmin && activeTab === 'pending-assets' && (
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

        {/* --- TAB: ASSET OVERSIGHT (ALL LISTINGS) --- */}
        {isSuperAdmin && activeTab === 'assets' && (
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
                       const title = isCar ? `${asset.make} ${asset.carModel || asset.model}` : asset.title;
                       
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
                           <td className="p-4 font-bold text-gray-900 text-sm flex items-center space-x-2 whitespace-nowrap">
                             {isCar ? <Car className="w-4 h-4 text-gray-400 shrink-0"/> : <Home className="w-4 h-4 text-gray-400 shrink-0"/>}
                             <span className="truncate max-w-[250px]">{title}</span>
                           </td>
                           <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{typeStr}</td>
                           <td className="p-4 whitespace-nowrap">
                             <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
                               <StatusIcon className="w-3.5 h-3.5" />
                               <span>{currentStatus}</span>
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

        {/* --- TAB: PAYOUT LEDGER --- */}
        {isSuperAdmin && activeTab === 'escrow' && (
           <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
             <div className="min-w-[800px]">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Guest</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount (NGN)</th>
                     <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Payout Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {loading ? (
                     <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                   ) : ledger.length === 0 ? (
                     <tr><td colSpan="5" className="p-8 text-center text-gray-500">No payout records found.</td></tr>
                   ) : (
                     ledger.map((record) => {
                       const isCar = !!record.carId;
                       const assetTitle = isCar ? `${record.carId?.make} ${record.carId?.model}` : record.propertyId?.title;
                       const guestName = record.userId ? `${record.userId.firstName || ''} ${record.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
                       const amount = (record.totalAmount || 0).toLocaleString();
                       const eStatus = record.escrowStatus || record.payoutStatus || 'PROCESSING';
                       
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
                           <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString()}</td>
                           <td className="p-4 text-sm font-bold text-gray-900 whitespace-nowrap">{guestName}</td>
                           <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
                           <td className="p-4 text-sm font-extrabold text-gray-900 whitespace-nowrap">₦{amount}</td>
                           <td className="p-4 whitespace-nowrap">
                             <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${statusColor}`}>
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

      {/* --- APPLICATION REVIEW MODAL (SUPER ADMIN ONLY) --- */}
      {isSuperAdmin && selectedApp && (
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

      {/* --- LISTING REVIEW MODAL (SUPER ADMIN ONLY) --- */}
      {isSuperAdmin && selectedListing && (
        <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Review Listing Quality</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">
                  {selectedListing.make ? `${selectedListing.make} ${selectedListing.carModel || selectedListing.model}` : selectedListing.title} • {selectedListing.make ? 'CAR' : selectedListing.category}
                </p>
              </div>
              <button onClick={() => setSelectedListing(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-5">
                 {selectedListing.description && (
                   <div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</h3>
                     <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedListing.description}</p>
                   </div>
                 )}

                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Primary Details</h3>
                   <div className="flex flex-wrap gap-2">
                     <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                       Price: ₦{(selectedListing.pricePerNight || selectedListing.pricePer12Hours || 0).toLocaleString()}
                     </span>
                     
                     {selectedListing.cautionFee > 0 && (
                       <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm">
                         Caution Fee: ₦{selectedListing.cautionFee.toLocaleString()}
                       </span>
                     )}

                     {(selectedListing.address || selectedListing.location) && (
                       <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                         Location: {selectedListing.address?.city || selectedListing.location?.city}, {selectedListing.address?.state || selectedListing.location?.state}
                       </span>
                     )}

                     {selectedListing.make && (
                       <>
                         <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                           Year: {selectedListing.year}
                         </span>
                         <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                           Transmission: {selectedListing.transmission}
                         </span>
                       </>
                     )}

                     {!selectedListing.make && (
                       <>
                         {selectedListing.bedrooms && (
                           <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                             {selectedListing.bedrooms} Bed{selectedListing.bedrooms > 1 ? 's' : ''}
                           </span>
                         )}
                         {selectedListing.bathrooms && (
                           <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                             {selectedListing.bathrooms} Bath{selectedListing.bathrooms > 1 ? 's' : ''}
                           </span>
                         )}
                         {selectedListing.maxGuests && (
                           <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                             Max Guests: {selectedListing.maxGuests}
                           </span>
                         )}
                       </>
                     )}
                   </div>
                 </div>

                 {(selectedListing.amenities?.length > 0 || selectedListing.features?.length > 0) && (
                   <div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                       {selectedListing.make ? 'Included Features' : 'Amenities'}
                     </h3>
                     <div className="flex flex-wrap gap-2">
                       {(selectedListing.amenities || selectedListing.features).map((item, idx) => (
                         <span key={idx} className="text-[11px] font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                           {item}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Media Inspection (Click to enlarge)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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

      {/* --- FULL USER DOSSIER MODAL (SUPER ADMIN ONLY) --- */}
      {isSuperAdmin && selectedUserDossier && (
        <div
          className="fixed inset-0 z-[990] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedUserDossier(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-5 md:p-6 border-b border-gray-100 bg-gray-50/70 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedUserDossier.user?.profilePicture ? (
                  <img
                    src={selectedUserDossier.user.profilePicture}
                    alt={selectedUserDossier.user.firstName}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-base font-black uppercase shrink-0">
                    {`${selectedUserDossier.user?.firstName?.[0] || ''}${selectedUserDossier.user?.lastName?.[0] || ''}` || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">
                      {`${selectedUserDossier.user?.firstName || ''} ${selectedUserDossier.user?.lastName || ''}`.trim() || 'User Dossier'}
                    </h2>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-900 text-white uppercase tracking-wider">
                      {selectedUserDossier.user?.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                    ID: {selectedUserDossier.user?._id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDossier(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 md:p-7 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {dossierLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Loading full compliance record...</span>
                </div>
              ) : (
                <>
                  {/* 1. Compliance & Financial Metrics */}
                  {selectedUserDossier.complianceSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Guest Spend</span>
                        <span className="text-base font-black text-gray-900 mt-1 block">
                          ₦{(selectedUserDossier.complianceSummary.totalSpentAsGuest || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Host Volume</span>
                        <span className="text-base font-black text-gray-900 mt-1 block">
                          ₦{(selectedUserDossier.complianceSummary.totalGrossAsHost || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Owned Assets</span>
                        <span className="text-base font-black text-gray-900 mt-1 block">
                          {selectedUserDossier.complianceSummary.totalOwnedAssets || 0}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400">Bookings</span>
                        <span className="text-base font-black text-gray-900 mt-1 block">
                          {(selectedUserDossier.complianceSummary.totalGuestBookings || 0) +
                            (selectedUserDossier.complianceSummary.totalHostBookings || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. Identity & Contact Information */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      Identity & Contact Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase">Email Address</span>
                          <span className="text-sm font-bold text-gray-900 break-all">{selectedUserDossier.user?.email}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase">Phone Number</span>
                          <span className="text-sm font-bold text-gray-900">
                            {selectedUserDossier.user?.phoneNumber || 'Not Provided'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Email Verification</span>
                        <span className={`text-xs font-extrabold mt-0.5 inline-block ${selectedUserDossier.user?.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {selectedUserDossier.user?.isVerified ? 'Verified Account' : 'Unverified'}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Registered Date</span>
                        <span className="text-sm font-bold text-gray-900">
                          {selectedUserDossier.user?.createdAt
                            ? new Date(selectedUserDossier.user.createdAt).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2B. Staff Role & Access Control (Super Admin Only) */}
                  {selectedUserDossier.user?._id !== user?._id &&
                    (selectedUserDossier.user?.role === 'USER' ||
                      selectedUserDossier.user?.role === 'SUPPORT_AGENT') && (
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                          Staff Role & Access Control
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <UserCog className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-sm font-bold text-gray-900 block">
                                {selectedUserDossier.user?.role === 'SUPPORT_AGENT'
                                  ? 'Active Support Agent'
                                  : 'Standard Guest Account'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {selectedUserDossier.user?.role === 'SUPPORT_AGENT'
                                  ? 'Can view and reply to support tickets. Blocked from payouts, KYC, and directory.'
                                  : 'Promote this account to grant Support Desk access only.'}
                              </span>
                            </div>
                          </div>

                          {selectedUserDossier.user?.role === 'USER' ? (
                            <button
                              type="button"
                              disabled={roleUpdating}
                              onClick={() => handleUpdateUserRole(selectedUserDossier.user, 'SUPPORT_AGENT')}
                              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              {roleUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Promote to Support Agent</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={roleUpdating}
                              onClick={() => handleUpdateUserRole(selectedUserDossier.user, 'USER')}
                              className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              {roleUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Revoke Agent Access</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                  {/* 3. Banking & Settlement Profile */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      Banking & Settlement Profile
                    </h3>
                    {selectedUserDossier.user?.bankDetails?.accountNumber ? (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2.5">
                          <Landmark className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
                          <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Bank & Account Name</span>
                            <span className="text-sm font-bold text-gray-900 block">
                              {selectedUserDossier.user.bankDetails.accountName}
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              {selectedUserDossier.user.bankDetails.bankName} ({selectedUserDossier.user.bankDetails.bankCode})
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase">NUBAN Account Number</span>
                          <span className="text-sm font-black text-gray-900 tracking-wider block">
                            {selectedUserDossier.user.bankDetails.accountNumber}
                          </span>
                          <span className="text-[11px] font-medium text-gray-500">
                            {selectedUserDossier.user.bankDetails.recipientCode
                              ? `Paystack Recipient: ${selectedUserDossier.user.bankDetails.recipientCode}`
                              : 'Guest Refund Account (No Recipient Code)'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-medium text-gray-500">
                        No bank account details saved on this profile.
                      </div>
                    )}
                  </div>

                  {/* 4. KYC / Host Verification Records */}
                  {selectedUserDossier.kyc?.hostApplications?.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        KYC & Host Applications ({selectedUserDossier.kyc.hostApplications.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedUserDossier.kyc.hostApplications.map((kycItem) => (
                          <div key={kycItem._id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-gray-900 block">
                                NIN / ID: {kycItem.nin || 'Not Provided'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {kycItem.city}, {kycItem.state} • {new Date(kycItem.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-white border border-gray-200 uppercase">
                              {kycItem.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Owned Assets */}
                  {(selectedUserDossier.assets?.properties?.length > 0 || selectedUserDossier.assets?.cars?.length > 0) && (
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        Owned Assets ({(selectedUserDossier.assets?.properties?.length || 0) + (selectedUserDossier.assets?.cars?.length || 0)})
                      </h3>
                      <div className="space-y-2">
                        {selectedUserDossier.assets?.properties?.map((prop) => (
                          <div key={prop._id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{prop.title}</p>
                              <p className="text-[11px] text-gray-500">{prop.category} • ₦{(prop.pricePerNight || 0).toLocaleString()}/night</p>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white border border-gray-200 uppercase shrink-0">
                              {prop.status}
                            </span>
                          </div>
                        ))}
                        {selectedUserDossier.assets?.cars?.map((car) => (
                          <div key={car._id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{car.make} {car.carModel || car.model} ({car.year})</p>
                              <p className="text-[11px] text-gray-500">{car.category} • ₦{(car.pricePer12Hours || 0).toLocaleString()}/12hr</p>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white border border-gray-200 uppercase shrink-0">
                              {car.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Recent Activity / Transactions */}
                  {selectedUserDossier.transactions && (
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        Recent Bookings & Transactions
                      </h3>
                      {(() => {
                        const allTx = [
                          ...(selectedUserDossier.transactions.asGuest?.properties || []).map((t) => ({ ...t, _role: 'Guest (Stay)' })),
                          ...(selectedUserDossier.transactions.asGuest?.cars || []).map((t) => ({ ...t, _role: 'Guest (Car)' })),
                          ...(selectedUserDossier.transactions.asHost?.properties || []).map((t) => ({ ...t, _role: 'Host (Stay)' })),
                          ...(selectedUserDossier.transactions.asHost?.cars || []).map((t) => ({ ...t, _role: 'Host (Car)' })),
                        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                        if (allTx.length === 0) {
                          return (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-medium text-gray-500">
                              No reservation transactions recorded for this user.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {allTx.slice(0, 10).map((tx) => {
                              const label = tx.carId
                                ? `${tx.carId.make || ''} ${tx.carId.carModel || tx.carId.model || ''}`.trim()
                                : tx.propertyId?.title || 'Reservation';
                              return (
                                <div key={tx._id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{label}</p>
                                    <p className="text-[11px] text-gray-500">
                                      {tx._role} • {new Date(tx.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-black text-gray-900">₦{(tx.totalAmount || 0).toLocaleString()}</p>
                                    <span className="text-[10px] font-bold uppercase text-gray-500">{tx.paymentStatus}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUserDossier(null)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Close Dossier
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