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
  budgetLimit?: number; // Optional monthly limit for this specific category
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
    categoryBudgets: 'Category Budgets',
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
    export: 'Backup Data (JSON)',
    exportExcel: 'Export to Excel',
    import: 'Restore Data',
    language: 'Language',
    currency: 'Currency',
    changeCurrencyError: 'Cannot change currency while transactions exist. Please delete all transactions first.',
    budgetLimits: 'Budget Limits',
    monthlyLimit: 'Monthly Limit',
    yearlyLimit: 'Yearly Limit',
    categoryLimit: 'Category Limit (Optional)',
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
    confirmImport: 'WARNING: Restoring data will PERMANENTLY REPLACE all current data. This action cannot be undone.\n\nAre you sure you want to proceed?',
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
    subject: 'Subject',
    deleteConfirm: 'Yes, Delete',
    cancelDelete: 'No, Keep it',
    // Professional Legal Text
    aboutText: `Masarify is a premier personal finance management application designed to empower individuals to take control of their financial future. 

Our mission is to provide a secure, offline-first tool that simplifies budgeting, tracking, and financial analysis without compromising user privacy. Built with cutting-edge technology and an intuitive design, Masarify helps you make informed decisions through visual insights and AI-powered advice.`,
    privacyText: `1. Data Sovereignty:
Masarify operates on a strict "Offline-First" architecture. All your financial data, transaction history, and personal settings are stored exclusively on your local device's encrypted storage. We do not transmit, store, or sell your data to any external cloud servers or third parties.

2. AI Interactions:
When using the "Smart Advisor" feature, anonymized transaction data (stripped of personal identifiers) is sent temporarily to the processing API solely for the purpose of generating advice. This data is not retained by us.

3. Permissions:
- Camera: Required only for attaching receipt images to your transactions.
- Notifications: Used strictly for local budget alerts.`,
    termsText: `1. License to Use:
By downloading and using Masarify, you are granted a limited, non-exclusive, non-transferable license to use the application for personal, non-commercial purposes.

2. User Responsibility:
You acknowledge that you are solely responsible for the security of your device and your data. Masarify provides local backup options, and it is your responsibility to perform regular backups. The developer is not liable for data loss resulting from device failure, factory resets, or user error.

3. Financial Advice Disclaimer:
The "Smart Advisor" feature is an AI-driven tool provided for informational purposes only. It does not constitute professional financial advice. Always consult with a certified financial planner for major financial decisions.`,
    contactText: 'We value your feedback and are here to assist you. For technical support, feature requests, or business inquiries, please reach out to our dedicated support team.',
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
    categoryBudgets: 'ميزانيات الفئات',
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
    export: 'نسخ احتياطي (JSON)',
    exportExcel: 'تصدير إلى Excel',
    import: 'استعادة البيانات',
    language: 'اللغة',
    currency: 'العملة',
    changeCurrencyError: 'لا يمكن تغيير العملة في حال وجود عمليات مسجلة. يرجى حذف المعاملات أولاً.',
    budgetLimits: 'حدود الميزانية',
    monthlyLimit: 'الحد الشهري',
    yearlyLimit: 'الحد السنوي',
    categoryLimit: 'حد الفئة (اختياري)',
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
    confirmImport: 'تحذير: استعادة البيانات ستؤدي إلى مسح واستبدال جميع البيانات الحالية بشكل دائم. تأكد من أن ملف النسخة الاحتياطية صحيح.\n\nهل تود الاستمرار؟',
    importSuccess: 'تم استعادة البيانات بنجاح.',
    importError: 'فشل استعادة البيانات. الملف تالف أو غير صالح.',
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
    subject: 'الموضوع',
    deleteConfirm: 'نعم، حذف',
    cancelDelete: 'لا، تراجع',
    // Professional Legal Text
    aboutText: `مصاريفي هو التطبيق الرائد في الإدارة المالية الشخصية، صُمم خصيصاً لتمكين الأفراد من التحكم الكامل في مستقبلهم المالي.

مهمتنا هي توفير أداة آمنة تعمل دون الحاجة للإنترنت (Offline-First)، لتبسيط عملية وضع الميزانيات، وتتبع المصاريف، والتحليل المالي دون المساس بخصوصية المستخدم. تم بناء التطبيق بأحدث التقنيات وتصميم بديهي لمساعدتك على اتخاذ قرارات مدروسة من خلال الرؤى البصرية والنصائح المدعومة بالذكاء الاصطناعي.`,
    privacyText: `1. سيادة البيانات:
يعمل تطبيق مصاريفي وفق هيكلية "عدم الاتصال أولاً". يتم تخزين جميع بياناتك المالية وسجل المعاملات والإعدادات الشخصية حصرياً على وحدة التخزين المحلية بجهازك وتكون مشفرة. نحن لا نقوم بنقل أو تخزين أو بيع بياناتك لأي خوادم سحابية خارجية أو أطراف ثالثة.

2. تفاعلات الذكاء الاصطناعي:
عند استخدام ميزة "المستشار الذكي"، يتم إرسال بيانات المعاملات المجهولة (منزوعة الهوية الشخصية) بشكل مؤقت إلى واجهة المعالجة فقط لغرض توليد النصيحة، ولا يتم الاحتفاظ بهذه البيانات من قبلنا.

3. الأذونات:
- الكاميرا: مطلوبة فقط لغرض إرفاق صور الإيصالات بالمعاملات.
- الإشعارات: تستخدم حصرياً للتنبيهات المحلية عند تجاوز حدود الميزانية.`,
    termsText: `1. ترخيص الاستخدام:
بتحميل واستخدام "مصاريفي"، يتم منحك ترخيصاً محدوداً، غير حصري، وغير قابل للتحويل لاستخدام التطبيق للأغراض الشخصية غير التجارية.

2. مسؤولية المستخدم:
أنت تقر بأنك المسؤول الوحيد عن أمان جهازك وبياناتك. يوفر التطبيق خيارات للنسخ الاحتياطي المحلي، وتقع عليك مسؤولية إجراء النسخ الاحتياطي بانتظام. المطور غير مسؤول عن أي فقدان للبيانات ناتج عن تعطل الجهاز، أو إعادة ضبط المصنع، أو خطأ المستخدم.

3. إخلاء المسؤولية المالية:
ميزة "المستشار الذكي" هي أداة مساعدة تعتمد على الذكاء الاصطناعي وتُقدم لأغراض معلوماتية فقط. لا تعتبر هذه المعلومات نصيحة مالية مهنية ملزمة. استشر دائماً مخططاً مالياً معتمداً للقرارات المالية الكبرى.`,
    contactText: 'نحن نقدر ملاحظاتكم ونسعد بمساعدتكم. للدعم الفني، أو طلب الميزات، أو الاستفسارات التجارية، يرجى التواصل مع فريق الدعم المخصص لدينا.',
  }
};

