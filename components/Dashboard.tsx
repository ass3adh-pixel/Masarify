import React from 'react';
import { Transaction, BudgetConfig, Language, TRANSLATIONS, TransactionType, Currency, Category } from '../types';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[]; // Added categories prop
  budget: BudgetConfig;
  language: Language;
  currency: Currency;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, budget, language, currency }) => {
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

  // Filter categories that have a budget limit set (> 0) and are EXPENSE type
  const budgetCategories = categories.filter(c => c.type === TransactionType.EXPENSE && c.budgetLimit && c.budgetLimit > 0);

  const renderProgressBar = (current: number, total: number, label: string, colorOverride?: string, iconName?: string) => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    const isExceeded = current > total;
    const isWarning = percentage >= budget.alertThreshold;
    
    let colorClass = 'bg-gradient-to-r from-emerald-500 to-teal-500';
    let textClass = 'text-primary';
    
    if (colorOverride && !isExceeded && !isWarning) {
       // Use category color if provided and not in warning state
       colorClass = ''; // Inline style will handle it
    }

    if (isExceeded) { colorClass = 'bg-gradient-to-r from-rose-500 to-red-600'; textClass = 'text-danger'; }
    else if (isWarning) { colorClass = 'bg-gradient-to-r from-amber-500 to-orange-500'; textClass = 'text-warning'; }

    // @ts-ignore
    const Icon = iconName ? (LucideIcons[iconName] || LucideIcons.Circle) : null;

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 transition-transform hover:scale-[1.01] duration-300">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2">
            {Icon && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{backgroundColor: colorOverride || '#64748b'}}>
                    <Icon size={16} />
                </div>
            )}
            <div>
                <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                <span className="text-xs text-slate-400 mr-1">{currency.symbol}</span>
                {current.toLocaleString()} 
                <span className="text-xs text-slate-300 font-normal ml-1">/ {total.toLocaleString()}</span>
                </p>
            </div>
          </div>
          <span className={`font-bold ${textClass}`}>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} 
            style={{ 
                width: `${percentage}%`,
                backgroundColor: (colorOverride && !isExceeded && !isWarning) ? colorOverride : undefined
            }}
          ></div>
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
        <div className="text-sm bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-slate-600 font-medium flex items-center gap-2">
          <span>{currency.flag}</span>
          <span>{currency.code}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="relative z-10">
            <p className="text-slate-300 text-sm font-medium mb-1">{t.totalBalance}</p>
            <h2 className="text-3xl font-bold tracking-tight">{currency.symbol} {balance.toLocaleString()}</h2>
          </div>
          <Wallet className="absolute right-4 bottom-4 text-white opacity-10 w-20 h-20 -rotate-12 transition-transform group-hover:rotate-0 duration-500" />
        </div>
        
        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between group hover:border-emerald-300 transition-colors duration-300">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{t.income}</p>
            <h2 className="text-2xl font-bold text-emerald-600">+{currency.symbol} {totalIncome.toLocaleString()}</h2>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <TrendingUp className="text-emerald-500 w-6 h-6" />
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 flex items-center justify-between group hover:border-rose-300 transition-colors duration-300">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{t.expense}</p>
            <h2 className="text-2xl font-bold text-rose-600">-{currency.symbol} {totalExpense.toLocaleString()}</h2>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl group-hover:bg-rose-100 transition-colors">
            <TrendingDown className="text-rose-500 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ad Space */}
      <AdBanner />

      {/* Global Progress Bars */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">{t.budgetLimits}</h2>
        {renderProgressBar(totalExpense, budget.monthlyLimit, t.monthlyBudget)}
        {renderProgressBar(yearlyExpense, budget.yearlyLimit, t.yearlyBudget)}
      </div>
      
      {/* Category Specific Budgets */}
      {budgetCategories.length > 0 && (
          <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">{t.categoryBudgets}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgetCategories.map(cat => {
                      const catExpense = monthlyTransactions
                        .filter(t => t.categoryId === cat.id && t.type === TransactionType.EXPENSE)
                        .reduce((acc, curr) => acc + curr.amount, 0);
                      
                      return (
                          <div key={cat.id}>
                              {renderProgressBar(
                                  catExpense, 
                                  cat.budgetLimit || 0, 
                                  language === Language.EN ? cat.nameEn : cat.nameAr,
                                  cat.color,
                                  cat.icon
                                )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">{t.recentTransactions}</h2>
        {monthlyTransactions.length === 0 ? (
          <p className="text-slate-400 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">{t.noTransactions}</p>
        ) : (
          <div className="space-y-4">
            {monthlyTransactions.slice(0, 5).map(tr => (
              <div key={tr.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition-colors -mx-2">
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