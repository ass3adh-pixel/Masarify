import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, View, Language, Transaction, Category, Account, BudgetConfig, Currency, TransactionType,
  DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, SUPPORTED_CURRENCIES, TRANSLATIONS 
} from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { getFinancialAdvice } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Send, Download, Upload, Lock, AlertTriangle, Save, CheckCircle, List, Trash2, Edit2, Plus, X, Mail, Shield, FileText, Info, FileSpreadsheet, ChevronRight, ChevronLeft, Loader2, HelpCircle, AlertOctagon, MessageSquare, User } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const STORAGE_KEY = 'masarify_data_v2';

const INITIAL_STATE: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  accounts: DEFAULT_ACCOUNTS,
  budget: { monthlyLimit: 5000, yearlyLimit: 60000, alertThreshold: 80 },
  language: Language.EN,
  currency: SUPPORTED_CURRENCIES[0],
  isAuthenticated: false,
  pin: null,
};

// Available icons for categories - Expanded list
const ICON_OPTIONS = [
  'Utensils', 'Car', 'ShoppingBag', 'Home', 'Film', 'Heart', 'FileText', 'Banknote', 
  'TrendingUp', 'Laptop', 'Coffee', 'Gift', 'Smartphone', 'Wifi', 'Zap', 'Droplet',
  'Book', 'Briefcase', 'CreditCard', 'DollarSign', 'Music', 'Plane', 'ShoppingCart',
  'Dumbbell', 'Gamepad2', 'GraduationCap', 'Hammer', 'Stethoscope', 'Baby', 'Dog', 
  'Bus', 'Train', 'Fuel', 'Scissors', 'Shirt', 'Watch', 'Headphones', 'Palmtree'
];

