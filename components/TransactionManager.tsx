import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Category, Account, Language, TRANSLATIONS, TransactionType, Currency } from '../types';
import { Search, Camera, X, Image as ImageIcon, Trash2, Filter, Edit2, AlertTriangle, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface TransactionManagerProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  language: Language;
  currency: Currency;
  
  // New props for controlling modal from outside
  showModal: boolean;
  onCloseModal: () => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  categories,
  accounts,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  language,
  currency,
  showModal,
  onCloseModal
}) => {
  const t = TRANSLATIONS[language];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [note, setNote] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRTL = language === Language.AR;

  // Filtered categories for dropdown based on selected type
  const availableCategories = categories.filter(c => c.type === type);

  // Reset category when type changes
  useEffect(() => {
    if (availableCategories.length > 0 && !categoryId) {
      setCategoryId(availableCategories[0].id);
    }
    if (!editingId && availableCategories.length > 0) {
       const isValid = availableCategories.find(c => c.id === categoryId);
       if (!isValid) setCategoryId(availableCategories[0].id);
    }
  }, [type, categories, categoryId, editingId]);

  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(TransactionType.EXPENSE);
    if(accounts.length > 0) setAccountId(accounts[0].id);
    setNote('');
    setReceiptImage(undefined);
    setEditingId(null);
    setCategoryId('');
  };

  // Watch for external modal open (Reset if new add)
  useEffect(() => {
    if (showModal && !editingId) {
       resetForm();
    }
  }, [showModal]);

  const openEditModal = (tr: Transaction) => {
    setEditingId(tr.id);
    setAmount(tr.amount.toString());
    setDate(tr.date.split('T')[0]);
    setType(tr.type);
    setCategoryId(tr.categoryId);
    setAccountId(tr.accountId);
    setNote(tr.note || '');
    setReceiptImage(tr.receiptImage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !accountId) return;

    const transactionData = {
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      categoryId,
      accountId,
      type,
      note,
      receiptImage
    };

    if (editingId) {
      onUpdateTransaction({ ...transactionData, id: editingId });
    } else {
      onAddTransaction(transactionData);
    }

    onCloseModal();
    resetForm();
  };

  const handleDeleteClick = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      onDeleteTransaction(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please use an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTransactions = transactions.filter(tr => 
    tr.note?.toLowerCase().includes(filter.toLowerCase()) || 
    tr.amount.toString().includes(filter)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const AdBanner = () => (
    <div className="w-full h-16 bg-gradient-to-r from-slate-100 to-slate-200 border-t border-b border-slate-200 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
      <span className="text-xs uppercase tracking-widest">{t.adSpace}</span>
    </div>
  );

  return (
    <div className="h-full relative pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t.transactions}</h1>
        {/* Mobile/Tablet/Desktop Top Button (Always Visible) */}
        <button 
          onClick={() => { resetForm(); if(onCloseModal) onCloseModal(); else { /* Trigger open via parent if needed? Parent controls visibility */ } }}
          className="bg-primary text-white py-2 px-4 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primaryDark transition-all active:scale-95 z-10"
        >
          <Plus size={20} />
          <span className="font-bold hidden sm:inline">{t.addTransaction}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 flex items-center gap-3 sticky top-16 z-30 lg:top-20">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder={t.search} 
          className="flex-1 outline-none text-slate-700 bg-transparent"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <AdBanner />

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center">
            <Filter size={48} className="mb-4 opacity-20" />
            {t.noTransactions}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredTransactions.map(tr => {
              const cat = categories.find(c => c.id === tr.categoryId);
              const acc = accounts.find(a => a.id === tr.accountId);
              // @ts-ignore
              const Icon = LucideIcons[cat?.icon] || LucideIcons.Circle;

              return (
                <div key={tr.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-xl shadow-md border border-slate-100 relative" style={{backgroundColor: cat?.color || '#cbd5e1'}}>
                       <Icon size={22} />
                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${tr.type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{tr.note || (language === Language.EN ? cat?.nameEn : cat?.nameAr)}</p>
                      <div className="flex gap-2 text-xs text-slate-400 mt-1">
                        <span>{new Date(tr.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                          {language === Language.EN ? acc?.nameEn : acc?.nameAr}
                        </span>
                        {tr.receiptImage && <span className="flex items-center gap-1 text-secondary"><ImageIcon size={12}/> {t.receipt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-lg ${tr.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tr.type === TransactionType.INCOME ? '+' : '-'}{currency.symbol} {tr.amount.toLocaleString()}
                    </span>
                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(tr)}
                        className="text-slate-400 hover:text-primary hover:bg-emerald-50 p-2 rounded-full transition-all"
                        title={t.edit}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(tr.id)}
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-all"
                        title={t.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center transform transition-all scale-100">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.confirmDeleteTitle}</h3>
            <p className="text-slate-500 mb-6">{t.confirmDeleteMessage}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t.cancelDelete}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-colors"
              >
                {t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showModal || editingId) && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">{editingId ? t.editTransaction : t.addTransaction}</h2>
                <button onClick={() => { onCloseModal(); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Toggle */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    onClick={() => setType(TransactionType.EXPENSE)}
                  >
                    <div className={`w-2 h-2 rounded-full ${type === TransactionType.EXPENSE ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                    {t.expense}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    onClick={() => setType(TransactionType.INCOME)}
                  >
                    <div className={`w-2 h-2 rounded-full ${type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    {t.income}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.amount} ({currency.symbol})</label>
                  <div className="relative">
                     <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-3xl font-bold text-slate-800 placeholder-slate-300 transition-all ${isRTL ? 'text-right pl-20' : 'text-left pr-20'}`}
                      placeholder="0.00"
                      dir="ltr"
                    />
                    <span 
                        className={`absolute top-1/2 -translate-y-1/2 text-slate-400 font-medium ${isRTL ? 'left-4' : 'right-4'}`}
                    >
                        {currency.code}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t.date}</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t.category}</label>
                    <div className="relative">
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                        className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors appearance-none"
                      >
                        {availableCategories.length === 0 && <option value="">No categories</option>}
                        {availableCategories.map(c => (
                          <option key={c.id} value={c.id}>{language === Language.EN ? c.nameEn : c.nameAr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.account}</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{language === Language.EN ? a.nameEn : a.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.note}</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-primary outline-none bg-slate-50 focus:bg-white transition-colors"
                    placeholder={t.note}
                  />
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.receipt}</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                  
                  {receiptImage ? (
                    <div className="relative mt-2 h-32 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setReceiptImage(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary hover:text-primary transition-all"
                    >
                      <Camera size={24} className="mb-2" />
                      <span className="text-sm font-medium">{t.camera}</span>
                    </button>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { onCloseModal(); setEditingId(null); }}
                    className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primaryDark transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                  >
                    {editingId ? <Edit2 size={18}/> : <Plus size={18}/>}
                    {editingId ? t.update : t.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};