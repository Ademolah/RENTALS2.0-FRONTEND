import { Loader2, Car, Home } from 'lucide-react';

const TH = 'p-4 text-xs font-display font-bold uppercase tracking-widest text-brand-text-muted';

// Scrollable white card holding a table. `columns` is a list of [label, extra classes].
export function DataTable({ columns, minWidthClass = 'min-w-[800px]', children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in w-full max-w-[100vw] overflow-x-auto">
      <div className={minWidthClass}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {columns.map(([label, extra = '']) => (
                <th key={label} className={`${TH}${extra ? ` ${extra}` : ''}`}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function LoadingRow({ cellClass = 'p-8 text-center', spinnerClass = 'w-6 h-6 animate-spin mx-auto text-brand-text-muted' }) {
  return (
    <tr>
      <td colSpan="5" className={cellClass}><Loader2 className={spinnerClass} /></td>
    </tr>
  );
}

export function MessageRow({ className, children }) {
  return (
    <tr>
      <td colSpan="5" className={className}>{children}</td>
    </tr>
  );
}

export function StatusPill({ style, label }) {
  const { className, Icon } = style;
  return (
    <span className={`inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </span>
  );
}

export function AssetTitle({ isCar, title }) {
  return (
    <td className="p-4 font-bold text-brand-dark text-sm flex items-center space-x-2 whitespace-nowrap">
      {isCar ? <Car className="w-4 h-4 text-brand-text-muted shrink-0" /> : <Home className="w-4 h-4 text-brand-text-muted shrink-0" />}
      <span className="truncate max-w-[250px]">{title}</span>
    </td>
  );
}