const COLOR_OPTIONS = [
  '#e11d48', '#4f46e5', '#8b5cf6', '#059669', '#d97706', '#ec4899', '#64748b',
  '#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444', '#84cc16', '#06b6d4'
];

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);

  // Lifted Modal State for Add Transaction (accessible from Layout)
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Deep merge with initial state to ensure all fields exist
        let loadedState = { ...INITIAL_STATE, ...parsed, isAuthenticated: false };
        // Ensure valid currency object
        if (typeof loadedState.currency === 'string') {
             loadedState.currency = SUPPORTED_CURRENCIES[0];
        }
        setState(loadedState);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setLoading(false);
    
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loading]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...t, id: Date.now().toString() };
    const newTransactions = [newTransaction, ...state.transactions];
    setState(prev => ({ ...prev, transactions: newTransactions }));
    checkBudgetAlerts(newTransactions, newTransaction);
  };

  const updateTransaction = (updatedT: Transaction) => {
    const newTransactions = state.transactions.map(t => 
      t.id === updatedT.id ? updatedT : t
    );
    setState(prev => ({ ...prev, transactions: newTransactions }));
    checkBudgetAlerts(newTransactions, updatedT);
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCat: Category = { ...c, id: Date.now().toString() };
    setState(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
  };

  const updateCategory = (updatedC: Category) => {
    setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === updatedC.id ? updatedC : c) }));
  };

  const deleteCategory = (id: string) => {
    // Check if category is used
    const isUsed = state.transactions.some(t => t.categoryId === id);
    if (isUsed) {
      alert(TRANSLATIONS[state.language].deleteCategoryError);
      return;
    }
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };

  const checkBudgetAlerts = (transactions: Transaction[], newTransaction?: Transaction) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const t = TRANSLATIONS[state.language];
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // 1. Check Global Monthly Limit
    const totalExpense = transactions
      .filter(tr => {
        const d = new Date(tr.date);
        return d.getMonth() === currentMonth && tr.type === 'EXPENSE';
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const globalPercent = (totalExpense / state.budget.monthlyLimit) * 100;

    if (globalPercent >= 100) {
      new Notification(t.warning, { body: `Global: You have exceeded your monthly budget!` });
    } else if (globalPercent >= state.budget.alertThreshold) {
      new Notification(t.warning, { body: `Global: You have used ${globalPercent.toFixed(0)}% of your monthly budget.` });
    }

    // 2. Check Specific Category Limit (if new transaction is expense and category has limit)
    if (newTransaction && newTransaction.type === TransactionType.EXPENSE) {
        const category = state.categories.find(c => c.id === newTransaction.categoryId);
        if (category && category.budgetLimit && category.budgetLimit > 0) {
            const catExpense = transactions
                .filter(tr => {
                    const d = new Date(tr.date);
                    return d.getMonth() === currentMonth && tr.type === 'EXPENSE' && tr.categoryId === category.id;
                })
                .reduce((acc, curr) => acc + curr.amount, 0);
            
            const catPercent = (catExpense / category.budgetLimit) * 100;
            const catName = state.language === Language.EN ? category.nameEn : category.nameAr;

            if (catPercent >= 100) {
                new Notification(t.warning, { body: `${catName}: You have exceeded the category budget!` });
            } else if (catPercent >= state.budget.alertThreshold) {
                new Notification(t.warning, { body: `${catName}: You have used ${catPercent.toFixed(0)}% of the category budget.` });
            }
        }
    }
  };

  // --- Views ---

  const AdvisorView = () => {
    const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
      if (!input.trim()) return;
      const userMsg = input;
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setInput('');
      setThinking(true);

      const response = await getFinancialAdvice(
        userMsg, 
        state.transactions, 
        state.categories, 
        state.language, 
        state.currency.code
      );

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setThinking(false);
    };

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              <p>{TRANSLATIONS[state.language].askAdvisor}</p>
              <button 
                onClick={() => setInput(TRANSLATIONS[state.language].advisorPrompt)}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Try: "{TRANSLATIONS[state.language].advisorPrompt}"
              </button>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                 <div className="prose prose-sm max-w-none whitespace-pre-wrap font-medium">
                    {m.text}
                 </div>
              </div>
            </div>
          ))}
          {thinking && <div className="text-slate-400 text-sm animate-pulse p-2">Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-slate-100 flex gap-2 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={TRANSLATIONS[state.language].askAdvisor}
            className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-primary outline-none"
          />
          <button onClick={handleSend} disabled={thinking} className="bg-primary text-white p-3 rounded-xl hover:bg-primaryDark disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
            <Send size={20} />
          </button>
        </div>
      </div>
    );
  };

  const ReportsView = () => {
    const expenseData = state.categories.map(cat => {
      const value = state.transactions
        .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: state.language === Language.EN ? cat.nameEn : cat.nameAr,
        value,
        color: cat.color
      };
    }).filter(d => d.value > 0);

    return (
      <div className="space-y-6 animate-in fade-in">
         <h1 className="text-2xl font-bold text-slate-800">{TRANSLATIONS[state.language].reports}</h1>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px] flex flex-col">
             <h3 className="text-lg font-bold mb-6 text-slate-700 border-b pb-2">{TRANSLATIONS[state.language].expense} ({TRANSLATIONS[state.language].category})</h3>
             <div className="flex-1">
               <ResponsiveContainer width="100%" height={250}>
                 <PieChart>
                   <Pie
                     data={expenseData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {expenseData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     itemStyle={{ color: '#1e293b' }}
                     formatter={(value: number) => `${state.currency.symbol} ${value.toLocaleString()}`}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="flex flex-wrap gap-2 justify-center mt-4">
                {expenseData.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg text-xs font-medium text-slate-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: e.color}}></div>
                    <span>{e.name}</span>
                  </div>
                ))}
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px]">
             <h3 className="text-lg font-bold mb-6 text-slate-700 border-b pb-2">{TRANSLATIONS[state.language].analysis}</h3>
             <ResponsiveContainer width="100%" height={280}>
                <BarChart data={expenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" fontSize={12} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                   <YAxis fontSize={12} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                   <Tooltip 
                     cursor={{fill: '#f1f5f9'}}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     formatter={(value: number) => `${state.currency.symbol} ${value.toLocaleString()}`}
                   />
                   <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>
    );
  };

  const SettingsView = () => {
    const t = TRANSLATIONS[state.language];
    const isCurrencyLocked = state.transactions.length > 0;
    
    // State for Settings
    const [localBudget, setLocalBudget] = useState(state.budget);
    const [localPin, setLocalPin] = useState(state.pin);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
    const [activeModal, setActiveModal] = useState<'none' | 'categories' | 'about' | 'privacy' | 'terms' | 'contact' | 'reset'>('none');
    
    // Restore Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Category Manager State
    const [catModalMode, setCatModalMode] = useState<'list' | 'add' | 'edit'>('list');
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [newCatData, setNewCatData] = useState<Partial<Category>>({ 
      nameEn: '', nameAr: '', icon: 'Circle', color: '#10b981', type: TransactionType.EXPENSE, budgetLimit: 0 
    });

    // Reset Confirm
    const [deleteKeyword, setDeleteKeyword] = useState('');

    const handleSave = () => {
      setState(prev => ({
        ...prev,
        budget: localBudget,
        pin: localPin
      }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const handleRestoreClick = () => {
      setShowRestoreModal(true);
    };

    const handleResetData = () => {
      // Use trim() to ignore accidental spaces
      if (deleteKeyword.trim() === 'DELETE') {
        localStorage.clear();
        // Use href='/'; to properly reset the app state without 404 errors on some hosts
        window.location.href = '/';
      }
    };

    const performImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsRestoring(true);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          // Validation
          if (data.transactions && Array.isArray(data.transactions) && data.categories) {
            
            // Construct new state
            const newState = { 
              ...INITIAL_STATE, 
              ...data, 
              isAuthenticated: true 
            };

            // Clear existing data to be safe
            localStorage.clear();

            // Force save to localStorage immediately
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            
            // Brief delay for UX then reload
            setTimeout(() => {
              alert(t.importSuccess);
              window.location.href = '/'; // Safer reload
            }, 1000);
            
          } else {
            throw new Error("Invalid structure");
          }
        } catch(err) { 
          console.error(err);
          alert(t.importError); 
          setIsRestoring(false);
          setShowRestoreModal(false);
        }
      };
      
      reader.onerror = () => {
        alert(t.importError);
        setIsRestoring(false);
        setShowRestoreModal(false);
      }

      reader.readAsText(file);
      
      // Reset input
      e.target.value = ''; 
    };

    const handleExportExcel = () => {
      // Create CSV content with BOM for Arabic support
      const headers = ['Date', 'Amount', 'Type', 'Category', 'Account', 'Note'];
      const rows = state.transactions.map(t => {
        const cat = state.categories.find(c => c.id === t.categoryId);
        const acc = state.accounts.find(a => a.id === t.accountId);
        const catName = state.language === Language.EN ? cat?.nameEn : cat?.nameAr;
        const accName = state.language === Language.EN ? acc?.nameEn : acc?.nameAr;
        // Escape commas in note
        const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
        
        return [
          t.date.split('T')[0],
          t.amount,
          t.type,
          catName || 'Unknown',
          accName || 'Unknown',
          note
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `masarify_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleSaveCategory = () => {
      if (!newCatData.nameEn || !newCatData.nameAr) return;
      
      const catPayload = {
        nameEn: newCatData.nameEn,
        nameAr: newCatData.nameAr,
        icon: newCatData.icon || 'Circle',
        color: newCatData.color || '#10b981',
        type: newCatData.type || TransactionType.EXPENSE,
        budgetLimit: newCatData.budgetLimit || 0
      };

      if (catModalMode === 'edit' && editingCat) {
        updateCategory({ ...editingCat, ...catPayload });
      } else {
        addCategory(catPayload);
      }
      setCatModalMode('list');
      setNewCatData({ nameEn: '', nameAr: '', icon: 'Circle', color: '#10b981', type: TransactionType.EXPENSE, budgetLimit: 0 });
      setEditingCat(null);
    };

    const remainingBudget = state.budget.monthlyLimit - state.categories
        .filter(c => c.type === TransactionType.EXPENSE && c.id !== editingCat?.id)
        .reduce((sum, c) => sum + (c.budgetLimit || 0), 0);

    const renderCategoryModal = () => (
      <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">
              {catModalMode === 'list' ? t.manageCategories : (catModalMode === 'add' ? t.addCategory : t.editCategory)}
            </h2>
            <button onClick={() => {
              if (catModalMode === 'list') setActiveModal('none');
              else setCatModalMode('list');
            }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {catModalMode === 'list' ? (
              <div className="space-y-3">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Monthly Budget Calculator</p>
                        <p className="text-lg font-bold text-emerald-800">{state.currency.symbol} {state.budget.monthlyLimit.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Unallocated</p>
                        <p className="text-lg font-bold text-emerald-800">{state.currency.symbol} {remainingBudget.toLocaleString()}</p>
                    </div>
                </div>

                <button 
                  onClick={() => {
                    setNewCatData({ nameEn: '', nameAr: '', icon: 'Circle', color: '#10b981', type: TransactionType.EXPENSE, budgetLimit: 0 });
                    setCatModalMode('add');
                  }}
                  className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> {t.addCategory}
                </button>
                {state.categories.map(cat => {
                  // FIXED: Used cat.icon instead of undefined iconName
                  // @ts-ignore
                  const Icon = LucideIcons[cat.icon] || LucideIcons.Circle;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{backgroundColor: cat.color}}>
                          <Icon size={18} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800">{state.language === Language.EN ? cat.nameEn : cat.nameAr}</p>
                           <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {cat.type === TransactionType.INCOME ? t.income : t.expense}
                            </span>
                            {cat.budgetLimit && cat.budgetLimit > 0 && (
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    Limit: {cat.budgetLimit}
                                </span>
                            )}
                           </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => {
                          setEditingCat(cat);
                          setNewCatData(cat);
                          setCatModalMode('edit');
                        }} className="p-2 text-slate-400 hover:text-primary hover:bg-emerald-50 rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                 {/* Type Selector */}
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setNewCatData({...newCatData, type: TransactionType.EXPENSE})} className={`flex-1 py-2 rounded-lg text-sm font-bold ${newCatData.type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-rose-500' : 'text-slate-500'}`}>{t.expense}</button>
                    <button onClick={() => setNewCatData({...newCatData, type: TransactionType.INCOME})} className={`flex-1 py-2 rounded-lg text-sm font-bold ${newCatData.type === TransactionType.INCOME ? 'bg-white shadow-sm text-emerald-500' : 'text-slate-500'}`}>{t.income}</button>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">{t.categoryNameEn}</label>
                   <input value={newCatData.nameEn} onChange={e => setNewCatData({...newCatData, nameEn: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-primary" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">{t.categoryNameAr}</label>
                   <input value={newCatData.nameAr} onChange={e => setNewCatData({...newCatData, nameAr: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-right" dir="rtl" />
                 </div>
                 
                 {newCatData.type === TransactionType.EXPENSE && (
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-500">{t.categoryLimit} ({state.currency.symbol})</label>
                            <span className="text-[10px] text-emerald-600 font-bold">Avail: {remainingBudget + (editingCat?.budgetLimit || 0)}</span>
                        </div>
                        <input 
                            type="number" 
                            value={newCatData.budgetLimit || ''} 
                            onChange={e => setNewCatData({...newCatData, budgetLimit: parseFloat(e.target.value)})} 
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-primary" 
                            placeholder="0 (Unlimited)"
                            max={remainingBudget + (editingCat?.budgetLimit || 0)}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Leave 0 for no limit on this category.</p>
                     </div>
                 )}

                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2">{t.selectColor}</label>
                   <div className="flex flex-wrap gap-2 items-center">
                     {COLOR_OPTIONS.map(c => (
                       <button 
                         key={c} 
                         onClick={() => setNewCatData({...newCatData, color: c})} 
                         className={`w-8 h-8 rounded-full border-2 transition-transform ${newCatData.color === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`} 
                         style={{backgroundColor: c}} 
                       />
                     ))}
                     
                     {/* Custom Color Input */}
                     <label className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform overflow-hidden ${!COLOR_OPTIONS.includes(newCatData.color || '') ? 'border-slate-800 scale-110 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100 hover:scale-105'}`} style={{ background: !COLOR_OPTIONS.includes(newCatData.color || '') ? newCatData.color : 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #00FF00 120deg, #0000FF 240deg, #FF0000 360deg)' }}>
                        <input 
                            type="color" 
                            value={newCatData.color}
                            onChange={(e) => setNewCatData({...newCatData, color: e.target.value})}
                            className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                        />
                        <Plus size={14} className={`text-white drop-shadow-md ${!COLOR_OPTIONS.includes(newCatData.color || '') ? 'hidden' : 'block'}`} />
                     </label>
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2">{t.selectIcon}</label>
                   <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                     {ICON_OPTIONS.map(iconName => {
                       // @ts-ignore
                       const Icon = LucideIcons[iconName] || LucideIcons.Circle;
                       return (
                         <button key={iconName} onClick={() => setNewCatData({...newCatData, icon: iconName})} className={`p-2 rounded-xl flex items-center justify-center border transition-all ${newCatData.icon === iconName ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 hover:scale-105'}`}>
                           <Icon size={20} />
                         </button>
                       );
                     })}
                   </div>
                 </div>

                 <button onClick={handleSaveCategory} className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4 shadow-lg shadow-primary/30">
                   {t.save}
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    const renderStaticModal = (type: 'about' | 'privacy' | 'terms' | 'contact' | 'reset') => {
      let title = '', content: any = null;
      switch(type) {
        case 'about': title = t.aboutUs; content = t.aboutText; break;
        case 'privacy': title = t.privacyPolicy; content = t.privacyText; break;
        case 'terms': title = t.termsOfService; content = t.termsText; break;
        case 'contact': title = t.contactUs; break;
        case 'reset': title = t.dangerZone; break;
      }

      if (type === 'reset') {
         return (
            <div className="fixed inset-0 bg-red-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in border-4 border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 animate-pulse">
                        <AlertOctagon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{t.resetConfirmTitle}</h3>
                    <p className="text-slate-500 mb-6 text-sm leading-relaxed whitespace-pre-line">{t.resetConfirmMessage}</p>
                    
                    <input 
                        type="text" 
                        placeholder={t.typeDelete} 
                        value={deleteKeyword}
                        onChange={(e) => setDeleteKeyword(e.target.value.toUpperCase())} // FORCE UPPERCASE
                        className="w-full p-3 border-2 border-red-200 rounded-xl mb-4 text-center font-bold text-red-600 focus:border-red-500 outline-none uppercase tracking-widest"
                    />

                    <div className="flex gap-3">
                        <button onClick={() => { setActiveModal('none'); setDeleteKeyword(''); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                            {t.cancel}
                        </button>
                        <button 
                            onClick={handleResetData}
                            // Allow space at end for mobile keyboards
                            disabled={deleteKeyword.trim() !== 'DELETE'}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            RESET
                        </button>
                    </div>
                </div>
            </div>
         )
      }

      return (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="bg-gradient-to-r from-primary to-teal-600 p-6 text-white flex justify-between items-center sticky top-0 z-10">
               <h2 className="text-xl font-bold">{title}</h2>
               <button onClick={() => setActiveModal('none')}><X size={24} /></button>
             </div>
             <div className="p-6">
                {type === 'contact' ? (
                  <div className="space-y-6">
                     <p className="text-slate-600 leading-relaxed text-center">{t.contactText}</p>
                     
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                       <div className="text-center mb-4">
                           <MessageSquare size={32} className="mx-auto text-primary mb-2" />
                           <h3 className="font-bold text-slate-800">Support Ticket</h3>
                           <p className="text-xs text-slate-400">Secure & Confidential</p>
                       </div>
                       
                       <form 
                         name="contact" 
                         method="POST" 
                         data-netlify="true" 
                         className="space-y-3 text-left"
                         onSubmit={(e) => {
                             e.preventDefault();
                             const formData = new FormData(e.target as HTMLFormElement);
                             fetch('/', {
                                 method: 'POST',
                                 headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                 body: new URLSearchParams(formData as any).toString()
                             }).then(() => { alert(t.savedSuccess); setActiveModal('none'); }).catch(error => alert(error));
                         }}
                       >
                           <input type="hidden" name="form-name" value="contact" />
                           
                           <div className="relative">
                               <User size={16} className="absolute top-3.5 left-3 text-slate-400" />
                               <input type="text" name="name" placeholder="Name" className="w-full p-3 pl-10 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm bg-white" />
                           </div>

                           <div className="relative">
                               <Mail size={16} className="absolute top-3.5 left-3 text-slate-400" />
                               <input type="email" name="email" required placeholder="Email (for reply)" className="w-full p-3 pl-10 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm bg-white" />
                           </div>

                           <textarea name="message" required placeholder={t.message} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm min-h-[120px] bg-white"></textarea>
                           
                           <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primaryDark transition-colors flex items-center justify-center gap-2">
                               <Send size={18} /> {t.send}
                           </button>
                       </form>
                     </div>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
                  </div>
                )}
             </div>
             <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <span className="text-xs text-slate-400">Masarify v2.1.0 • Professional Edition</span>
             </div>
          </div>
        </div>
      );
    };

    const InfoRow = ({ icon: Icon, label, onClick, danger = false }: any) => (
      <button onClick={onClick} className={`w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors group ${danger ? 'text-red-600 hover:bg-red-50' : ''}`}>
         <div className="flex items-center gap-3 font-medium text-inherit">
            <Icon size={20} className={`transition-colors ${danger ? 'text-red-400 group-hover:text-red-600' : 'text-slate-400 group-hover:text-primary'}`} />
            <span>{label}</span>
         </div>
         {state.language === Language.AR ? <ChevronLeft size={16} className={danger ? "text-red-300" : "text-slate-300"}/> : <ChevronRight size={16} className={danger ? "text-red-300" : "text-slate-300"}/>}
      </button>
    );

    return (
      <div className="max-w-xl mx-auto space-y-6 pb-24">
        {/* Hidden Input for Restore - Moved outside modal to prevent unmounting issues */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={performImport} 
        />

        {/* Modals */}
        {activeModal === 'categories' && renderCategoryModal()}
        {['about', 'privacy', 'terms', 'contact', 'reset'].includes(activeModal) && renderStaticModal(activeModal as any)}
        
        {/* Restore Warning Modal */}
        {showRestoreModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
                {isRestoring ? (
                  <div className="py-8 flex flex-col items-center">
                     <Loader2 size={48} className="text-primary animate-spin mb-4" />
                     <p className="font-bold text-slate-700">Restoring Data...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Overwrite Data?</h3>
                    <p className="text-slate-500 mb-6 text-sm leading-relaxed whitespace-pre-line">{t.confirmImport}</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowRestoreModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                            {t.cancel}
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30">
                            Yes, Restore
                        </button>
                    </div>
                  </>
                )}
             </div>
          </div>
        )}

        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">{t.settings}</h1>
        </div>

        {/* Success Message */}
        {saveStatus === 'success' && (
            <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <CheckCircle size={20} className="text-emerald-600" />
                <span className="font-bold">{t.savedSuccess}</span>
            </div>
        )}
        
        {/* Category Management Button - Highlighted */}
        <button 
          onClick={() => setActiveModal('categories')}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200/50 flex items-center justify-between group transform transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <List size={24} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-lg">{t.manageCategories}</h3>
              <p className="text-xs text-indigo-100 opacity-90">{state.categories.length} {t.category}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            {state.language === Language.AR ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </div>
        </button>

        {/* Language */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">{t.language}</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setState(p => ({ ...p, language: Language.EN }))}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${state.language === Language.EN ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              English
            </button>
            <button 
              onClick={() => setState(p => ({ ...p, language: Language.AR }))}
              className={`flex-1 py-3 rounded-xl border font-medium transition-all ${state.language === Language.AR ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 relative">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-slate-700">{t.currency}</h2>
            {isCurrencyLocked && <Lock size={16} className="text-slate-400" />}
          </div>
          
          {isCurrencyLocked && (
            <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5" />
              {t.changeCurrencyError}
            </div>
          )}

          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${isCurrencyLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            {SUPPORTED_CURRENCIES.map(curr => (
               <button
                 key={curr.code}
                 onClick={() => {
                   if (!isCurrencyLocked) setState(prev => ({ ...prev, currency: curr }));
                 }}
                 className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${state.currency.code === curr.code ? 'border-primary bg-emerald-50 text-primary ring-1 ring-primary' : 'border-slate-200 hover:border-primary/50'}`}
               >
                 <span className="text-2xl">{curr.flag}</span>
                 <span className="text-xs font-bold">{curr.code}</span>
                 <span className="text-[10px] text-slate-500">{curr.symbol}</span>
               </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">{t.budgetLimits}</h2>
          <div>
            <label className="text-sm text-slate-500 font-medium">{t.monthlyLimit} ({state.currency.symbol})</label>
            <input 
              type="number" 
              value={localBudget.monthlyLimit}
              onChange={(e) => setLocalBudget({...localBudget, monthlyLimit: Number(e.target.value)})}
              className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 font-medium">{t.yearlyLimit} ({state.currency.symbol})</label>
            <input 
              type="number" 
              value={localBudget.yearlyLimit}
              onChange={(e) => setLocalBudget({...localBudget, yearlyLimit: Number(e.target.value)})}
              className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 font-medium flex justify-between">
              <span>{t.threshold}</span>
              <span className="text-primary font-bold">{localBudget.alertThreshold}%</span>
            </label>
            <input 
              type="range" min="10" max="100"
              value={localBudget.alertThreshold}
              onChange={(e) => setLocalBudget({...localBudget, alertThreshold: Number(e.target.value)})}
              className="w-full mt-2 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">{t.security}</h2>
          <div>
            <label className="text-sm text-slate-500 font-medium">{t.setPin} (4 digits)</label>
            <input 
              type="text" 
              maxLength={4}
              placeholder="••••"
              value={localPin || ''}
              onChange={(e) => setLocalPin(e.target.value || null)}
              className="w-full p-3 border border-slate-200 rounded-xl mt-1 tracking-[0.5em] text-center font-bold text-lg focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-6 z-10">
            <button 
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Save size={20} />
                {t.save}
            </button>
        </div>

        {/* Data & Backup */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">Backup & Restore</h2>
          
          <div className="flex flex-col gap-3">
             <div className="grid grid-cols-2 gap-3">
                {/* JSON Export */}
                <button onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `masarify_backup_${new Date().toISOString().slice(0,10)}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                }} className="flex flex-col items-center justify-center gap-1 py-4 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200">
                  <Download size={20} /> 
                  <span className="text-xs font-bold">{t.export}</span>
                </button>

                {/* Excel Export */}
                <button onClick={handleExportExcel} className="flex flex-col items-center justify-center gap-1 py-4 bg-green-50 rounded-xl hover:bg-green-100 text-green-700 transition-colors border border-green-200">
                  <FileSpreadsheet size={20} /> 
                  <span className="text-xs font-bold">{t.exportExcel}</span>
                </button>
             </div>

             {/* Restore Button */}
             <button onClick={handleRestoreClick} className="flex items-center justify-center gap-2 py-3 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-700 font-bold transition-colors border border-blue-200 mt-1">
                <Upload size={18} /> {t.import}
             </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <h2 className="font-bold text-slate-700 p-6 pb-2 border-b border-slate-50">Support</h2>
           <div>
              <InfoRow icon={Mail} label={t.contactUs} onClick={() => setActiveModal('contact')} />
              <InfoRow icon={HelpCircle} label="Help & FAQ" onClick={() => alert("Coming Soon!")} />
           </div>
        </div>

        {/* Legal & Info Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <h2 className="font-bold text-slate-700 p-6 pb-2 border-b border-slate-50">Legal & Information</h2>
           <div>
              <InfoRow icon={Info} label={t.aboutUs} onClick={() => setActiveModal('about')} />
              <InfoRow icon={Shield} label={t.privacyPolicy} onClick={() => setActiveModal('privacy')} />
              <InfoRow icon={FileText} label={t.termsOfService} onClick={() => setActiveModal('terms')} />
           </div>
        </div>

        {/* DANGER ZONE */}
        <div className="bg-red-50 rounded-2xl shadow-sm border border-red-100 overflow-hidden">
           <h2 className="font-bold text-red-700 p-6 pb-2 border-b border-red-100 flex items-center gap-2">
             <AlertOctagon size={18} />
             {t.dangerZone}
           </h2>
           <div>
              <InfoRow icon={Trash2} label={t.resetData} onClick={() => setActiveModal('reset')} danger />
           </div>
        </div>
        
        {/* Ad Space */}
        <div className="w-full h-20 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-slate-500 shadow-inner">
           <span className="text-xs uppercase tracking-widest font-semibold">{t.adSpace}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-primary font-bold animate-pulse">Masarify...</div>;

  return (
    <Layout
      currentView={currentView}
      setCurrentView={setCurrentView}
      language={state.language}
      isAuthenticated={state.isAuthenticated}
      pin={state.pin}
      onUnlock={(inputPin) => {
        if (inputPin === state.pin) {
          setState(prev => ({ ...prev, isAuthenticated: true }));
          return true;
        }
        return false;
      }}
      onAddTransactionClick={() => {
        // Switch to Transactions view and Open Modal
        // setCurrentView(View.TRANSACTIONS);
        // We will control modal via state lifted here
        setShowTransactionModal(true);
      }}
    >
      {currentView === View.DASHBOARD && <Dashboard transactions={state.transactions} categories={state.categories} budget={state.budget} language={state.language} currency={state.currency} />}
      {currentView === View.TRANSACTIONS && (
        <TransactionManager 
          transactions={state.transactions} 
          categories={state.categories} 
          accounts={state.accounts} 
          language={state.language}
          currency={state.currency}
          onAddTransaction={addTransaction}
          onUpdateTransaction={updateTransaction}
          onDeleteTransaction={deleteTransaction}
          showModal={showTransactionModal}
          onCloseModal={() => setShowTransactionModal(false)}
        />
      )}
      {currentView === View.REPORTS && <ReportsView />}
      {currentView === View.ADVISOR && <AdvisorView />}
      {currentView === View.SETTINGS && <SettingsView />}

      {/* Global Transaction Modal (if not in Transactions view, we render it over) */}
      {currentView !== View.TRANSACTIONS && showTransactionModal && (
        <div className="fixed inset-0 z-[100]">
             <TransactionManager 
                transactions={state.transactions} 
                categories={state.categories} 
                accounts={state.accounts} 
                language={state.language}
                currency={state.currency}
                onAddTransaction={addTransaction}
                onUpdateTransaction={updateTransaction}
                onDeleteTransaction={deleteTransaction}
                showModal={showTransactionModal}
                onCloseModal={() => setShowTransactionModal(false)}
            />
        </div>
      )}
    </Layout>
  );
}