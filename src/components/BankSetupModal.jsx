import { useState, useEffect } from 'react';
import { X, Landmark, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios'; // Or use your custom axios instance
import { useAuth } from '../context/AuthContext';// Adjust path if needed

export default function BankSetupModal({ isOpen, onClose, onSuccess }) {
  const { token } = useAuth(); // Assuming your auth context provides the token
  
  const [banks, setBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Axios config helper
  // SURGICAL FIX: Use 'rentals_token' exactly like we did for the Car upload!
  const config = {
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('rentals_token')}` 
    }
  };

  // 1. Fetch Banks on Mount
  useEffect(() => {
    if (isOpen) {
      fetchBanks();
    }
  }, [isOpen]);

  const fetchBanks = async () => {
    setIsLoadingBanks(true);
    try {
      // Adjust URL to match your backend port/route
      const { data } = await axios.get('http://localhost:8000/api/v1/payouts/banks', config);
      setBanks(data.data.banks);
    } catch (err) {
      setError('Failed to load supported banks. Please try again later.');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // 2. Auto-Verify Account Number when 10 digits are entered
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      verifyAccount();
    } else {
      setResolvedName('');
    }
  }, [accountNumber, selectedBankCode]);

  const verifyAccount = async () => {
    setIsVerifying(true);
    setError('');
    setResolvedName('');
    
    try {
      const { data } = await axios.post(
        'http://localhost:8000/api/v1/payouts/banks/verify', 
        { accountNumber, bankCode: selectedBankCode },
        config
      );
      setResolvedName(data.data.accountDetails.account_name);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid account number or bank code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 3. Save details and generate Recipient Code
  const handleSave = async (e) => {
    e.preventDefault();
    if (!resolvedName) return;

    setIsSaving(true);
    setError('');

    const bank = banks.find(b => b.code === selectedBankCode);

    try {
      await axios.post(
        'http://localhost:8000/api/v1/payouts/banks/save', 
        { 
          accountNumber, 
          bankCode: selectedBankCode,
          bankName: bank.name,
          accountName: resolvedName
        },
        config
      );
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess(); // Trigger dashboard refresh
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to secure bank details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-900 p-2 rounded-xl text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Payout Account</h2>
              <p className="text-xs font-medium text-gray-500">Secure escrow settlement setup</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Account Verified</h3>
              <p className="text-sm text-gray-500">Your payouts are now secured via Paystack Escrow.</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Error Banner */}
              {error && (
                <div className="flex items-start space-x-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-100 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bank Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Bank</label>
                <div className="relative">
                  <select 
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    disabled={isLoadingBanks || isSaving}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none font-medium text-sm disabled:opacity-50"
                  >
                    <option value="">Choose a financial institution...</option>
                    {banks.map((bank, index) => (
                        <option key={bank.id || `${bank.code}-${index}`} value={bank.code}>
                            {bank.name}
                        </option>
                    ))}
                  </select>
                  {isLoadingBanks && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-4 top-4" />
                  )}
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Account Number</label>
                <input 
                  type="text" 
                  maxLength="10"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} // Numbers only
                  placeholder="0000000000"
                  disabled={!selectedBankCode || isSaving}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-semibold tracking-widest disabled:opacity-50"
                />
              </div>

              {/* Resolved Name Display */}
              <div className={`transition-all duration-300 overflow-hidden ${accountNumber.length === 10 ? 'h-16 opacity-100' : 'h-0 opacity-0'}`}>
                {isVerifying ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 h-12">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium">Verifying account with NIBSS...</span>
                  </div>
                ) : resolvedName ? (
                  <div className="flex items-center justify-between text-sm bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 h-12">
                    <span className="font-bold truncate pr-4">{resolvedName}</span>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  </div>
                ) : null}
              </div>

              {/* Security Badge & Submit */}
              <div className="pt-2">
                <div className="flex items-center justify-center space-x-2 text-gray-400 mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Secured by Paystack</span>
                </div>
                
                <button 
                  type="submit"
                  disabled={!resolvedName || isSaving}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSaving ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Securing Details...</>
                  ) : (
                    'Confirm & Save Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}