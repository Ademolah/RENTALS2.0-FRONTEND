import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';

export default function FloatingPriceTag() {
  const [renderState, setRenderState] = useState('hidden'); 
  const [isDangling, setIsDangling] = useState(true);

  useEffect(() => {
    // 1. Pop up gracefully after mounting
    const showTimer = setTimeout(() => setRenderState('visible'), 500);
    
    // 2. Stop the icon dangling after 2.5 seconds
    const dangleTimer = setTimeout(() => setIsDangling(false), 2500);
    
    // 3. Start fading out the entire pill after 5 seconds
    const fadeTimer = setTimeout(() => setRenderState('fading'), 5000);
    
    // 4. Remove from DOM completely
    const removeTimer = setTimeout(() => setRenderState('hidden'), 5500);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(dangleTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (renderState === 'hidden') return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      
      {/* Custom Keyframe for the Tag Dangle */}
      <style>
        {`
          @keyframes dangle {
            0%, 100% { transform: rotate(-15deg); }
            50% { transform: rotate(15deg); }
          }
          .animate-dangle {
            animation: dangle 0.4s ease-in-out infinite;
            transform-origin: top left;
          }
        `}
      </style>
      
      <div className={`flex items-center space-x-2 bg-white/95 backdrop-blur-md px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200 transition-all duration-500 ease-out
        ${renderState === 'visible' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
      `}>
        <div className="relative flex items-center justify-center">
          <Tag className={`w-4 h-4 text-brand-primary fill-brand-primary ${isDangling ? 'animate-dangle' : ''}`} />
        </div>
        
        <span className="text-[13px] font-extrabold text-gray-900 tracking-tight">
          Prices include all fees
        </span>
      </div>

    </div>
  );
}