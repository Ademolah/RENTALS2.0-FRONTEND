import React from 'react';

export default function PriceTagIcon({ className = "w-6 h-6", color = "#F25F5C" }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 32 32" 
      xmlns="http://w3.org" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Clean outer price tag silhouette */}
      <path d="M7 24.5V7.5A2.5 2.5 0 0 1 9.5 5h13A2.5 2.5 0 0 1 25 7.5v17a2.5 2.5 0 0 1-4 2L16 23.5l-5 3a2.5 2.5 0 0 1-4-2z" />
      {/* Cut-out ticket notch circle indicator */}
      <circle cx="16" cy="11" r="2.5" fill={color} />
      {/* Lower structural dash tag marker */}
      <line x1="12" y1="18" x2="20" y2="18" strokeWidth="2" />
    </svg>
  );
}
