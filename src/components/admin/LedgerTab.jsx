import { DataTable, LoadingRow, MessageRow, StatusPill } from './TableParts';
import { ledgerStatusStyle, ledgerStatusLabel, personName } from './statusStyles';

const COLUMNS = [
  ['Date'],
  ['Guest'],
  ['Asset'],
  ['Amount (NGN)'],
  ['Payout Status'],
];

export default function LedgerTab({ loading, ledger }) {
  return (
    <DataTable columns={COLUMNS}>
      {loading ? (
        <LoadingRow />
      ) : ledger.length === 0 ? (
        <MessageRow className="p-8 text-center text-brand-text-secondary">No payment records found.</MessageRow>
      ) : (
        ledger.map((record) => {
          const isCar = !!record.carId;
          const assetTitle = isCar ? `${record.carId?.make} ${record.carId?.model}` : record.propertyId?.title;
          const guestName = personName(record.userId, 'Unknown');
          const amount = (record.totalAmount || 0).toLocaleString();
          const status = record.escrowStatus || record.payoutStatus || 'PROCESSING';

          return (
            <tr key={record._id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-4 text-xs font-bold text-brand-text-secondary whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString()}</td>
              <td className="p-4 text-sm font-bold text-brand-dark whitespace-nowrap">{guestName}</td>
              <td className="p-4 text-sm text-gray-600 truncate max-w-[200px]">{assetTitle}</td>
              <td className="p-4 text-xl font-display font-bold text-brand-dark whitespace-nowrap">₦{amount}</td>
              <td className="p-4 whitespace-nowrap">
                <StatusPill style={ledgerStatusStyle(status)} label={ledgerStatusLabel(status)} />
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
