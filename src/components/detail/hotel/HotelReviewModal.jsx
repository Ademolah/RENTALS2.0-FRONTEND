import { Star, Loader2, X } from 'lucide-react';

export default function HotelReviewModal({ form, setForm, error, submitting, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-elevated relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-text-muted hover:text-brand-dark transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-4 w-0.5 bg-brand-primary"></div>
            <span className="text-xs font-display font-bold text-brand-primary uppercase tracking-[0.25em]">
              Guest Feedback
            </span>
          </div>

          <h3 className="text-2xl font-display font-bold text-brand-dark tracking-tight mb-2">Rate your stay</h3>
          <p className="text-sm font-medium text-brand-text-secondary mb-8">Your feedback helps maintain our world-class standard.</p>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">Overall Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <Star className={`w-8 h-8 ${form.rating >= star ? 'fill-gray-900 text-brand-dark' : 'fill-transparent text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">Written Review</label>
              <textarea
                rows={4}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Share the details of your stay..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none"
              ></textarea>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-brand-dark hover:bg-brand-accent text-white rounded-xl text-base font-bold tracking-wider uppercase transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center shadow-lg"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
