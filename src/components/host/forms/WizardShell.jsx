import { X, Building, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

const TOTAL_STEPS = 3;

// Frame for the hotel creation wizard: header with progress, scrolling body, back / next / publish footer.
export default function WizardShell({ step, onStep, onClose, onSubmit, submitting, draftBar, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-fade-up duration-300">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">Create Hotel Profile</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-500" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full h-1 bg-gray-100 shrink-0">
          <div className="h-full bg-brand-primary transition-all duration-500 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          <div className="mb-5">{draftBar}</div>
          {children}
        </div>

        <div className="bg-white border-t border-gray-100 p-4 sm:p-6 shrink-0 flex justify-between items-center">
          <button
            onClick={() => onStep(Math.max(1, step - 1))}
            className={`font-bold px-6 py-3 rounded-xl transition-all flex items-center ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => onStep(Math.min(TOTAL_STEPS, step + 1))}
              className="bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-black transition-colors flex items-center shadow-md active:scale-95"
            >
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="bg-brand-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all flex items-center shadow-lg shadow-brand-primary/30 active:scale-95 disabled:opacity-70"
            >
              {submitting ? 'Publishing...' : 'Publish Hotel'}
              {!submitting && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
