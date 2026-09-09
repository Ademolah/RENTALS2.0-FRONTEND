import { ShieldCheck, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-gray-200 pb-6">
          <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
            Rentals HQ Platform Control
          </span>
          <h1 className="text-3xl font-extrabold text-brand-dark mt-1">Escrow & Verification Engine</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* System Health */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-brand-dark mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Escrow Vault Summary</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Held in Escrow</span>
                <span className="font-bold text-brand-dark">₦18,450,000</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span className="text-gray-500">Platform Commission (5%)</span>
                <span className="font-bold text-emerald-600">₦922,500</span>
              </div>
            </div>
          </div>

          {/* Pending Verification Audits */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-brand-dark mb-4 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-brand-primary" />
              <span>Property Photo Verification Queue</span>
            </h3>
            
            <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-brand-dark">Luxury Villa - Banana Island</div>
                <div className="text-xs text-gray-500">Submitted by Oyinmax Properties • 12 High-Res Photos</div>
              </div>

              <div className="flex space-x-2">
                <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700">
                  Approve 'R' Badge
                </button>
                <button className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100">
                  Reject
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}