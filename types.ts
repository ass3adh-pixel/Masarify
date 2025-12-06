// Enums
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Language {
  EN = 'en',
  AR = 'ar',
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  REPORTS = 'REPORTS',
  ADVISOR = 'ADVISOR',
  SETTINGS = 'SETTINGS',
}

// Interfaces
export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO String
  categoryId: string;
  accountId: string;
  note?: string;
  type: TransactionType;
  receiptImage?: string; // Base64
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
  type: TransactionType; // Added to filter dropdowns
}

export interface Account {
  id: string;
  nameEn: string;
  nameAr: string;
  type: string;
}

export interface Currency {
  code: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
  flag: string;
}

export interface BudgetConfig {
  monthlyLimit: number;
  yearlyLimit: number;
  alertThreshold: number; // Percentage (0-100)
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budget: BudgetConfig;
  language: Language;
  currency: Currency;
  isAuthenticated: boolean;
  pin: string | null;
}

// Supported Currencies
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'SAR', symbol: '﷼', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي', flag: '🇸🇦' },
  { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameAr: 'دولار أمريكي', flag: '🇺🇸' },
  { code: 'AED', symbol: 'د.إ', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي', flag: '🇦🇪' },
  { code: 'KWD', symbol: 'د.ك', nameEn: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', flag: '🇰🇼' },
  { code: 'QAR', symbol: 'ر.ق', nameEn: 'Qatari Riyal', nameAr: 'ريال قطري', flag: '🇶🇦' },
  { code: 'EGP', symbol: '£', nameEn: 'Egyptian Pound', nameAr: 'جنيه مصري', flag: '🇪🇬' },
  { code: 'JOD', symbol: 'د.ا', nameEn: 'Jordanian Dinar', nameAr: 'دينار أردني', flag: '🇯🇴' },
  { code: 'EUR', symbol: '€', nameEn: 'Euro', nameAr: 'يورو', flag: '🇪🇺' },
];

// Translations
export const TRANSLATIONS = {
  [Language.EN]: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    reports: 'Reports',
    advisor: 'Smart Advisor',
    settings: 'Settings',
    totalBalance: 'Total Balance',
    monthlyBudget: 'Monthly Budget',
    yearlyBudget: 'Yearly Budget',
    remaining: 'Remaining',
    used: 'Used',
    recentTransactions: 'Recent Transactions',
    addTransaction: 'Add Transaction',
    editTransaction: 'Edit Transaction',
    amount: 'Amount',
    category: 'Category',
    account: 'Account',
    date: 'Date',
    note: 'Note',
    save: 'Save Changes',
    savedSuccess: 'Settings saved successfully!',
    update: 'Update',
    cancel: 'Cancel',
    income: 'Income',
    expense: 'Expense',
    analysis: 'Spending Analysis',
    security: 'Security',
    setPin: 'Set PIN',
    enterPin: 'Enter PIN',
    locked: 'App Locked',
    unlock: 'Unlock',
    export: 'Export Data',
    import: 'Import Data',
    language: 'Language',
    currency: 'Currency',
    changeCurrencyError: 'Cannot change currency while transactions exist. Please delete all transactions first.',
    budgetLimits: 'Budget Limits',
    monthlyLimit: 'Monthly Limit',
    yearlyLimit: 'Yearly Limit',
    threshold: 'Alert Threshold (%)',
    warning: 'Warning',
    critical: 'Critical',
    healthy: 'Healthy',
    receipt: 'Receipt',
    camera: 'Camera',
    noTransactions: 'No transactions found.',
    askAdvisor: 'Ask the AI Advisor...',
    advisorPrompt: 'Analyze my spending habits and give me advice.',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search...',
    allCategories: 'All Categories',
    allAccounts: 'All Accounts',
    adSpace: 'Advertisement Space',
    confirmDeleteTitle: 'Delete Transaction?',
    confirmDeleteMessage: 'Are you sure you want to permanently delete this transaction? This action cannot be undone.',
    confirmImport: 'WARNING: Importing a backup will PERMANENTLY REPLACE all current data. This action cannot be undone.\n\nAre you sure you want to proceed?',
    importSuccess: 'Data restored successfully.',
    importError: 'Failed to restore data. Invalid file format.',
    manageCategories: 'Manage Categories',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    deleteCategoryError: 'Cannot delete this category because it has linked transactions. Please delete the transactions first.',
    categoryNameEn: 'Name (English)',
    categoryNameAr: 'Name (Arabic)',
    selectIcon: 'Select Icon',
    selectColor: 'Select Color',
    aboutUs: 'About Us',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    contactUs: 'Contact Us',
    message: 'Message',
    send: 'Send',
    aboutText: 'Masarify is your personal intelligent budget manager, designed to work completely offline for maximum privacy.',
    privacyText: 'We value your privacy. All your financial data is stored locally on your device. We do not collect, store, or share your personal data with any cloud servers. The AI features interact with the API anonymously without storing personal identifiers.',
    termsText: 'By using this app, you agree that you are responsible for your own data. The developer is not liable for data loss due to device failure or clearing local storage. Please backup your data regularly.',
    contactText: 'Have questions? Send us an email.',
    subject: 'Subject',
    deleteConfirm: 'Yes, Delete',
    cancelDelete: 'No, Keep it',
  },
  [Language.AR]: {
    dashboard: 'لوحة التحكم',
    transactions: 'المعاملات',
    reports: 'التقارير',
    advisor: 'المستشار الذكي',
    settings: 'الإعدادات',
    totalBalance: 'الرصيد الكلي',
    monthlyBudget: 'الميزانية الشهرية',
    yearlyBudget: 'الميزانية السنوية',
    remaining: 'المتبقي',
    used: 'المستخدم',
    recentTransactions: 'أحدث المعاملات',
    addTransaction: 'إضافة معاملة',
    editTransaction: 'تعديل المعاملة',
    amount: 'المبلغ',
    category: 'التصنيف',
    account: 'الحساب',
    date: 'التاريخ',
    note: 'ملاحظة',
    save: 'حفظ التغييرات',
    savedSuccess: 'تم حفظ الإعدادات بنجاح!',
    update: 'تحديث',
    cancel: 'إلغاء',
    income: 'دخل',
    expense: 'مصروف',
    analysis: 'تحليل الإنفاق',
    security: 'الأمان',
    setPin: 'تعيين رمز PIN',
    enterPin: 'أدخل الرمز',
    locked: 'التطبيق مقفل',
    unlock: 'فتح القفل',
    export: 'تصدير البيانات',
    import: 'استيراد البيانات',
    language: 'اللغة',
    currency: 'العملة',
    changeCurrencyError: 'لا يمكن تغيير العملة في حال وجود عمليات مسجلة. يرجى حذف المعاملات أولاً.',
    budgetLimits: 'حدود الميزانية',
    monthlyLimit: 'الحد الشهري',
    yearlyLimit: 'الحد السنوي',
    threshold: 'عتبة التنبيه (%)',
    warning: 'تنبيه',
    critical: 'حرج',
    healthy: 'جيد',
    receipt: 'إيصال',
    camera: 'كاميرا',
    noTransactions: 'لا توجد معاملات.',
    askAdvisor: 'اسأل المستشار الذكي...',
    advisorPrompt: 'حلل عادات إنفاقي وقدم لي نصيحة.',
    delete: 'حذف',
    edit: 'تعديل',
    search: 'بحث...',
    allCategories: 'كل التصنيفات',
    allAccounts: 'كل الحسابات',
    adSpace: 'مساحة إعلانية',
    confirmDeleteTitle: 'حذف المعاملة؟',
    confirmDeleteMessage: 'هل أنت متأكد من رغبتك في حذف هذه المعاملة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmImport: 'تنبيه: استيراد نسخة احتياطية سيؤدي إلى مسح واستبدال جميع البيانات الحالية بشكل دائم. لا يمكن التراجع عن هذا الإجراء.\n\nهل أنت متأكد أنك تريد الاستمرار؟',
    importSuccess: 'تم استعادة البيانات بنجاح.',
    importError: 'فشل استعادة البيانات. ملف غير صالح.',
    manageCategories: 'إدارة الفئات',
    addCategory: 'إضافة فئة',
    editCategory: 'تعديل الفئة',
    deleteCategoryError: 'لا يمكن حذف هذا التصنيف لوجود معاملات مرتبطة به. يرجى حذف المعاملات أولاً.',
    categoryNameEn: 'الاسم (إنجليزي)',
    categoryNameAr: 'الاسم (عربي)',
    selectIcon: 'اختر أيقونة',
    selectColor: 'اختر لون',
    aboutUs: 'من نحن',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الاستخدام',
    contactUs: 'تواصل معنا',
    message: 'الرسالة',
    send: 'إرسال',
    aboutText: 'مصاريفي هو مدير ميزانية شخصي ذكي، مصمم ليعمل بالكامل دون اتصال بالإنترنت لضمان أقصى درجات الخصوصية.',
    privacyText: 'نحن نحترم خصوصيتك. يتم تخزين جميع بياناتك المالية محلياً على جهازك. نحن لا نجمع أو نخزن أو نشارك بياناتك الشخصية مع أي خوادم سحابية. ميزات الذكاء الاصطناعي تعمل بشكل مجهول.',
    termsText: 'باستخدام هذا التطبيق، فإنك توافق على أنك مسؤول عن بياناتك الخاصة. المطور غير مسؤول عن فقدان البيانات بسبب عطل الجهاز أو مسح التخزين المحلي. يرجى نسخ بياناتك احتياطياً بانتظام.',
    contactText: 'لديك استفسار؟ أرسل لنا بريداً إلكترونياً.',
    subject: 'الموضوع',
    deleteConfirm: 'نعم، حذف',
    cancelDelete: 'لا، تراجع',
  }
};

