import { Eye } from 'lucide-react';
import { DataTable, MessageRow, StatusPill, LoadingRow } from './TableParts';
import { listingStatusStyle } from './statusStyles';

const COLUMNS = [
  ['Applicant Name'],
  ['NIN / ID'],
  ['Location'],
  ['Status'],
  ['Actions', 'text-right'],
];

export default function ApplicationsTab({ loading, applications, onReview }) {
  return (
    <DataTable columns={COLUMNS}>
      {loading ? (
        <LoadingRow cellClass="p-8 text-center text-brand-text-muted" spinnerClass="w-6 h-6 animate-spin mx-auto mb-2" />
      ) : applications.length === 0 ? (
        <MessageRow className="p-8 text-center text-brand-text-muted font-medium">No pending host applications.</MessageRow>
      ) : (
        applications.map((app) => {
          const name = app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : (app.firstName || 'Unknown');
          const currentStatus = app.status || 'PENDING';

          return (
            <tr key={app._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="p-4 font-bold text-brand-dark whitespace-nowrap">{name}</td>
              <td className="p-4 text-sm text-brand-text-secondary whitespace-nowrap">{app.nin || 'N/A'}</td>
              <td className="p-4 text-sm text-brand-text-secondary whitespace-nowrap">{app.city}, {app.state}</td>
              <td className="p-4 whitespace-nowrap">
                <StatusPill style={listingStatusStyle(currentStatus)} label={currentStatus} />
              </td>
              <td className="p-4 text-right whitespace-nowrap">
                <button
                  onClick={() => onReview(app)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" /><span>Review</span>
                </button>
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
