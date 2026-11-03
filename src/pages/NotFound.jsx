import { Link } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-extrabold text-gray-100 leading-none select-none mb-2">404</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
            Go back
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors"
          >
            <i className="fa-solid fa-house text-sm" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
