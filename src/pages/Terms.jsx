import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  CreditCard, 
  Building2, 
  AlertCircle, 
  ChevronRight,
  Scale
} from 'lucide-react';

export default function Terms() {
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. User Verification & Eligibility' },
    { id: 'bookings', title: '3. Booking & Escrow Payments' },
    { id: 'cancellations', title: '4. Cancellations & Refunds' },
    { id: 'host-terms', title: '5. Host Obligations & Guarantees' },
    { id: 'vip-vehicle', title: '6. Vehicle & VIP Escort Services' },
    { id: 'liability', title: '7. Limitation of Liability' },
    { id: 'governing-law', title: '8. Governing Law & Dispute Resolution' },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans pb-24">
      
      {/* HERO HEADER */}
      <section className="bg-white border-b border-gray-100 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Scale className="w-4 h-4" />
              <span>Legal Framework</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-500 text-base font-medium leading-relaxed">
              Last updated: October 2026. Please read these terms carefully before booking shortlets, reserving luxury vehicles, or listing assets on Rentals Africa.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT & SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* FLOATING SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">Table of Contents</p>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeSection === sec.id
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{sec.title}</span>
                  {activeSection === sec.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </aside>

          {/* MAIN LEGAL TEXT */}
          <main className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-12">
            
            {/* KEY HIGHLIGHT CARD */}
            <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/15 flex items-start space-x-4">
              <ShieldCheck className="w-6 h-6 text-brand-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed font-medium">
                <strong className="font-bold text-gray-900 block mb-1">Escrow & Identity Protection Notice:</strong>
                All rental payments are safely held in escrow and released 24 hours post check-in or delivery. Guests and hosts must complete ID verification prior to booking execution.
              </div>
            </div>

            {/* SECTION 1 */}
            <section id="acceptance" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                By accessing, browsing, or using Rentals Africa (including our mobile application, website, and associated reservation services), you agree to be bound by these Terms of Service. If you do not agree to all conditions outlined herein, you must refrain from using the platform.
              </p>
            </section>

            {/* SECTION 2 */}
            <section id="eligibility" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">2. User Verification & Eligibility</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                To reserve or list shortlet properties, boutique hotel suites, car rentals, or VIP escort services, users must be at least 18 years of age. All users must submit valid government-issued identification (National ID, International Passport, or Driver’s License) upon request.
              </p>
            </section>

            {/* SECTION 3 */}
            <section id="bookings" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">3. Booking & Escrow Payments</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Rentals Africa operates a secure escrow framework. Payment for bookings is collected immediately upon reservation confirmation and held securely. Payouts to hosts or vehicle providers are dispatched 24 hours after successful guest check-in or asset delivery, barring formal dispute notices.
              </p>
            </section>

            {/* SECTION 4 */}
            <section id="cancellations" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">4. Cancellations & Refunds</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm font-medium leading-relaxed">
                <li><strong>Flexible Tier:</strong> Full refund up to 48 hours prior to check-in/pickup time.</li>
                <li><strong>Moderate Tier:</strong> 50% refund up to 24 hours prior to reservation start.</li>
                <li><strong>VIP & Security Escorts:</strong> Non-refundable within 72 hours of scheduled deployment due to security logistics.</li>
              </ul>
            </section>

            {/* SECTION 5 */}
            <section id="host-terms" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">5. Host Obligations & Guarantees</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Hosts guarantee that listed shortlet apartments, car fleets, and hotel rooms accurately match advertised imagery and specifications. Listings found to be fraudulent, uninhabitable, or misrepresented will result in immediate host suspension and complete guest refund issuing.
              </p>
            </section>

            {/* SECTION 6 */}
            <section id="vip-vehicle" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">6. Vehicle & VIP Escort Services</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Vehicle hirers must hold a valid driver's license. Self-drive high-end vehicles require a security deposit hold. Armored vehicles and armed security escorts operate under strict compliance with Nigerian civil security regulations.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="liability" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">7. Limitation of Liability</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Rentals Africa functions as a marketplace connecting verified guests with independent hosts and service operators. Rentals Africa shall not be held liable for indirect, incidental, or consequential damages exceeding the total booking fee paid by the user.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="governing-law" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">8. Governing Law & Dispute Resolution</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from or in connection with these terms shall be settled primarily through binding arbitration in Lagos, Nigeria.
              </p>
            </section>

          </main>

        </div>
      </div>

    </div>
  );
}