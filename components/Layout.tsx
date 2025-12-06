import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, PieChart, Bot, Settings, Lock } from 'lucide-react';
import { View, Language, TRANSLATIONS } from '../types';

interface LayoutProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  language: Language;
  isAuthenticated: boolean;
  pin: string | null;
  onUnlock: (pin: string) => boolean;
  children: React.ReactNode;
}

const MasarifyLogo = ({ className = "w-8 h-8", light = false }: { className?: string, light?: boolean }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill={light ? "white" : "#10b981"} />
    <path d="M30 70L30 30L50 50L70 30L70 70" stroke={light ? "#10b981" : "white"} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="75" cy="25" r="5" fill="#fbbf24" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  setCurrentView,
  language,
  isAuthenticated,
  pin,
  onUnlock,
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
      <div className="min-h-screen bg-gradient-to-br from-primary to-emerald-800 flex flex-col items-center justify-center p-4" dir={dir}>
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-white/20">
          <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-6">
            <MasarifyLogo className="w-16 h-16" light />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">{t.locked}</h2>
          <p className="text-white/70 mb-8 text-sm">Masarify Budget Manager</p>
          
          <input
            type="password"
            maxLength={4}
            value={inputPin}
            onChange={(e) => setInputPin(e.target.value)}
            className={`w-full text-center text-3xl tracking-[1em] p-4 bg-white/20 border-2 rounded-2xl mb-8 focus:outline-none focus:bg-white/30 text-white placeholder-white/30 transition-all ${error ? 'border-rose-400 shake' : 'border-white/20 focus:border-white/50'}`}
            placeholder="••••"
          />
          
          <button
            onClick={handleUnlock}
            className="w-full bg-white text-primary py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg active:scale-95 duration-200"
          >
            {t.unlock}
          </button>
        </div>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64 transition-all" dir={dir}>
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 bottom-0 ${language === Language.AR ? 'right-0' : 'left-0'} w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20`}>
        <div className="p-8 flex items-center gap-3 border-b border-gray-50">
          <MasarifyLogo />
          <span className="text-2xl font-extrabold text-gray-800 tracking-tight">Masarify</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavButton active={currentView === View.DASHBOARD} onClick={() => setCurrentView(View.DASHBOARD)} icon={<LayoutDashboard size={20} />} label={t.dashboard} />
          <NavButton active={currentView === View.TRANSACTIONS} onClick={() => setCurrentView(View.TRANSACTIONS)} icon={<Receipt size={20} />} label={t.transactions} />
          <NavButton active={currentView === View.REPORTS} onClick={() => setCurrentView(View.REPORTS)} icon={<PieChart size={20} />} label={t.reports} />
          <NavButton active={currentView === View.ADVISOR} onClick={() => setCurrentView(View.ADVISOR)} icon={<Bot size={20} />} label={t.advisor} />
          <NavButton active={currentView === View.SETTINGS} onClick={() => setCurrentView(View.SETTINGS)} icon={<Settings size={20} />} label={t.settings} />
        </nav>

        <div className="p-6 text-center text-xs text-gray-400">
           v2.0.0 • Offline Mode
        </div>
      </aside>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 md:hidden flex justify-around p-3 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`}>
        <MobileNavButton active={currentView === View.DASHBOARD} onClick={() => setCurrentView(View.DASHBOARD)} icon={<LayoutDashboard size={24} />} />
        <MobileNavButton active={currentView === View.TRANSACTIONS} onClick={() => setCurrentView(View.TRANSACTIONS)} icon={<Receipt size={24} />} />
        <MobileNavButton active={currentView === View.ADVISOR} onClick={() => setCurrentView(View.ADVISOR)} icon={<div className="bg-primary p-3 rounded-full -mt-10 shadow-lg shadow-primary/30 text-white ring-4 ring-gray-50"><Bot size={24} /></div>} />
        <MobileNavButton active={currentView === View.REPORTS} onClick={() => setCurrentView(View.REPORTS)} icon={<PieChart size={24} />} />
        <MobileNavButton active={currentView === View.SETTINGS} onClick={() => setCurrentView(View.SETTINGS)} icon={<Settings size={24} />} />
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${active ? 'bg-emerald-50 text-primary font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-xl transition-colors ${active ? 'text-primary' : 'text-slate-400'}`}
  >
    {icon}
  </button>
);