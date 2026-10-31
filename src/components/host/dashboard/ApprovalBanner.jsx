import { Clock } from 'lucide-react';
import { Button } from '../../ui';

export default function ApprovalBanner({ count, onView }) {
  if (count === 0) return null;
  const one = count === 1;
  return (
    <section className="mb-8 rounded-3xl border border-brand-warning/30 bg-brand-warning-soft p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-soft"><Clock className="w-7 h-7 text-brand-warning" /></div>
      <div className="flex-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-brand-dark">
          {count} listing{one ? ' is' : 's are'} waiting for admin approval
        </h2>
        <p className="text-base text-brand-text-secondary mt-1">Rentals Africa is reviewing {one ? 'it' : 'them'}. {one ? 'It goes' : 'They go'} live as soon as {one ? 'it is' : 'they are'} approved, and guests cannot see {one ? 'it' : 'them'} until then.</p>
      </div>
      <Button variant="dark" onClick={onView}>View {one ? 'listing' : 'listings'}</Button>
    </section>
  );
}
