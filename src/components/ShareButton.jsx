import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ className = '', dark = false }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', window.location.href);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-brand-dark border border-gray-200 hover:border-brand-dark'} ${className}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
