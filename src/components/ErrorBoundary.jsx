import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Page crashed:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-display font-bold text-brand-dark">Something went wrong</h1>
          <p className="mt-3 text-lg text-brand-text-secondary">This page ran into a problem. Your information is safe.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-hover">Reload page</button>
            <a href="/" className="px-6 py-3 rounded-xl border border-gray-200 text-brand-dark font-semibold hover:border-brand-dark">Go home</a>
          </div>
        </div>
      </main>
    );
  }
}
