import { useCallback, useState } from 'react';
import { HostService } from '../api/host';
import { useAuth } from '../context/AuthContext';
import { Container, Skeleton } from '../components/ui';
import { fetchHostReviews, lagosToday, rememberSubmitted } from '../components/host/hostApi';
import DashboardHeader from '../components/host/dashboard/DashboardHeader';
import EarningsHero from '../components/host/dashboard/EarningsHero';
import ApprovalBanner from '../components/host/dashboard/ApprovalBanner';
import StatTiles from '../components/host/dashboard/StatTiles';
import SidebarNav from '../components/host/dashboard/SidebarNav';
import ArrivingToday from '../components/host/dashboard/ArrivingToday';
import LedgerTab from '../components/host/dashboard/LedgerTab';
import BookingsTab from '../components/host/dashboard/BookingsTab';
import PayoutsTab from '../components/host/dashboard/PayoutsTab';
import EarningsTab from '../components/host/dashboard/EarningsTab';
import ReviewsTab from '../components/host/dashboard/ReviewsTab';
import ListingsTab from '../components/host/dashboard/ListingsTab';
import DashboardDialogs from '../components/host/dashboard/DashboardDialogs';
import HostModals from '../components/host/dashboard/HostModals';
import { summarizeBookings } from '../components/host/dashboard/bookingMath';
import { normalizeAnalytics } from '../components/host/dashboard/bookingData';
import { LISTING_TABS, tabForListing } from '../components/host/dashboard/constants';
import { useDashboardModals } from '../components/host/dashboard/useDashboardModals';
import { useHostBookings } from '../components/host/dashboard/useHostBookings';
import { useHostListings } from '../components/host/dashboard/useHostListings';
import { useLazyResource } from '../components/host/dashboard/useLazyResource';
import { useNotify } from '../components/host/dashboard/useNotify';

const MODAL_FOR_ASSET = { PROPERTY: 'property', CAR: 'car', HOTEL: 'hotel', VIP: 'vip' };
const EDITOR_FOR_TYPE = { CAR: 'car', SHORTLET: 'property', HOTEL: 'hotel' };

export default function LandlordDashboard() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const notify = useNotify();

  const [activeTab, setActiveTab] = useState('ACTION_FEED');
  const [menuOpen, setMenuOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeMatch, setCodeMatch] = useState(null);

  const modals = useDashboardModals();
  const ledger = useHostBookings(notify);
  const { listings, state: listingsState, reload: reloadListings, togglingId, toggleAvailability } = useHostListings(userId, notify);

  const loadAnalytics = useCallback(() => HostService.getAnalytics().then(normalizeAnalytics), []);
  const analytics = useLazyResource(activeTab === 'EARNINGS', loadAnalytics);
  const loadReviews = useCallback(() => fetchHostReviews(listings), [listings]);
  const reviews = useLazyResource(activeTab === 'REVIEWS' && listingsState === 'ready', loadReviews);

  const today = lagosToday();
  const { totalClearedEarnings, pendingPayout, arrivingToday, payoutRows } = summarizeBookings(ledger.bookings, today);
  const pendingListings = listings.filter((l) => l.status === 'pending');
  const approvedListings = listings.filter((l) => l.status === 'active' || l.status === 'paused');

  const refreshAll = () => { ledger.reload(); reloadListings(); };
  const remember = (type, created) => rememberSubmitted(userId, type, created);

  const pickAsset = (type) => {
    setMenuOpen(false);
    modals.openModal(MODAL_FOR_ASSET[type]);
  };
  const editListing = (l) => modals.startEditing(EDITOR_FOR_TYPE[l.type] || 'vip', l.id);

  const renderTab = () => {
    if (ledger.isLoading) {
      return (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      );
    }
    if (activeTab === 'EARNINGS') return <EarningsTab analytics={analytics.data} status={analytics.status} onRetry={analytics.reload} />;
    if (activeTab === 'ACTION_FEED') return <LedgerTab bookings={ledger.bookings} today={today} processingId={ledger.processingId} onConfirm={ledger.confirmBooking} onCancel={ledger.askCancel} />;
    if (activeTab === 'PAYOUTS') return <PayoutsTab rows={payoutRows} onReleased={ledger.markReleased} onNeedBank={() => modals.openModal('bank')} />;
    if (activeTab === 'BOOKINGS') return <BookingsTab bookings={ledger.bookings} today={today} onCancel={ledger.askCancel} />;
    if (activeTab === 'REVIEWS') return <ReviewsTab reviews={reviews.data || []} status={reviews.status} onRetry={reviews.reload} />;
    if (LISTING_TABS.includes(activeTab)) {
      return (
        <ListingsTab
          tab={activeTab}
          listings={listings}
          state={listingsState}
          bookings={ledger.bookings}
          togglingId={togglingId}
          onReload={reloadListings}
          onEdit={editListing}
          onEditRooms={(l) => modals.startEditing('hotel', l.id)}
          onToggle={toggleAvailability}
        />
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <DashboardHeader menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((o) => !o)} onPickAsset={pickAsset} onSetupPayouts={() => modals.openModal('bank')} />

      <Container className="mt-8">
        <EarningsHero
          released={totalClearedEarnings}
          pending={pendingPayout}
          onAddAsset={() => setMenuOpen(true)}
          onPayoutAccount={() => modals.openModal('bank')}
          onAnalytics={() => setActiveTab('EARNINGS')}
          onEnterCode={() => setCodeOpen(true)}
        />
        <ApprovalBanner count={pendingListings.length} onView={() => setActiveTab(tabForListing(pendingListings[0]))} />
        <StatTiles total={listings.length} pending={pendingListings.length} approved={approvedListings.length} arriving={arrivingToday.length} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <SidebarNav activeTab={activeTab} onSelect={setActiveTab} />
          <section className="flex-1 min-w-0 w-full">
            {!ledger.isLoading && activeTab === 'ACTION_FEED' && (
              <ArrivingToday bookings={arrivingToday} processingId={ledger.processingId} onConfirm={ledger.confirmBooking} />
            )}
            {renderTab()}
          </section>
        </div>
      </Container>

      <HostModals modals={modals} remember={remember} onChanged={refreshAll} notify={notify} />
      <DashboardDialogs
        bookings={ledger.bookings}
        notify={notify}
        cancelTarget={ledger.cancelTarget}
        cancelling={ledger.cancelling}
        onConfirmCancel={ledger.confirmCancel}
        onDismissCancel={ledger.dismissCancel}
        codeOpen={codeOpen}
        onCloseCode={() => setCodeOpen(false)}
        codeMatch={codeMatch}
        onCodeMatch={setCodeMatch}
        onClearCodeMatch={() => setCodeMatch(null)}
        processingId={ledger.processingId}
        onConfirmBooking={ledger.confirmBooking}
      />
    </main>
  );
}
