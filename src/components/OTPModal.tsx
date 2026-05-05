import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OTPModalProps {
  email: string;
  onVerify: () => void;
  onClose: () => void;
}

export default function OTPModal({ email, onVerify, onClose }: OTPModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;

    setIsVerifying(true);
    setError(null);

    // Mock verification: In demo, 123456 or any 6 digits work after a delay
    await new Promise(r => setTimeout(r, 1500));

    if (code === '000000') { // Let's say 000000 is an purposeful error for demo
       setError('Invalid verification code. Please try again.');
       setIsVerifying(false);
    } else {
       onVerify();
    }
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
            <ShieldCheck className="text-indigo-500" size={32} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Verify Your Account</h2>
          <p className="text-zinc-400 text-sm mb-8">
            We've sent a 6-digit verification code to <br />
            <span className="text-zinc-200 font-medium">{email}</span>
          </p>

          <div className="flex gap-2 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 md:w-12 md:h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-xs mb-6 bg-red-400/10 py-2 px-4 rounded-lg border border-red-400/20 w-full">
              {error}
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={otp.join('').length < 6 || isVerifying}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>

          <div className="mt-8 flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Didn't receive the code?</span>
            {timer > 0 ? (
              <span className="text-zinc-400 font-medium">Resend in {timer}s</span>
            ) : (
              <button 
                onClick={handleResend}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={14} />
                Resend
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
