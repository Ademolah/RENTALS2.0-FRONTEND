import { Loader2, Copy, Link as LinkIcon } from 'lucide-react';
import { DataTable, LoadingRow, MessageRow } from './TableParts';

const COLUMNS = [
  ['Reference'],
  ['Guest'],
  ['Asset Requested'],
  ['Negotiated Price (₦)', 'text-center'],
  ['Generate Link', 'text-right'],
];

function ReferenceButton({ code, onCopy }) {
  return (
    <button
      onClick={() => onCopy(code)}
      className="group flex items-center space-x-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-dark border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
      title="Copy Reference Code"
    >
      <span className="text-xs font-display font-bold tracking-widest">{code}</span>
      <Copy className="w-3.5 h-3.5 text-brand-text-secondary group-hover:text-brand-dark transition-colors" />
    </button>
  );
}

function GeneratedLink({ link, onCopy }) {
  return (
    <div className="flex items-center justify-end space-x-2 animate-in fade-in zoom-in duration-300">
      <input
        type="text"
        readOnly
        value={link}
        aria-label="Payment link"
        className="w-32 px-2 py-1.5 text-xs text-brand-text-secondary bg-gray-50 border border-gray-200 rounded outline-none truncate"
      />
      <button
        onClick={() => onCopy(link)}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" /><span>Copy</span>
      </button>
    </div>
  );
}

function GenerateButton({ busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-brand-dark hover:bg-brand-accent transition-colors px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
      <span>Generate</span>
    </button>
  );
}

export default function ConciergeTab({ loading, drafts, concierge }) {
  const { prices, links, linkLoading, setPrice, generateLink, copyLink, copyReference } = concierge;

  return (
    <DataTable columns={COLUMNS} minWidthClass="min-w-[900px]">
      {loading ? (
        <LoadingRow />
      ) : drafts.length === 0 ? (
        <MessageRow className="p-8 text-center text-brand-text-secondary">No pending WhatsApp reservations.</MessageRow>
      ) : (
        drafts.map((draft) => {
          const isCar = !!draft.carId;
          const assetTitle = isCar ? `${draft.carId?.make} ${draft.carId?.model}` : draft.propertyId?.title;
          const guestName = draft.userId ? `${draft.userId.firstName || ''} ${draft.userId.lastName || ''}`.trim() : 'Unknown';
          // The WA-XXXXXX reference is held in the paystackReference field by the server.
          const refCode = draft.paystackReference;
          const link = links[draft._id];

          return (
            <tr key={draft._id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-4 whitespace-nowrap"><ReferenceButton code={refCode} onCopy={copyReference} /></td>
              <td className="p-4 text-sm font-bold text-brand-dark whitespace-nowrap">{guestName}</td>
              <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
              <td className="p-4 text-center">
                <input
                  type="number"
                  placeholder="e.g. 450000"
                  disabled={!!link}
                  value={prices[draft._id] || ''}
                  onChange={(e) => setPrice(draft._id, e.target.value)}
                  className="w-32 px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-center disabled:bg-gray-100 disabled:text-brand-text-muted"
                  aria-label="Negotiated price in naira"
                />
              </td>
              <td className="p-4 text-right whitespace-nowrap">
                {link
                  ? <GeneratedLink link={link} onCopy={copyLink} />
                  : <GenerateButton busy={linkLoading[draft._id]} onClick={() => generateLink(refCode, draft._id)} />}
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
