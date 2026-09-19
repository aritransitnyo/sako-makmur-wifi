import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Wifi } from 'lucide-react';

interface AuthGateProps {
  businessName: string;
  correctPin: string;
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  businessName,
  correctPin,
  onAuthenticated,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === (correctPin || '1234')) {
      setError(false);
      onAuthenticated();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleQuickKey = (num: string) => {
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      if (next === (correctPin || '1234')) {
        setTimeout(onAuthenticated, 150);
      }
    }
  };

  const handleDeleteKey = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-xs space-y-6 text-center page-transition">
        {/* Brand Icon */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/25">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              {businessName || 'Sako Makmur WiFi'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Portal Keamanan Pengelola &amp; Investor
            </p>
          </div>
        </div>

        {/* PIN Input Box */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > idx
                      ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                      : error
                      ? 'border-rose-500 bg-rose-500/20'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium">
                PIN Salah. Silakan coba lagi. (Default: 1234)
              </p>
            )}
          </div>

          {/* Numeric Keypad for Mobile Android feel */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQuickKey(num)}
                className="h-12 rounded-2xl bg-slate-900/90 border border-slate-800 text-lg font-bold text-slate-100 active:scale-95 active:bg-slate-800 transition-all shadow-md"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 active:scale-95 transition-all"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleQuickKey('0')}
              className="h-12 rounded-2xl bg-slate-900/90 border border-slate-800 text-lg font-bold text-slate-100 active:scale-95 active:bg-slate-800 transition-all shadow-md"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteKey}
              className="h-12 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 active:scale-95 transition-all"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all mt-4"
          >
            <KeyRound className="w-4 h-4" /> Masuk ke Aplikasi
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          PIN Keamanan Default: <strong className="text-slate-400">1234</strong>
        </p>
      </div>
    </div>
  );
};
