import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Car, 
  ShieldCheck, 
  ArrowRight, 
  Globe2, 
  Users2, 
  Award, 
  TrendingUp,
  CheckCircle2,
  Compass
} from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Active Shortlets & Cars', value: '3,500+' },
    { label: 'Verified Guests Served', value: '45,000+' },
    { label: 'Key Cities Covered', value: 'Lagos & Abuja' },
    { label: 'Host Escrow Payouts', value: '₦1.2B+' },
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
      desc: 'Dual-identity verification for guests and automated escrow payouts for hosts keep every transaction safe.',
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-28 md:pb-32 bg-gradient-to-b from-gray-50/90 via-white to-white overflow-hidden">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 animate-in fade-in duration-500">
              <div className="h-4 w-0.5 bg-brand-primary"></div>
              <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-[0.25em]">
                Redefining African Mobility & Hospitality
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
              Elevating how Africa stays, moves, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-blue-600 to-indigo-600">experiences luxury.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Rentals Africa is building the operating system for premium shortlet apartments, luxury car rentals, and bespoke VIP security services.
            </p>

            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-brand-primary hover:bg-brand-hover text-white text-base font-bold rounded-2xl shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all duration-300 transform active:scale-95 flex items-center space-x-3"
              >
                <span>Explore Our Portfolio</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC IMPACT NUMBERS */}
      <section className="py-12 bg-gray-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m, idx) => (
              <div key={idx} className="text-center p-4">
                <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-brand-primary mb-2">
                  {m.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SPLIT-SCREEN BRAND STORY SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Image Showcase Grid */}
            <div className="lg:col-span-6 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" 
                    alt="Luxury Villa" 
                    className="rounded-3xl object-cover h-64 w-full shadow-lg"
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80" 
                    alt="Luxury SUV Rental" 
                    className="rounded-3xl object-cover h-48 w-full shadow-lg"
                  />
                </div>
                <div className="space-y-4 pt-8">
                  <img 
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" 
                    alt="Penthouse Interior" 
                    className="rounded-3xl object-cover h-48 w-full shadow-lg"
                  />
                  <div className="bg-gradient-to-br from-brand-primary to-blue-600 text-white p-6 rounded-3xl h-64 flex flex-col justify-between shadow-xl">
                    <Building2 className="w-8 h-8 opacity-80" />
                    <div>
                      <p className="text-2xl font-black leading-tight">Lagos & Abuja</p>
                      <p className="text-xs text-white/80 font-medium mt-1">Curated for business & lifestyle</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Our Vision</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Born out of a need for reliability and world-class polish.
              </h2>
              <p className="text-gray-600 font-medium text-base leading-relaxed">
                Finding high-end accommodation or securing executive transport in major African commercial hubs used to require dealing with fragmented brokers, uncertain property conditions, and payment risks.
              </p>
              <p className="text-gray-600 font-medium text-base leading-relaxed">
                Rentals Africa changes that completely. By uniting shortlet homes, boutique hotels, premium car hire, and VIP security escorts under a single unified standard, we give travelers peace of mind and host property owners institutional-grade protection.
              </p>

              <div className="pt-4 space-y-3">
                <div className="flex items-center space-x-3 text-sm font-bold text-gray-900">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  <span>Integrated escrow payment systems for zero risk</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-bold text-gray-900">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  <span>24/7 dedicated concierge & emergency support</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-bold text-gray-900">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  <span>100% verified asset conditions and hosts</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CORE PLATFORM PILLARS */}
      <section className="py-20 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Why We Stand Out</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Built on three uncompromising pillars</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {corePillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {pillar.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{pillar.title}</h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. EXECUTIVE TEAM SPOTLIGHT */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Leadership</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">Meet the team behind the vision</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leaders.map((leader, idx) => (
              <div key={idx} className="bg-gray-50/60 rounded-3xl overflow-hidden border border-gray-100 group">
                <div className="h-72 overflow-hidden relative">
                  <img 
                    src={leader.image} 
                    alt={leader.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{leader.name}</h3>
                  <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mt-1 mb-3">{leader.role}</p>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">{leader.bio}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Ready to experience the future of African rentals?
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-8 font-medium">
            Whether you are booking your next stay or listing your fleet, Rentals Africa is ready for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
            >
              Browse Properties & Cars
            </button>
            <button
              onClick={() => navigate('/list-property')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all active:scale-95"
            >
              Become a Host
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}