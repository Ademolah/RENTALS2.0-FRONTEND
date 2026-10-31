import { useEffect, useState, useCallback } from 'react';
import {
  getHostApplications, getDashboardStats, getEscrowLedger, getAssetOversight, getPendingConciergeDrafts,
} from '../../api/admin';
import { errMsg } from './statusStyles';

const LOAD_ERRORS = {
  applications: 'Could not load host applications.',
  overview: 'Could not load platform stats.',
  escrow: 'Could not load the payment ledger.',
  assets: 'Could not load assets.',
  'pending-assets': 'Could not load assets.',
  concierge: 'Could not load the concierge queue.',
};

// Opening a tab loads the data that tab shows. `loading` stays true until that load finishes.
export function useAdminData(notify) {
  const [view, setView] = useState({ tab: 'applications', done: false });
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [assets, setAssets] = useState({ properties: [], cars: [] });
  const [conciergeDrafts, setConciergeDrafts] = useState([]);

  const selectTab = useCallback((next) => {
    setView((v) => (v.tab === next ? v : { tab: next, done: false }));
  }, []);

  const { tab } = view;

  useEffect(() => {
    const loaders = {
      applications: async () => {
        const res = await getHostApplications();
        setApplications(res.data?.requests || res.data?.applications || res.data || []);
      },
      overview: async () => {
        const res = await getDashboardStats();
        setStats(res.data);
      },
      escrow: async () => {
        const res = await getEscrowLedger();
        setLedger(res.data?.ledger || []);
      },
      assets: async () => {
        const res = await getAssetOversight();
        setAssets({ properties: res.data?.properties || [], cars: res.data?.cars || [] });
      },
      concierge: async () => {
        const res = await getPendingConciergeDrafts();
        // The drafts can be nested at several levels depending on how the response was wrapped.
        setConciergeDrafts(res.data?.data?.drafts || res.data?.drafts || res?.drafts || []);
      },
    };
    loaders['pending-assets'] = loaders.assets;

    const load = loaders[tab];
    if (!load) return undefined;

    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (error) {
        if (!cancelled) notify(errMsg(error, LOAD_ERRORS[tab]));
      } finally {
        if (!cancelled) setView((v) => (v.tab === tab ? { ...v, done: true } : v));
      }
    })();

    return () => { cancelled = true; };
  }, [tab, notify]);

  return {
    activeTab: view.tab,
    selectTab,
    loading: !view.done,
    applications, setApplications,
    stats,
    ledger,
    assets, setAssets,
    conciergeDrafts,
  };
}