// Default Data
export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: '1', nameEn: 'Food & Dining', nameAr: 'طعام ومطاعم', icon: 'Utensils', color: '#e11d48', type: TransactionType.EXPENSE, budgetLimit: 0 },
  { id: '2', nameEn: 'Transportation', nameAr: 'نقل ومواصلات', icon: 'Car', color: '#4f46e5', type: TransactionType.EXPENSE, budgetLimit: 0 },
  { id: '3', nameEn: 'Shopping', nameAr: 'تسوق', icon: 'ShoppingBag', color: '#8b5cf6', type: TransactionType.EXPENSE, budgetLimit: 0 },
  { id: '4', nameEn: 'Housing', nameAr: 'سكن', icon: 'Home', color: '#059669', type: TransactionType.EXPENSE, budgetLimit: 0 },
  { id: '6', nameEn: 'Entertainment', nameAr: 'ترفيه', icon: 'Film', color: '#d97706', type: TransactionType.EXPENSE, budgetLimit: 0 },
  { id: '7', nameEn: 'Health', nameAr: 'صحة', icon: 'Heart', color: '#ec4899', type: TransactionType.EXPENSE, budgetLimit: 0 },
  { id: '9', nameEn: 'Bills', nameAr: 'فواتير', icon: 'FileText', color: '#64748b', type: TransactionType.EXPENSE, budgetLimit: 0 },
  
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