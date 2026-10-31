import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Globe2,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { Button, Badge, Container, PageHero, SectionTitle } from '../components/ui';

export default function About() {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Active Shortlets & Cars', value: '3,500+' },
    { label: 'Verified Guests Served', value: '45,000+' },
    { label: 'Key Cities Covered', value: 'Lagos & Abuja' },
    { label: 'Host Payouts', value: '₦1.2B+' },
  ];

  const corePillars = [
    {
      title: 'Curated Luxury Standards',
      desc: 'Every shortlet, hotel suite, and rental vehicle undergoes strict physical inspection before joining our platform.',
      icon: Compass,
      tag: 'Excellence'
    },
    {
      title: 'Bank-Grade Security & Verification',
      desc: 'Dual-identity verification for guests and automated payouts for hosts keep every transaction safe.',
      icon: ShieldCheck,
      tag: 'Trust'
    },
    {
      title: 'Seamless Multi-Service Access',
      desc: 'From shortlets in Ikoyi to VIP escort fleets in Maitama, manage your entire trip experience under one roof.',
      icon: Globe2,
      tag: 'Convenience'
    }
  ];

  const leaders = [
    {
      name: 'Tunde Adeleke',
      role: 'Co-Founder & Chief Executive Officer',
      bio: 'Former fintech director with 12+ years building digital banking and hospitality infrastructure across West Africa.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Amara Okonkwo',
      role: 'Chief Product & Design Officer',
      bio: 'Luxury real estate designer passionate about creating frictionless digital booking experiences for global travelers.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'David Mensah',
      role: 'Head of VIP Escorts & Automotive',
      bio: 'Ex-automotive executive overseeing high-profile fleet operations, armored vehicles, and private security protocols.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-brand-dark flex flex-col">

      <PageHero
        eyebrow="Redefining African Mobility & Hospitality"
        title={<>Elevating how Africa stays, moves, and <span className="text-brand-primary">experiences luxury.</span></>}
        subtitle="Rentals Africa is building the operating system for premium shortlet apartments, luxury car rentals, and bespoke VIP security services."
      >
        <Button size="lg" onClick={() => navigate('/')}>
          <span>Explore Our Portfolio</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </PageHero>

      {/* Impact numbers */}
      <section className="bg-brand-dark-card text-white border-t border-white/10">
        <Container className="py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-display font-bold mb-2">{m.value}</div>
                <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">{m.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Brand story */}
      <section className="py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                    alt="Luxury Villa"
                    className="rounded-3xl object-cover h-72 w-full shadow-card"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80"
                    alt="Luxury SUV Rental"
                    className="rounded-3xl object-cover h-52 w-full shadow-card"
                  />
                </div>
                <div className="space-y-4 pt-10">
                  <img
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
                    alt="Penthouse Interior"
                    className="rounded-3xl object-cover h-52 w-full shadow-card"
                  />
                  <div className="bg-brand-dark text-white p-7 rounded-3xl h-72 flex flex-col justify-between shadow-elevated">
                    <Building2 className="w-9 h-9 text-brand-primary" />
                    <div>
                      <p className="text-3xl font-display font-bold leading-tight">Lagos & Abuja</p>
                      <p className="text-base text-white/70 mt-1">Curated for business & lifestyle</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <Badge tone="brand">Our Vision</Badge>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-brand-dark tracking-tight leading-tight">
                Born out of a need for reliability and world-class polish.
              </h2>
              <p className="text-brand-text-secondary text-lg leading-relaxed">
                Finding high-end accommodation or securing executive transport in major African commercial hubs used to require dealing with fragmented brokers, uncertain property conditions, and payment risks.
              </p>
              <p className="text-brand-text-secondary text-lg leading-relaxed">
                Rentals Africa changes that completely. By uniting shortlet homes, boutique hotels, premium car hire, and VIP security escorts under a single unified standard, we give travelers peace of mind and host property owners institutional-grade protection.
              </p>

              <div className="pt-2 space-y-4">
                {[
                  'Secure payment processing for peace of mind',
                  '24/7 dedicated concierge & emergency support',
                  '100% verified asset conditions and hosts',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-3 text-base font-semibold text-brand-dark">
                    <CheckCircle2 className="w-6 h-6 text-brand-primary flex-shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pillars */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge tone="brand">Why We Stand Out</Badge>
            <h2 className="text-4xl font-display font-bold text-brand-dark mt-4 tracking-tight">Built on three uncompromising pillars</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {corePillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="bg-white p-9 rounded-3xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-center justify-between mb-7">
                    <div className="w-14 h-14 bg-brand-primary-soft rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="w-7 h-7" />
                    </div>
                    <Badge tone="gray">{pillar.tag}</Badge>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-brand-dark mb-3">{pillar.title}</h3>
                  <p className="text-brand-text-secondary text-base leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="py-24">
        <Container>
          <SectionTitle title="Meet the team behind the vision" subtitle="Leadership with deep roots in fintech, design and automotive." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leaders.map((leader, idx) => (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-card group">
                <div className="h-80 overflow-hidden relative">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-7">
                  <h3 className="text-2xl font-display font-bold text-brand-dark">{leader.name}</h3>
                  <p className="text-sm font-bold text-brand-primary uppercase tracking-wider mt-1 mb-3">{leader.role}</p>
                  <p className="text-brand-text-secondary text-base leading-relaxed">{leader.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-brand-primary/20 blur-3xl" />
        <Container className="text-center relative">
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6">
            Ready to experience the future of African rentals?
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
            Whether you are booking your next stay or listing your fleet, Rentals Africa is ready for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/')}>Browse Properties & Cars</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/list-property')}>Become a Host</Button>
          </div>
        </Container>
      </section>

    </div>
  );
}
