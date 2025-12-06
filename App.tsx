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
import { Send, Download, Upload, Lock, AlertTriangle, Save, CheckCircle, List, Trash2, Edit2, Plus, X, Mail, Shield, FileText, Info } from 'lucide-react';
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

// Available icons for categories
const ICON_OPTIONS = [
  'Utensils', 'Car', 'ShoppingBag', 'Home', 'Film', 'Heart', 'FileText', 'Banknote', 
  'TrendingUp', 'Laptop', 'Coffee', 'Gift', 'Smartphone', 'Wifi', 'Zap', 'Droplet',
  'Book', 'Briefcase', 'CreditCard', 'DollarSign', 'Music', 'Plane', 'ShoppingCart'
];

const COLOR_OPTIONS = [
  '#e11d48', '#4f46e5', '#8b5cf6', '#059669', '#d97706', '#ec4899', '#64748b',
  '#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444', '#84cc16', '#06b6d4'
];

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        let loadedState = { ...INITIAL_STATE, ...parsed, isAuthenticated: false };
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
    checkBudgetAlerts(newTransactions);
  };

  const updateTransaction = (updatedT: Transaction) => {
    const newTransactions = state.transactions.map(t => 
      t.id === updatedT.id ? updatedT : t
    );
    setState(prev => ({ ...prev, transactions: newTransactions }));
    checkBudgetAlerts(newTransactions);
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

  const checkBudgetAlerts = (transactions: Transaction[]) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const totalExpense = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && t.type === 'EXPENSE';
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const percent = (totalExpense / state.budget.monthlyLimit) * 100;
    const t = TRANSLATIONS[state.language];

    if (percent >= 100) {
      new Notification(t.warning, { body: `You have exceeded your monthly budget!` });
    } else if (percent >= state.budget.alertThreshold) {
      new Notification(t.warning, { body: `You have used ${percent.toFixed(0)}% of your monthly budget.` });
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
    const [activeModal, setActiveModal] = useState<'none' | 'categories' | 'about' | 'privacy' | 'terms' | 'contact'>('none');

    // Category Manager State
    const [catModalMode, setCatModalMode] = useState<'list' | 'add' | 'edit'>('list');
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [newCatData, setNewCatData] = useState<Partial<Category>>({ 
      nameEn: '', nameAr: '', icon: 'Circle', color: '#10b981', type: TransactionType.EXPENSE 
    });

    const handleSave = () => {
      setState(prev => ({
        ...prev,
        budget: localBudget,
        pin: localPin
      }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (window.confirm(t.confirmImport)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.transactions && Array.isArray(data.transactions) && data.categories) {
              setState({ ...INITIAL_STATE, ...data, isAuthenticated: true });
              alert(t.importSuccess);
            } else {
              throw new Error("Invalid structure");
            }
          } catch(err) { 
            alert(t.importError); 
          }
        };
        reader.readAsText(file);
      }
      e.target.value = ''; // Reset
    };

    const handleSaveCategory = () => {
      if (!newCatData.nameEn || !newCatData.nameAr) return;
      
      const catPayload = {
        nameEn: newCatData.nameEn,
        nameAr: newCatData.nameAr,
        icon: newCatData.icon || 'Circle',
        color: newCatData.color || '#10b981',
        type: newCatData.type || TransactionType.EXPENSE
      };

      if (catModalMode === 'edit' && editingCat) {
        updateCategory({ ...editingCat, ...catPayload });
      } else {
        addCategory(catPayload);
      }
      setCatModalMode('list');
      setNewCatData({ nameEn: '', nameAr: '', icon: 'Circle', color: '#10b981', type: TransactionType.EXPENSE });
      setEditingCat(null);
    };

    const renderCategoryModal = () => (
      <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
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
                <button 
                  onClick={() => {
                    setNewCatData({ nameEn: '', nameAr: '', icon: 'Circle', color: '#10b981', type: TransactionType.EXPENSE });
                    setCatModalMode('add');
                  }}
                  className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> {t.addCategory}
                </button>
                {state.categories.map(cat => {
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
                           <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                             {cat.type === TransactionType.INCOME ? t.income : t.expense}
                           </span>
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
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2">{t.selectColor}</label>
                   <div className="flex flex-wrap gap-2">
                     {COLOR_OPTIONS.map(c => (
                       <button key={c} onClick={() => setNewCatData({...newCatData, color: c})} className={`w-8 h-8 rounded-full border-2 ${newCatData.color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{backgroundColor: c}} />
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2">{t.selectIcon}</label>
                   <div className="grid grid-cols-6 gap-2">
                     {ICON_OPTIONS.map(iconName => {
                       // @ts-ignore
                       const Icon = LucideIcons[iconName] || LucideIcons.Circle;
                       return (
                         <button key={iconName} onClick={() => setNewCatData({...newCatData, icon: iconName})} className={`p-2 rounded-xl flex items-center justify-center border ${newCatData.icon === iconName ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}>
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

    const renderStaticModal = (type: 'about' | 'privacy' | 'terms' | 'contact') => {
      let title = '', content: any = null;
      switch(type) {
        case 'about': title = t.aboutUs; content = t.aboutText; break;
        case 'privacy': title = t.privacyPolicy; content = t.privacyText; break;
        case 'terms': title = t.termsOfService; content = t.termsText; break;
        case 'contact': title = t.contactUs; break;
      }

      return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-primary p-6 text-white flex justify-between items-center">
               <h2 className="text-xl font-bold">{title}</h2>
               <button onClick={() => setActiveModal('none')}><X size={24} /></button>
             </div>
             <div className="p-6">
                {type === 'contact' ? (
                  <div className="space-y-4">
                     <p className="text-slate-600 mb-4">{t.contactText}</p>
                     <a 
                       href={`mailto:codexazi@gmail.com?subject=Masarify Support`}
                       className="block w-full bg-primary text-white text-center py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primaryDark transition-colors"
                     >
                       {t.send} {t.message}
                     </a>
                  </div>
                ) : (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
                )}
             </div>
             <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <span className="text-xs text-slate-400">Masarify v2.1.0</span>
             </div>
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-xl mx-auto space-y-6 pb-24">
        {/* Modals */}
        {activeModal === 'categories' && renderCategoryModal()}
        {['about', 'privacy', 'terms', 'contact'].includes(activeModal) && renderStaticModal(activeModal as any)}

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
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between group transform transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <List size={22} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-lg">{t.manageCategories}</h3>
              <p className="text-xs text-indigo-100">{state.categories.length} {t.category}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            {state.language === Language.AR ? <LucideIcons.ChevronLeft size={16} /> : <LucideIcons.ChevronRight size={16} />}
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
                className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primaryDark hover:to-emerald-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Save size={20} />
                {t.save}
            </button>
        </div>

        {/* Data */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-bold text-slate-700 border-b pb-2">{t.export} / {t.import}</h2>
          <div className="flex gap-4">
            <button onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "masarify_backup.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-700 font-medium transition-colors">
              <Download size={18} /> {t.export}
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors">
              <Upload size={18} /> {t.import}
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 gap-4 pt-4">
           <button onClick={() => setActiveModal('about')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary"><Info size={16}/> {t.aboutUs}</button>
           <button onClick={() => setActiveModal('contact')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary"><Mail size={16}/> {t.contactUs}</button>
           <button onClick={() => setActiveModal('privacy')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary"><Shield size={16}/> {t.privacyPolicy}</button>
           <button onClick={() => setActiveModal('terms')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary"><FileText size={16}/> {t.termsOfService}</button>
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
    >
      {currentView === View.DASHBOARD && <Dashboard transactions={state.transactions} budget={state.budget} language={state.language} currency={state.currency} />}
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
        />
      )}
      {currentView === View.REPORTS && <ReportsView />}
      {currentView === View.ADVISOR && <AdvisorView />}
      {currentView === View.SETTINGS && <SettingsView />}
    </Layout>
  );
}