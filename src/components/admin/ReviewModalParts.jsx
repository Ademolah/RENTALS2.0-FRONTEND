import { X, XCircle, CheckCircle2, Loader2 } from 'lucide-react';

// Shared frame for the host-application and listing review dialogs.
export function ReviewModalShell({ title, subtitle, widthClass, bodyClass, onClose, footer, children }) {
  return (
    <div className="fixed inset-0 z-[990] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white w-full ${widthClass} rounded-3xl shadow-elevated overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]`}>
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg md:text-xl font-display font-bold text-brand-dark">{title}</h2>
            <p className="text-xs md:text-xs text-brand-text-secondary font-medium mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-brand-text-secondary transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 ${bodyClass}`}>{children}</div>

        {footer}
      </div>
    </div>
  );
}

// Reject and approve buttons at the bottom of a review dialog.
export function ReviewFooter({ busy, onReject, onApprove, rejectLabel, approveLabel }) {
  return (
    <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 md:gap-4">
      <button
        onClick={onReject}
        disabled={busy}
        className="w-full sm:flex-1 py-3.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> {rejectLabel}</>}
      </button>
      <button
        onClick={onApprove}
        disabled={busy}
        className="w-full sm:flex-1 py-3.5 bg-brand-dark hover:bg-brand-accent text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> {approveLabel}</>}
      </button>
    </div>
  );
}
