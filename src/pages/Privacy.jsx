import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  KeyRound, 
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function Privacy() {
  const [activeSection, setActiveSection] = useState('data-collection');

  const sections = [
    { id: 'data-collection', title: '1. Information We Collect' },
    { id: 'how-we-use', title: '2. How We Use Your Data' },
    { id: 'identity-verification', title: '3. Identity & Background Checks' },
    { id: 'data-sharing', title: '4. Third-Party Data Sharing' },
    { id: 'security', title: '5. Data Security & Storage' },
    { id: 'cookies', title: '6. Cookies & Tracking Technologies' },
    { id: 'your-rights', title: '7. Your Privacy Rights & Access' },
    { id: 'updates', title: '8. Policy Updates & Contact' },
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
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
              <Lock className="w-4 h-4" />
              <span>Data Protection Standard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-base font-medium leading-relaxed">
              Last updated: October 2026. How Rentals Africa collects, protects, and manages personal identification data for guests, hosts, and vehicle operators.
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
                      ? 'bg-gray-900 text-white shadow-md'
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
            
            {/* PRIVACY GUARANTEE BANNER */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-start space-x-4">
              <UserCheck className="w-6 h-6 text-brand-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed font-medium">
                <strong className="font-bold text-gray-900 block mb-1">NDPR & GDPR Compliant:</strong>
                We employ bank-grade encryption protocols to safeguard your personal identity records, payment details, and reservation histories. We do not sell your personal data to third parties.
              </div>
            </div>

            {/* SECTION 1 */}
            <section id="data-collection" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                When you create an account, complete a shortlet booking, rent a car, or list an asset, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm font-medium leading-relaxed">
                <li>Personal details: Name, phone number, email address, physical address.</li>
                <li>Verification documents: Driver’s license, NIN, or passport copies.</li>
                <li>Financial details: Bank account numbers for host payouts or masked payment tokens for bookings.</li>
              </ul>
            </section>

            {/* SECTION 2 */}
            <section id="how-we-use" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Data</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Your data is used exclusively to facilitate seamless booking confirmations, process automated escrow payouts, prevent fraudulent listings, and provide 24/7 customer concierge support.
              </p>
            </section>

            {/* SECTION 3 */}
            <section id="identity-verification" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">3. Identity & Background Checks</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                For high-value shortlets, vehicle rentals, and VIP escort requests, your verification data may be securely matched against official government databases through licensed verification partners.
              </p>
            </section>

            {/* SECTION 4 */}
            <section id="data-sharing" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">4. Third-Party Data Sharing</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                We share relevant reservation information only with confirmed hosts or vehicle drivers assigned to your service. We do not sell or monetize personal records.
              </p>
            </section>

            {/* SECTION 5 */}
            <section id="security" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">5. Data Security & Storage</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                All personal identification data is stored using AES-256 encryption at rest and SSL/TLS encryption during transit. Access is strictly limited to authorized compliance personnel.
              </p>
            </section>

            {/* SECTION 6 */}
            <section id="cookies" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">6. Cookies & Tracking Technologies</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                We use cookies to maintain session states, remember your selected city preferences (Lagos/Abuja), and analyze anonymized site usage metrics to optimize performance.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="your-rights" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">7. Your Privacy Rights & Access</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                You retain full rights to request a digital copy of your data, update profile inaccuracies, or request permanent deletion of your account and associated verification files.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="updates" className="scroll-mt-28 space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">8. Policy Updates & Contact</h2>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                For questions regarding this policy or data privacy requests, contact our legal team at <span className="text-brand-primary font-bold">privacy@rentalsafrica.com</span>.
              </p>
            </section>

          </main>

        </div>
      </div>

    </div>
  );
}