// Default Data
export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: '1', nameEn: 'Food & Dining', nameAr: 'طعام ومطاعم', icon: 'Utensils', color: '#e11d48', type: TransactionType.EXPENSE },
  { id: '2', nameEn: 'Transportation', nameAr: 'نقل ومواصلات', icon: 'Car', color: '#4f46e5', type: TransactionType.EXPENSE },
  { id: '3', nameEn: 'Shopping', nameAr: 'تسوق', icon: 'ShoppingBag', color: '#8b5cf6', type: TransactionType.EXPENSE },
  { id: '4', nameEn: 'Housing', nameAr: 'سكن', icon: 'Home', color: '#059669', type: TransactionType.EXPENSE },
  { id: '6', nameEn: 'Entertainment', nameAr: 'ترفيه', icon: 'Film', color: '#d97706', type: TransactionType.EXPENSE },
  { id: '7', nameEn: 'Health', nameAr: 'صحة', icon: 'Heart', color: '#ec4899', type: TransactionType.EXPENSE },
  { id: '9', nameEn: 'Bills', nameAr: 'فواتير', icon: 'FileText', color: '#64748b', type: TransactionType.EXPENSE },
  
  // Income
  { id: '5', nameEn: 'Salary', nameAr: 'راتب', icon: 'Banknote', color: '#10b981', type: TransactionType.INCOME },
  { id: '8', nameEn: 'Investment', nameAr: 'استثمار', icon: 'TrendingUp', color: '#3b82f6', type: TransactionType.INCOME },
  { id: '10', nameEn: 'Freelance', nameAr: 'عمل حر', icon: 'Laptop', color: '#6366f1', type: TransactionType.INCOME },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: '1', nameEn: 'Cash', nameAr: 'نقد', type: 'Cash' },
  { id: '2', nameEn: 'Bank Account', nameAr: 'حساب بنكي', type: 'Bank' },
  { id: '3', nameEn: 'Credit Card', nameAr: 'بطاقة ائتمان', type: 'Credit' },
];