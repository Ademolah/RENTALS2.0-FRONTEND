import { Link } from 'react-router-dom';
import { Container } from '../components/ui';
import { useDocumentMeta } from '../lib/seo';

export default function NotFound() {
  useDocumentMeta('Page not found', 'This page does not exist.');
  return (
    <main className="min-h-[60vh] flex items-center">
      <Container className="py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-primary">Error 404</p>
        <h1 className="mt-3 text-4xl md:text-6xl font-display font-bold text-brand-dark tracking-tight">Page not found</h1>
        <p className="mt-4 text-lg text-brand-text-secondary max-w-md mx-auto">The page you are looking for does not exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-hover">Go to home</Link>
          <Link to="/help" className="px-6 py-3 rounded-xl border border-gray-200 text-brand-dark font-semibold hover:border-brand-dark">Get help</Link>
        </div>
      </Container>
    </main>
  );
}
