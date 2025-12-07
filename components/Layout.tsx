import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, PieChart, Bot, Settings, Lock, Plus } from 'lucide-react';
import { View, Language, TRANSLATIONS } from '../types';

interface LayoutProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  language: Language;
  isAuthenticated: boolean;
  pin: string | null;
  onUnlock: (pin: string) => boolean;
  onAddTransactionClick: () => void;
  children: React.ReactNode;
}

const MasarifyLogo = ({ className = "w-10 h-10", light = false }: { className?: string, light?: boolean }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="100" x2="100" y2="0">
        <stop offset="0%" stopColor={light ? "#ffffff" : "#10b981"} />
        <stop offset="100%" stopColor={light ? "#e2e8f0" : "#047857"} />
      </linearGradient>
    </defs>
    {/* Abstract Wallet/Card shape */}
    <rect x="10" y="25" width="80" height="50" rx="12" fill="url(#logoGradient)" />
    {/* Growth Chart Line */}
    <path d="M25 60 L40 45 L55 55 L75 35" stroke={light ? "#10b981" : "white"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Dot */}
    <circle cx="75" cy="35" r="5" fill={light ? "#10b981" : "#fbbf24"} stroke={light ? "#10b981" : "white"} strokeWidth="2" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  setCurrentView,
  language,
  isAuthenticated,
  pin,
  onUnlock,
  onAddTransactionClick,
  children,
}) => {
  const t = TRANSLATIONS[language];
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);

  const dir = language === Language.AR ? 'rtl' : 'ltr';

  const handleUnlock = () => {
    if (onUnlock(inputPin)) {
      setError(false);
      setInputPin('');
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  // Lock Screen
  if (pin && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-emerald-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir={dir}>
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-white/20 relative z-10">
          <div className="bg-white p-5 rounded-2xl shadow-xl inline-block mb-8 transform hover:scale-105 transition-transform duration-300">
            <MasarifyLogo className="w-20 h-20" light />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">{t.locked}</h2>
          <p className="text-emerald-100/80 mb-8 text-sm font-medium tracking-wide">Masarify Premium Security</p>
          
          <input
            type="password"
            maxLength={4}
            value={inputPin}
            onChange={(e) => setInputPin(e.target.value)}
            className={`w-full text-center text-4xl tracking-[0.5em] p-4 bg-black/20 border-2 rounded-2xl mb-8 focus:outline-none focus:bg-black/30 text-white placeholder-white/20 transition-all ${error ? 'border-rose-400 shake' : 'border-white/10 focus:border-emerald-400/50'}`}
            placeholder="••••"
          />
          
          <button
            onClick={handleUnlock}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 duration-200"
          >
            {t.unlock}
          </button>
        </div>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-slate-50 transition-all" dir={dir}>
      
      {/* Top Navigation Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-50 h-16 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <MasarifyLogo className="w-6 h-6" light />
            </div>
            <div className="flex flex-col">
               <span className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">Masarify</span>
            </div>
          </div>

          {/* Desktop Navigation Items (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-100/50">
             <TopNavButton active={currentView === View.DASHBOARD} onClick={() => setCurrentView(View.DASHBOARD)} icon={<LayoutDashboard size={18} />} label={t.dashboard} />
             <TopNavButton active={currentView === View.TRANSACTIONS} onClick={() => setCurrentView(View.TRANSACTIONS)} icon={<Receipt size={18} />} label={t.transactions} />
             <TopNavButton active={currentView === View.REPORTS} onClick={() => setCurrentView(View.REPORTS)} icon={<PieChart size={18} />} label={t.reports} />
             <TopNavButton active={currentView === View.ADVISOR} onClick={() => setCurrentView(View.ADVISOR)} icon={<Bot size={18} />} label={t.advisor} highlight />
             <TopNavButton active={currentView === View.SETTINGS} onClick={() => setCurrentView(View.SETTINGS)} icon={<Settings size={18} />} label={t.settings} />
          </nav>

          {/* Spacer / Version Badge */}
          <div className="hidden md:flex items-center gap-2">
             <button 
                onClick={onAddTransactionClick}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primaryDark transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
                title={t.addTransaction}
             >
                <Plus size={20} />
             </button>
             <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">PRO</span>
          </div>
        </div>
      </header>

      {/* Content Area - Increased Top Padding from pt-24 to pt-32 to fix overlap */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 pt-32 pb-24 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 md:hidden flex justify-between px-6 py-2 pb-safe z-30 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] items-end`}>
        <MobileNavButton active={currentView === View.DASHBOARD} onClick={() => setCurrentView(View.DASHBOARD)} icon={<LayoutDashboard size={22} />} label={t.dashboard} />
        <MobileNavButton active={currentView === View.TRANSACTIONS} onClick={() => setCurrentView(View.TRANSACTIONS)} icon={<Receipt size={22} />} label={t.transactions} />
        
        {/* Central Add Button */}
        <div className="relative -top-5">
           <button 
             onClick={onAddTransactionClick}
             className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 border-4 border-slate-50 transform transition-transform active:scale-90 hover:-translate-y-1"
           >
             <Plus size={30} strokeWidth={3} />
           </button>
        </div>

        <MobileNavButton active={currentView === View.REPORTS} onClick={() => setCurrentView(View.REPORTS)} icon={<PieChart size={22} />} label={t.reports} />
        <MobileNavButton active={currentView === View.SETTINGS} onClick={() => setCurrentView(View.SETTINGS)} icon={<Settings size={22} />} label={t.settings} />
      </div>
    </div>
  );
};

const TopNavButton = ({ active, onClick, icon, label, highlight }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-bold ${
      active 
        ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' 
        : 'text-slate-500 hover:bg-white hover:text-slate-700'
    }`}
  >
    <span className={highlight && !active ? 'text-emerald-600' : ''}>{icon}</span>
    <span>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all duration-300 ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);