import React, { useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { executePayout } from '../api/payouts';


export default function PayoutActionCard({ booking }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState(booking.payoutStatus || booking.escrowStatus);
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize data for properties vs cars
  const isCar = !!booking.carId;
  const title = isCar 
    ? `${booking.carId?.make} ${booking.carId?.model}`
    : booking.propertyId?.title || 'Luxury Booking';
  
  const amount = booking.totalAmount || 0;
  
  // Calculate the 95% payout amount (assuming 5% platform fee)
  const netPayout = amount * 0.95;

  const handlePayoutRequest = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    
    try {
      await executePayout(booking._id);
      setPayoutStatus(isCar ? 'RELEASED' : 'RELEASED_TO_LANDLORD');
    } catch (error) {
      // Catch Paystack compliance or network errors
      setErrorMsg(error.response?.data?.message || 'Payout failed. Ensure your bank details are verified.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isReleased = payoutStatus === 'RELEASED' || payoutStatus === 'RELEASED_TO_LANDLORD';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      
      {/* Booking Details */}
      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          {isCar ? 'Vehicle Handover' : 'Guest Check-in'}
        </div>
        <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
        <div className="text-gray-500 font-medium text-sm mt-1">
          Gross: ₦{amount.toLocaleString()} <span className="mx-2">•</span> 
          Net Payout: <span className="text-gray-900 font-bold">₦{netPayout.toLocaleString()}</span>
        </div>
      </div>

      {/* Payout Action Center */}
      <div className="w-full md:w-auto">
        {isReleased ? (
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 w-full md:w-auto justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-bold text-sm">Payout Released</span>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <button 
              onClick={handlePayoutRequest}
              disabled={isProcessing}
              className="w-full md:w-auto px-6 py-3 bg-gray-900 hover:bg-brand-primary text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-70 active:scale-95"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
              ) : (
                <><ShieldCheck className="w-4 h-4 mr-2" /> Request Payout</>
              )}
            </button>
            
            {errorMsg && (
              <div className="flex items-center space-x-1 text-red-500 text-xs font-medium mt-1 bg-red-50 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}