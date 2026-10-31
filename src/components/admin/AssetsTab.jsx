import { DataTable, LoadingRow, StatusPill, AssetTitle } from './TableParts';
import { listingStatusStyle } from './statusStyles';

const COLUMNS = [
  ['Asset'],
  ['Category'],
  ['Status'],
  ['Verified Badge', 'text-center'],
  ['Visibility', 'text-center'],
];

export default function AssetsTab({ loading, assets, onToggle }) {
  return (
    <DataTable columns={COLUMNS}>
      {loading ? (
        <LoadingRow />
      ) : (
        [...assets.properties, ...assets.cars].map((asset) => {
          const isCar = !!asset.make;
          const typeStr = isCar ? 'CAR' : asset.category;
          const title = isCar ? `${asset.make} ${asset.carModel || asset.model}` : asset.title;
          const currentStatus = asset.status || 'APPROVED';
          const assetType = isCar ? 'CAR' : 'PROPERTY';

          return (
            <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <AssetTitle isCar={isCar} title={title} />
              <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{typeStr}</td>
              <td className="p-4 whitespace-nowrap">
                <StatusPill style={listingStatusStyle(currentStatus)} label={currentStatus} />
              </td>
              <td className="p-4 text-center whitespace-nowrap">
                <button
                  onClick={() => onToggle(assetType, asset._id, 'isVerified', asset.isVerified)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${asset.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-brand-text-secondary border-gray-200'}`}
                >
                  {asset.isVerified ? 'Verified' : 'Unverified'}
                </button>
              </td>
              <td className="p-4 text-center whitespace-nowrap">
                <button
                  onClick={() => onToggle(assetType, asset._id, 'isAvailable', asset.isAvailable)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${asset.isAvailable ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                >
                  {asset.isAvailable ? 'Live' : 'Hidden'}
                </button>
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
