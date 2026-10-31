import { useState, useMemo } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import NoticeBanner from '../components/admin/NoticeBanner';
import OverviewTab from '../components/admin/OverviewTab';
import ConciergeTab from '../components/admin/ConciergeTab';
import ApplicationsTab from '../components/admin/ApplicationsTab';
import PendingListingsTab from '../components/admin/PendingListingsTab';
import AssetsTab from '../components/admin/AssetsTab';
import LedgerTab from '../components/admin/LedgerTab';
import SettingsTab from '../components/admin/SettingsTab';
import ApplicationReviewModal from '../components/admin/ApplicationReviewModal';
import ListingReviewModal from '../components/admin/ListingReviewModal';
import MediaViewer from '../components/admin/MediaViewer';
import { tabHeading } from '../components/admin/adminNav';
import { useNotice } from '../components/admin/useNotice';
import { useAdminData } from '../components/admin/useAdminData';
import { useAdminActions } from '../components/admin/useAdminActions';
import { useConciergeLinks } from '../components/admin/useConciergeLinks';

export default function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notice, notify } = useNotice();
  const data = useAdminData(notify);
  const actions = useAdminActions({ notify, setApplications: data.setApplications, setAssets: data.setAssets });
  const concierge = useConciergeLinks(notify);

  const { activeTab, loading, assets } = data;

  const pendingListings = useMemo(() => [
    ...assets.properties.filter((p) => p.status === 'PENDING'),
    ...assets.cars.filter((c) => c.status === 'PENDING'),
  ], [assets]);

  const badges = {
    applications: data.applications.length,
    'pending-assets': pendingListings.length,
    concierge: data.conciergeDrafts.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar
        activeTab={activeTab}
        onSelect={data.selectTab}
        badges={badges}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-[100vw] overflow-hidden">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-dark tracking-tight capitalize">
              {tabHeading(activeTab)}
            </h1>
            <p className="text-base text-brand-text-secondary mt-1">Manage and oversee platform operations.</p>
          </div>
        </header>

        <NoticeBanner notice={notice} />

        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'overview' && <OverviewTab loading={loading} stats={data.stats} />}
        {activeTab === 'concierge' && <ConciergeTab loading={loading} drafts={data.conciergeDrafts} concierge={concierge} />}
        {activeTab === 'applications' && (
          <ApplicationsTab loading={loading} applications={data.applications} onReview={actions.setSelectedApp} />
        )}
        {activeTab === 'pending-assets' && (
          <PendingListingsTab loading={loading} listings={pendingListings} onReview={actions.setSelectedListing} />
        )}
        {activeTab === 'assets' && <AssetsTab loading={loading} assets={assets} onToggle={actions.handleToggleAsset} />}
        {activeTab === 'escrow' && <LedgerTab loading={loading} ledger={data.ledger} />}
      </main>

      {actions.selectedApp && (
        <ApplicationReviewModal
          application={actions.selectedApp}
          busy={actions.actionLoading}
          onClose={() => actions.setSelectedApp(null)}
          onApprove={actions.handleApprove}
          onReject={actions.handleReject}
        />
      )}

      {actions.selectedListing && (
        <ListingReviewModal
          listing={actions.selectedListing}
          busy={actions.actionLoading}
          onClose={() => actions.setSelectedListing(null)}
          onDecision={actions.handleListingApproval}
          onOpenMedia={actions.setMediaViewer}
        />
      )}

      {actions.mediaViewer && (
        <MediaViewer media={actions.mediaViewer} onClose={() => actions.setMediaViewer(null)} />
      )}
    </div>
  );
}
