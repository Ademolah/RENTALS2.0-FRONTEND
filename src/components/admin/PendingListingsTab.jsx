import { Eye } from 'lucide-react';
import { DataTable, MessageRow, LoadingRow, AssetTitle } from './TableParts';
import { personName } from './statusStyles';

const COLUMNS = [
  ['Date Submitted'],
  ['Asset Title'],
  ['Category'],
  ['Host'],
  ['Actions', 'text-right'],
];

export default function PendingListingsTab({ loading, listings, onReview }) {
  return (
    <DataTable columns={COLUMNS}>
      {loading ? (
        <LoadingRow />
      ) : listings.length === 0 ? (
        <MessageRow className="p-8 text-center text-brand-text-muted font-medium">No pending asset listings to review.</MessageRow>
      ) : (
        listings.map((asset) => {
          const isCar = !!asset.make;
          const title = isCar ? `${asset.make} ${asset.carModel}` : asset.title;
          const hostName = personName(asset.ownerId, 'Unknown');

          return (
            <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{new Date(asset.createdAt).toLocaleDateString()}</td>
              <AssetTitle isCar={isCar} title={title} />
              <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{isCar ? 'CAR' : asset.category}</td>
              <td className="p-4 text-sm text-brand-text-secondary whitespace-nowrap">{hostName}</td>
              <td className="p-4 text-right whitespace-nowrap">
                <button
                  onClick={() => onReview(asset)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" /><span>Review Quality</span>
                </button>
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
