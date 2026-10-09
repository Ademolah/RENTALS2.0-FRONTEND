import { Building2, Car, Shield, Compass } from 'lucide-react';

export default function Sitemap() {
  const sitemapData = [
    {
      title: "Shortlet Residences",
      icon: Building2,
      items: [
        "Luxury Apartments in Lagos",
        "Executive Suites in Abuja",
        "Penthouse & Villa Rentals",
        "List Your Property",
      ]
    },
    {
      title: "Automotive & VIP Escorts",
      icon: Car,
      items: [
        "Luxury Car Rentals (Lagos)",
        "Executive Fleet (Abuja)",
        "VIP Security & Escorts",
        "Host Your Vehicle Fleet",
      ]
    },
    {
      title: "Company & Support",
      icon: Compass,
      items: [
        "About Rentals Africa",
        "Host Earnings Calculator",
        "Guest Portal",
        "Host Dashboard",
      ]
    },
    {
      title: "Legal & Compliance",
      icon: Shield,
      items: [
        "Terms of Service",
        "Privacy Policy",
        "Escrow Protection Policy",
        "Guest Verification Standards",
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Label */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-4 w-0.5 bg-brand-primary"></div>
            <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-[0.25em]">
              Directory Overview
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Platform Sitemap
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-2 max-w-xl">
            A complete structural index of all public routes, services, and legal frameworks across Rentals Africa.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pt-6 border-t border-gray-100">
          {sitemapData.map((col, idx) => {
            const Icon = col.icon;
            return (
              <div key={idx} className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-900 font-bold text-base">
                  <Icon className="w-4 h-4 text-brand-primary" />
                  <span>{col.title}</span>
                </div>
                <ul className="space-y-2.5">
                  {col.items.map((item, iIdx) => (
                    <li key={iIdx} className="text-xs font-medium text-gray-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}