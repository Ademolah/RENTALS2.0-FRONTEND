import { Link } from 'react-router-dom';
import { Building2, Car, Shield, Compass } from 'lucide-react';
import { Container, PageHero, Card } from '../components/ui';

export default function Sitemap() {
  const sitemapData = [
    { title: "Stays & Hotels", icon: Building2, items: [
      { label: "Browse shortlets", to: "/" },
      { label: "List your property", to: "/list-property" },
    ]},
    { title: "Cars & VIP", icon: Car, items: [
      { label: "Car rentals", to: "/" },
      { label: "VIP services", to: "/" },
    ]},
    { title: "Company & Support", icon: Compass, items: [
      { label: "About Rentals Africa", to: "/about" },
      { label: "Help Center", to: "/help" },
      { label: "Guest dashboard", to: "/dashboard/guest" },
      { label: "Host dashboard", to: "/dashboard/landlord" },
    ]},
    { title: "Legal", icon: Shield, items: [
      { label: "Terms of Service", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Cancellation options", to: "/help#cancellation" },
      { label: "Safety information", to: "/help#safety" },
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-brand-dark">
      <PageHero
        eyebrow="Directory Overview"
        title="Platform Sitemap"
        subtitle="A complete structural index of all public routes, services, and legal frameworks across Rentals Africa."
      />

      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sitemapData.map((col, idx) => {
            const Icon = col.icon;
            return (
              <Card key={idx} className="p-7 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-primary-soft flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-brand-primary" />
                </div>
                <h2 className="text-xl font-display font-bold text-brand-dark mb-4">{col.title}</h2>
                <ul className="space-y-3">
                  {col.items.map((item, iIdx) => (
                    <li key={iIdx}>
                      <Link to={item.to} className="text-base text-brand-text-secondary hover:text-brand-primary transition-colors">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
