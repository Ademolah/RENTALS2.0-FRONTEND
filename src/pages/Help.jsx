import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronDown, ShieldCheck, CalendarX, Mail, LifeBuoy } from 'lucide-react';
import { Container, PageHero, Card, SectionTitle, Button, WhatsAppIcon } from '../components/ui';

const WHATSAPP = '2347063688222';

const FAQS = [
  { q: 'How do I book a stay?', a: 'Pick a city, choose a listing, select your dates and check availability, then reserve. You can pay securely online, or check out on WhatsApp.' },
  { q: 'Which fees will I pay?', a: 'You pay the listed price. There is no platform fee added at checkout. The optional chauffeur add-on for cars is N25,000 per 12 hours.' },
  { q: 'Can I see the host or contact them directly?', a: 'No. To protect everyone, hosts and guests never see each other\'s personal details. Rentals Africa is the middleman for every booking.' },
  { q: 'How does car rental work?', a: 'Cars are booked per 12-hour day. A single day can be booked on its own, with an optional chauffeur.' },
  { q: 'What is VIP service?', a: 'VIP covers concierge services and venues reserved through Rentals Africa, with your deposit held securely until you arrive.' },
  { q: 'How do I become a host?', a: 'Create an account, choose Host, and submit your listing. Once approved you can manage listings, bookings and payouts from your dashboard.' },
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
        <span className="text-lg font-semibold text-brand-dark">{q}</span>
        <ChevronDown className={`w-5 h-5 text-brand-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-base text-brand-text-secondary leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Help() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHero
        eyebrow="Support"
        title="How can we help?"
        subtitle="Answers, safety guidance and cancellation terms, plus WhatsApp checkout when you would rather book in a chat."
      >
        <Button variant="whatsapp" size="lg" onClick={() => window.open(`https://wa.me/${WHATSAPP}`, '_blank')}>
          <WhatsAppIcon className="w-5 h-5" /> Checkout via WhatsApp
        </Button>
      </PageHero>

      <Container className="py-16 space-y-14">
        <section id="help" className="scroll-mt-32">
          <SectionTitle title="Frequently asked questions" />
          <Card className="px-6 md:px-8"> {FAQS.map((f) => <Faq key={f.q} {...f} />)} </Card>
        </section>

        <section id="safety" className="scroll-mt-32">
          <SectionTitle title="Safety information" subtitle="Every listing and host is reviewed before going live." />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['Verified listings', 'Properties, hotels and vehicles are inspected and approved by our team.'],
              ['Private by design', 'Guests and hosts never exchange names, phone numbers or photos. Rentals Africa handles every conversation.'],
              ['Secure payments', 'Pay on the platform only. Never transfer money to a host or third party outside Rentals Africa.'],
            ].map(([t, d]) => (
              <Card key={t} className="p-6">
                <ShieldCheck className="w-8 h-8 text-brand-primary mb-4" />
                <h3 className="text-xl font-display font-bold text-brand-dark mb-2">{t}</h3>
                <p className="text-base text-brand-text-secondary leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="cancellation" className="scroll-mt-32">
          <SectionTitle title="Cancellation options" />
          <Card className="p-6 md:p-8 flex gap-5">
            <CalendarX className="w-8 h-8 text-brand-primary shrink-0" />
            <div className="space-y-3 text-base text-brand-text-secondary leading-relaxed">
              <p>You can cancel from your dashboard under Trips. You will see a refund quote before you confirm.</p>
              <p>Processing fees are non-refundable. Any refund due is handled by Rentals Africa and returned to your original payment method.</p>
              <p>Each listing shows its own cancellation window; read it before you book.</p>
            </div>
          </Card>
        </section>

        <section id="contact" className="scroll-mt-32">
          <SectionTitle title="Still need help?" />
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-card">
                <WhatsAppIcon className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-brand-dark">Book on WhatsApp</p>
                <p className="text-base text-brand-text-secondary">Check out and book a stay, car or VIP service right in WhatsApp. You can also ask our team a question there.</p>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="inline-block mt-1 text-base font-semibold text-[#128C7E] hover:underline">Start your booking on WhatsApp</a>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4">
              <Mail className="w-8 h-8 text-brand-primary" />
              <div>
                <p className="text-lg font-bold text-brand-dark">Email</p>
                <a href="mailto:privacy@rentalsafrica.com" className="text-base text-brand-primary font-semibold">privacy@rentalsafrica.com</a>
              </div>
            </Card>
          </div>
          <p className="mt-8 text-base text-brand-text-secondary flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" /> See also our <Link to="/terms" className="font-semibold text-brand-dark underline">Terms</Link> and <Link to="/privacy" className="font-semibold text-brand-dark underline">Privacy Policy</Link>.
          </p>
        </section>
      </Container>
    </div>
  );
}
