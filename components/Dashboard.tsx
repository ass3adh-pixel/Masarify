import React from 'react';
import { Transaction, BudgetConfig, Language, TRANSLATIONS, TransactionType, Currency } from '../types';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  language: Language;
  currency: Currency;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, language, currency }) => {
  const t = TRANSLATIONS[language];

  // Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter(tr => {
    const d = new Date(tr.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const yearlyTransactions = transactions.filter(tr => {
    const d = new Date(tr.date);
    return d.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const yearlyExpense = yearlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = transactions.reduce((acc, curr) => {
    return curr.type === TransactionType.INCOME ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const renderProgressBar = (current: number, total: number, label: string) => {
    const percentage = Math.min((current / total) * 100, 100);
    const isExceeded = current > total;
    const isWarning = percentage >= budget.alertThreshold;
    
    let colorClass = 'bg-gradient-to-r from-primary to-teal-500';
    let textClass = 'text-primary';
    if (isExceeded) { colorClass = 'bg-gradient-to-r from-red-500 to-rose-600'; textClass = 'text-danger'; }
    else if (isWarning) { colorClass = 'bg-gradient-to-r from-amber-500 to-orange-500'; textClass = 'text-warning'; }

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              <span className="text-sm text-slate-400 mr-1">{currency.symbol}</span>
              {current.toLocaleString()} 
              <span className="text-sm text-slate-300 font-normal ml-1">/ {total.toLocaleString()}</span>
            </p>
          </div>
          <span className={`font-bold ${textClass}`}>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{t.used}: {currency.symbol} {current.toLocaleString()}</span>
          <span>{t.remaining}: {currency.symbol} {Math.max(total - current, 0).toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const AdBanner = () => (
    <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-500 my-6 shadow-inner">
      <span className="text-xs uppercase tracking-widest font-semibold">{t.adSpace}</span>
      <span className="text-[10px] opacity-70">Google Ad / Custom Ad</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">{t.dashboard}</h1>
        <div className="text-sm bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-slate-600 font-medium">
          {currency.flag} {currency.code}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium mb-1">{t.totalBalance}</p>
            <h2 className="text-3xl font-bold">{currency.symbol} {balance.toLocaleString()}</h2>
          </div>
          <Wallet className="absolute right-4 bottom-4 text-white opacity-20 w-24 h-24 -rotate-12" />
        </div>
        
        <div className="bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{t.income}</p>
            <h2 className="text-2xl font-bold text-emerald-600">+{currency.symbol} {totalIncome.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <TrendingUp className="text-emerald-500 w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-rose-50 p-6 rounded-2xl shadow-sm border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{t.expense}</p>
            <h2 className="text-2xl font-bold text-rose-600">-{currency.symbol} {totalExpense.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <TrendingDown className="text-rose-500 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ad Space */}
      <AdBanner />

      {/* Progress Bars */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">{t.budgetLimits}</h2>
        {renderProgressBar(totalExpense, budget.monthlyLimit, t.monthlyBudget)}
        {renderProgressBar(yearlyExpense, budget.yearlyLimit, t.yearlyBudget)}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">{t.recentTransactions}</h2>
        {monthlyTransactions.length === 0 ? (
          <p className="text-slate-400 text-center py-8">{t.noTransactions}</p>
        ) : (
          <div className="space-y-4">
            {monthlyTransactions.slice(0, 5).map(tr => (
              <div key={tr.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tr.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {tr.type === TransactionType.INCOME ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{tr.note || t.expense}</p>
                    <p className="text-xs text-slate-400">{new Date(tr.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-bold ${tr.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tr.type === TransactionType.INCOME ? '+' : '-'}{currency.symbol} {tr.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};