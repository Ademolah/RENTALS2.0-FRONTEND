import { X, Loader2, CheckCircle2, AlertCircle, Check } from 'lucide-react';

// Frame for the shortlet / car / hotel editors: header, loading state, form, save button and toast.
export function EditShell({
  icon: Icon, title, subtitle, onClose, formId, loading, loadingText, onSubmit, submitting, toast,
  widthClass = 'max-w-3xl', heightClass = 'max-h-[90vh]', formSpace = 'space-y-8', children,
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl w-full ${widthClass} shadow-2xl overflow-hidden relative flex flex-col ${heightClass}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{title}</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{loadingText}</p>
          </div>
        ) : (
          <form id={formId} onSubmit={onSubmit} className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${formSpace}`}>
            {children}
          </form>
        )}

        <div className="border-t border-gray-100 p-6 shrink-0 bg-white">
          <button
            form={formId}
            type="submit"
            disabled={submitting || loading}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] flex justify-center items-center"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Publish Changes'}
          </button>
        </div>

        <ModalToast toast={toast} />
      </div>
    </div>
  );
}

export function ModalToast({ toast }) {
  return (
    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[300] transition-all duration-300 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-green-900 text-white border-green-700' : 'bg-red-900 text-white border-red-700'}`}>
        {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        <span className="font-bold text-xs tracking-wide">{toast.message}</span>
      </div>
    </div>
  );
}

// Frame for the "studio" create forms (property, VIP venue / service).
export function StudioShell({ z, eyebrow, title, onClose, bodyClass, formId, loading, loadingText, submitLabel, children }) {
  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6 overflow-hidden`}>
      <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex justify-between items-center md:rounded-t-3xl">
          <div>
            <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">{eyebrow}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className={`overflow-y-auto p-6 md:p-8 ${bodyClass} custom-scrollbar`}>{children}</div>

        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-t border-gray-100 md:rounded-b-3xl flex justify-end">
          <button
            type="submit"
            form={formId}
            disabled={loading}
            className="group relative overflow-hidden rounded-full bg-gray-900 px-10 py-4 transition-all duration-300 hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none w-full md:w-auto"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div className="relative flex items-center justify-center space-x-2 text-white">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold text-sm tracking-wide">{loadingText}</span>
                </>
              ) : (
                <span className="font-semibold text-sm tracking-wide">{submitLabel}</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Frame for the VIP editor (lighter header and footer than the create form).
export function StudioEditShell({ title, onClose, formId, loading, saving, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl flex flex-col shadow-2xl relative animate-in fade-in duration-200">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex justify-between items-center md:rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">{children}</div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end md:rounded-b-3xl">
          <button
            type="submit"
            form={formId}
            disabled={saving || loading}
            className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Frame for the compact car create form.
export function CompactShell({ title, subtitle, onClose, onSubmit, loading, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[1.5rem] shadow-2xl animate-fade-up">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-6 space-y-6 custom-scrollbar">{children}</div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-[1.5rem]">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirm Listing</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
