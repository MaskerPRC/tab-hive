export default {
  // عام
  common: {
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    close: 'إغلاق',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تحرير',
    add: 'إضافة',
    remove: 'إزالة',
    copy: 'نسخ',
    refresh: 'تحديث',
    search: 'بحث',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    warning: 'تحذير',
    tip: 'نصيحة',
    hint: 'تلميح',
    yes: 'نعم',
    no: 'لا',
    ok: 'موافق',
    retry: 'إعادة المحاولة',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    finish: 'إنهاء',
    skip: 'تخطي',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    clear: 'مسح',
    submit: 'إرسال',
    download: 'تحميل',
    upload: 'رفع',
    install: 'تثبيت',
    uninstall: 'إلغاء التثبيت',
    update: 'تحديث',
    create: 'إنشاء',
    rename: 'إعادة تسمية',
    manage: 'إدارة',
    settings: 'الإعدادات',
    help: 'مساعدة',
    about: 'حول',
    name: 'الاسم',
    title: 'العنوان',
    description: 'الوصف',
    url: 'الرابط',
    address: 'العنوان',
    type: 'النوع',
    status: 'الحالة',
    time: 'الوقت',
    date: 'التاريخ',
    size: 'الحجم',
    count: 'العدد',
    total: 'المجموع',
    current: 'الحالي',
    latest: 'الأحدث',
    version: 'الإصدار',
    unknown: 'غير معروف',
    untitled: 'بدون عنوان'
  },

  // اسم وعنوان التطبيق
  app: {
    name: 'Tab Hive',
    title: 'Tab Hive'
  },

  // مربع الحوار
  dialog: {
    title: 'نصيحة',
    confirm: 'تأكيد',
    cancel: 'إلغاء'
  },

  // مربع حوار تحرير الموقع
  websiteEdit: {
    addWebsite: 'إضافة موقع',
    editWebsite: 'تحرير الموقع',
    quickStart: 'بداية سريعة:',
    quickAddBaidu: 'إضافة Baidu بسرعة',
    quickAddGoogle: 'إضافة Google بسرعة',
    baidu: 'Baidu',
    google: 'Google',
    commonSettings: '⚙️ الإعدادات العامة',
    optionalSettings: '🔧 الإعدادات الاختيارية',
    advancedSettings: '📦 الميزات المتقدمة',
    websiteName: 'اسم الموقع:',
    websiteUrl: 'رابط الموقع:',
    websiteNamePlaceholder: 'مثال: Google',
    websiteUrlPlaceholder: 'مثال: bbc.com أو https://bbc.com',
    confirm: 'تأكيد',
    cancel: 'إلغاء'
  },

  // معلومات الموقع الأساسية
  websiteBasicInfo: {
    name: 'اسم الموقع:',
    url: 'رابط الموقع:',
    namePlaceholder: 'مثال: Google',
    urlPlaceholder: 'مثال: bbc.com أو https://bbc.com'
  },

  // محدد نوع الجهاز
  deviceType: {
    title: 'نوع الجهاز:',
    desktop: '🖥️ سطح المكتب',
    mobile: '📱 الجوال',
    mobileHint: '💡 ستحول النسخة المحمولة النطاق تلقائيًا إلى النسخة المحمولة (مثال: www.xxx.com → m.xxx.com) وتحد من عرض منفذ العرض إلى 375px'
  },

  // إعدادات الصوت والمرئيات
  audioVisual: {
    audioSettings: 'إعدادات الصوت:',
    muted: '🔇 كتم صوت هذا الموقع',
    mutedHint: '💡 عند التفعيل، لن يشغل هذا الموقع أي صوت',
    visualSettings: 'الإعدادات المرئية:',
    darkMode: '🌙 المظهر الداكن',
    darkModeHint: '💡 فرض المظهر الداكن للموقع، مناسب للتصفح الليلي'
  },

  // محدد مثيل الجلسة
  sessionInstance: {
    title: 'مثيل مشترك لملفات تعريف الارتباط:',
    default: 'افتراضي',
    create: '➕ جديد',
    createHint: 'إنشاء مثيل جديد',
    manage: '⚙️ إدارة',
    manageHint: 'إدارة جميع المثيلات',
    createNewInstance: 'إنشاء مثيل مشترك جديد لملفات تعريف الارتباط',
    createNewInstanceMessage: 'الرجاء إدخال اسم المثيل (مثال: الحساب 2، بيئة الاختبار، إلخ)',
    inputPlaceholder: 'الرجاء إدخال اسم المثيل',
    defaultInstanceName: 'مثيل مشترك',
    hint: '💡 خلايا العسل في نفس المثيل تشارك ملفات تعريف الارتباط والتخزين، المثيلات معزولة تمامًا\n• المثيل المشترك الافتراضي: جميع المواقع تشارك\n• مثيل جديد: يمكن استخدامه لسيناريوهات تسجيل الدخول متعدد الحسابات'
  },

  // تكوين الحشو
  padding: {
    title: 'تكوين الحشو (اختياري):',
    unit: 'px',
    hint: '💡 اضبط المسافة بين محتوى صفحة الويب وحواف البطاقة (الوحدة: بكسل)\n• الافتراضي هو 0 (بدون حشو)\n• النطاق الموصى به: 0-50px'
  },

  // قائمة المحددات المستهدفة
  targetSelector: {
    title: 'المحدد المستهدف (اختياري):',
    placeholder: 'مثال: #main-content أو .video-player',
    addSelector: '➕ إضافة محدد',
    removeSelector: 'إزالة هذا المحدد',
    hint: '💡 يمكنك إضافة عدة محددات CSS. في وضع الشبكة، يتم عرض العناصر المطابقة فقط، والمحتوى الآخر مخفي\n• المحددات المتعددة ستحتفظ بجميع العناصر المطابقة\n• ملء الشاشة يعرض الصفحة الكاملة\n• اتركه فارغًا لإظهار الصفحة بأكملها دائمًا'
  },

  // تكوين التحديث التلقائي
  autoRefresh: {
    title: 'فترة التحديث التلقائي (اختياري):',
    custom: 'مخصص:',
    seconds: 'ثواني',
    minutes: 'دقائق',
    hours: 'ساعات',
    days: 'أيام',
    hint: '💡 تعيين فترة زمنية للتحديث التلقائي لـ iframe\n• انقر على الإعدادات المسبقة للاختيار السريع، أو قم بتخصيص الوقت والوحدة\n• اضبط على 0 لتعطيل التحديث التلقائي\n• الحد الأدنى الموصى به: 30 ثانية (لتجنب التحديثات المتكررة التي تؤثر على الأداء)\n• حالات الاستخدام: المراقبة في الوقت الفعلي، لوحات البيانات، والصفحات الأخرى التي تحتاج إلى تحديثات منتظمة'
  },

  // لوحة التكوين
  configPanel: {
    language: 'اللغة',
    languageHint: 'اختر لغة الواجهة',
    showTitles: 'إظهار العناوين',
    showTitlesHint: 'إظهار/إخفاء عناوين خلايا العسل',
    refreshOnFullscreenToggle: 'التحديث عند تبديل ملء الشاشة',
    refreshOnFullscreenToggleHint: 'ما إذا كان سيتم تحديث صفحة الويب عند تبديل ملء الشاشة لخلايا العسل من نوع المحدد',
    globalMuted: 'كتم الصوت العام',
    globalMutedHint: 'كتم/إلغاء كتم جميع المواقع عالميًا',
    instanceManagement: 'إدارة المثيلات',
    instanceManagementHint: 'إدارة المثيلات المشتركة لملفات تعريف الارتباط',
    help: 'مساعدة',
    helpHint: 'دليل المستخدم',
    downloadPlugin: 'تحميل الإضافة',
    downloadPluginHint: 'تحميل عميل سطح المكتب أو الإضافة',
    clearConfig: 'مسح التكوين',
    clearConfigHint: 'مسح جميع التكوينات',
    windowManagement: 'إدارة النوافذ',
    createNewWindow: 'نافذة جديدة',
    createNewWindowHint: 'إنشاء نافذة Tab Hive جديدة',
    allWindows: 'جميع النوافذ',
    window: 'نافذة',
    current: 'الحالي',
    switchToWindow: 'التبديل إلى النافذة',
    layoutDropdown: {
      createLayout: 'إنشاء تخطيط جديد',
      createLayoutMessage: 'الرجاء إدخال اسم التخطيط الجديد',
      createLayoutPlaceholder: 'تخطيط جديد',
      deleteLayout: 'هل أنت متأكد من أنك تريد حذف التخطيط "{name}"؟',
      clearConfig: 'هل أنت متأكد من أنك تريد مسح جميع التكوينات؟ سيؤدي هذا إلى حذف جميع المواقع وإعدادات التخطيط.'
    },
    unnamed: 'بدون اسم'
  },

  // عمليات التخطيط
  layout: {
    create: 'إنشاء تخطيط جديد',
    createMessage: 'الرجاء إدخال اسم التخطيط الجديد',
    createPlaceholder: 'تخطيط جديد',
    delete: 'هل أنت متأكد من أنك تريد حذف التخطيط "{name}"؟',
    rename: 'إعادة تسمية التخطيط',
    share: 'مشاركة التخطيط',
    syncTemplate: 'مزامنة تحديث القالب',
    keepAlive: 'إبقاء نشط',
    keepAliveEnabled: 'تم تفعيل إبقاء التخطيط "{name}" نشطًا\n\nعند التبديل إلى تخطيطات أخرى، سيظل هذا التخطيط قيد التشغيل ولن يتم إلغاء تحميله.',
    keepAliveDisabled: 'تم تعطيل إبقاء التخطيط "{name}" نشطًا\n\nعند التبديل إلى تخطيطات أخرى، سيتم إلغاء تحميل هذا التخطيط لتوفير الموارد.',
    atLeastOne: 'يجب الاحتفاظ بتخطيط واحد على الأقل',
    clearConfig: 'هل أنت متأكد من أنك تريد مسح جميع التكوينات؟ سيؤدي هذا إلى حذف جميع المواقع وإعدادات التخطيط.',
    sharedLayouts: 'التخطيطات المشتركة',
    localLayouts: 'التخطيطات المحلية',
    myLayouts: 'تخطيطاتي',
    switchToShared: 'التبديل إلى المشترك',
    searchShared: 'البحث في التخطيطات المشتركة',
    importLayout: 'استيراد التخطيط',
    noSharedLayouts: 'لا توجد تخطيطات مشتركة',
    loadingShared: 'جاري التحميل...',
    searchPlaceholder: 'البحث في اسم أو وصف التخطيط...',
    urlImportSuccess: 'تم استيراد التخطيط بنجاح من معاملات URL!',
    layoutList: 'قائمة التخطيطات',
    newLayout: 'تخطيط جديد',
    switchLayout: 'تبديل التخطيط',
    realtimeSync: 'المزامنة في الوقت الفعلي',
    modified: 'معدل (سيتم استبدال التغييرات عند تحديث المزامنة)',
    websites: ' مواقع',
    enableKeepAlive: 'تفعيل الإبقاء نشطًا (الاستمرار في التشغيل عند تبديل التخطيطات)',
    disableKeepAlive: 'تعطيل الإبقاء نشطًا (إلغاء التحميل عند تبديل التخطيطات)',
    syncUpdate: 'التحقق من التحديث ومزامنته',
    syncUpdateModified: 'التحقق من التحديث ومزامنته (سيستبدل تغييراتك)',
    shareLayout: 'مشاركة التخطيط',
    renameLayout: 'إعادة تسمية',
    deleteLayout: 'حذف',
    websiteCount: ' مواقع'
  },

  // مربع حوار التحميل
  downloadModal: {
    title: 'الإضافة مطلوبة للاستخدام الطبيعي',
    message: 'يحتاج هذا التطبيق إلى العمل في بيئة محددة لتحميل صفحات iframe.<br/>الرجاء اختيار أحد طرق التثبيت التالية:',
    corsPlugin: {
      title: '🔌 إضافة إلغاء قفل CORS (موصى به)',
      description: 'إزالة قيود iframe للموقع، متوافق مع Chrome و Edge والمتصفحات الأخرى',
      download: '📥 تحميل إضافة إلغاء قفل CORS',
      installHint: 'بعد التحميل، يرجى فك الضغط وتحميل المجلد المفكوك في متصفحك'
    },
    selectorPlugin: {
      title: '🎯 إضافة المحدد (اختياري)',
      description: 'دعم تحديد موضع محدد CSS وعرض ملء الشاشة لعناصر صفحة الويب المحددة',
      download: '📥 تحميل إضافة المحدد',
      installHint: 'استخدم مع إضافة CORS للتركيز على مناطق محددة مثل مشغلات الفيديو، محتوى المقالات، إلخ.\nاملأ حقل "المحدد المستهدف" عند تحرير موقع (مثال: #player)'
    },
    desktopApp: {
      title: '💻 تطبيق سطح المكتب',
      description: 'مستقل، كامل الوظائف، لا يتطلب تثبيت إضافة',
      download: '📥 تحميل تطبيق سطح المكتب'
    },
    tutorial: '📖 عرض دليل التثبيت المفصل',
    dismiss: 'فهمت (متابعة التصفح)',
    or: 'أو'
  },

  // إشعار التحديث
  updateNotification: {
    title: 'إصدار جديد متاح',
    currentVersion: 'الإصدار الحالي:',
    latestVersion: 'أحدث إصدار:',
    updateContent: 'محتوى التحديث:',
    downloading: 'جاري تحميل التحديث...',
    downloaded: 'تم التحميل',
    downloadCompleted: 'اكتمل التحميل!',
    downloadCompletedMessage: 'حزمة التحديث جاهزة، انقر على الزر أدناه للتثبيت',
    downloadFailed: 'فشل التحميل',
    downloadNow: 'تحميل التحديث الآن',
    cancelDownload: 'إلغاء التحميل',
    installAndRestart: 'التثبيت وإعادة التشغيل',
    retryDownload: 'إعادة محاولة التحميل',
    later: 'تذكير لاحقًا',
    close: 'إغلاق'
  },

  // بطاقة الموقع
  websiteCard: {
    fullscreen: 'ملء الشاشة',
    edit: 'تحرير',
    copy: 'نسخ',
    remove: 'إزالة',
    refresh: 'تحديث',
    toggleMute: 'تبديل الكتم'
  },

  // محدد العناصر
  elementSelector: {
    title: 'محدد العناصر',
    start: 'بدء التحديد',
    stop: 'إيقاف التحديد',
    select: 'تحديد العنصر',
    confirm: 'تأكيد التحديد',
    cancel: 'إلغاء'
  },

  // شريط أدوات المحدد
  selectorToolbar: {
    startSelect: 'بدء التحديد',
    stopSelect: 'إيقاف التحديد',
    confirm: 'تأكيد',
    cancel: 'إلغاء'
  },

  // مربع حوار وضع الاستيراد
  importMode: {
    title: 'اختر وضع الاستيراد',
    description: 'كيف تريد استيراد هذا التخطيط؟',
    realtimeSync: {
      title: 'استيراد المزامنة في الوقت الفعلي',
      description: 'البقاء متزامنًا مع القالب الأصلي، مزامنة التحديثات يدويًا عندما يحدث المؤلف القالب',
      note: '⚠️ إذا قمت بتعديل التخطيط، فستتم الكتابة فوق تغييراتك عند مزامنة التحديثات'
    },
    copy: {
      title: 'استيراد النسخ',
      description: 'إنشاء نسخة مستقلة يمكن تعديلها بحرية',
      note: '💡 غير متأثر بتحديثات القالب الأصلي'
    },
    cancel: 'إلغاء'
  },

  // مدير مثيل الجلسة
  sessionInstanceManager: {
    title: 'إدارة المثيل المشترك لملفات تعريف الارتباط',
    whatIs: 'ما هو المثيل المشترك لملفات تعريف الارتباط؟',
    description: 'خلايا العسل في نفس المثيل تشارك ملفات تعريف الارتباط، LocalStorage، والتخزين الآخر. المثيلات معزولة تمامًا عن بعضها البعض.',
    useCases: 'حالات الاستخدام:',
    useCasesDesc: 'تسجيل دخول متعدد الحسابات، عزل بيئة الاختبار، إلخ.',
    rename: 'إعادة تسمية',
    delete: 'حذف',
    deleteDisabled: 'هناك خلايا عسل تستخدم هذا المثيل، لا يمكن الحذف',
    deleteConfirm: 'هل أنت متأكد من أنك تريد حذف المثيل "{name}"؟',
    create: 'مثيل جديد',
    close: 'إغلاق',
    usageCount: ' خلايا عسل'
  },

  // إعدادات التحديث التلقائي المسبقة
  autoRefreshPresets: {
    noRefresh: 'بدون تحديث',
    thirtySeconds: '30 ثانية',
    oneMinute: '1 دقيقة',
    fiveMinutes: '5 دقائق',
    thirtyMinutes: '30 دقيقة',
    oneHour: '1 ساعة',
    oneDay: '1 يوم'
  },

  // الإجراءات العائمة
  floatingActions: {
    refresh: 'تحديث الصفحة',
    mute: 'كتم الصوت',
    unmute: 'إلغاء كتم الصوت',
    copy: 'نسخ خلية العسل',
    script: 'منفذ البرنامج النصي',
    edit: 'تحرير الرابط',
    fullscreen: 'عرض ملء الشاشة',
    remove: 'إزالة الموقع'
  },

  // شريط أدوات المحدد
  selectorToolbar: {
    title: 'محدد العناصر',
    dragHandle: 'اسحب لتحريك اللوحة',
    showHighlight: 'إظهار التمييز',
    hideHighlight: 'إخفاء التمييز',
    confirm: 'تأكيد التحديد',
    cancel: 'إلغاء التحديد',
    multiSelectMode: 'وضع التحديد المتعدد',
    multiSelectHint: '(الاحتفاظ بعناصر متعددة)',
    cssSelector: 'محدد CSS',
    placeholder: 'انقر على عناصر الصفحة للتحديد...',
    clear: 'مسح المحدد',
    selectedElements: 'العناصر المحددة',
    currentSelector: 'المحدد الحالي',
    addToList: 'إضافة إلى القائمة',
    selectParent: 'تحديد العنصر الأصلي',
    parentElement: 'العنصر الأصلي',
    selectSibling: 'تحديد العنصر الشقيق',
    siblingElement: 'العنصر الشقيق',
    selectChild: 'تحديد العنصر الفرعي',
    childElement: 'العنصر الفرعي',
    reselect: 'إعادة تحديد العنصر',
    reselectShort: 'إعادة التحديد',
    settings: 'إعدادات المحدد',
    selectorRules: 'قواعد إنشاء المحدد',
    includeId: 'تضمين معرف العنصر',
    includeClass: 'تضمين الفئة',
    includeTag: 'تضمين اسم الوسم',
    includeAttributes: 'تضمين السمات',
    tag: 'وسم',
    id: 'معرف',
    class: 'فئة',
    size: 'الحجم',
    confirmSelection: 'تأكيد التحديد',
    multiSelectModeHint: 'وضع التحديد المتعدد: انقر على العناصر للإضافة إلى القائمة | اضغط ESC للإلغاء',
    multiSelectModeSelected: 'وضع التحديد المتعدد: تم تحديد {count} عنصر | انقر على "إضافة إلى القائمة" للمتابعة | "تأكيد التحديد" لحفظ الكل',
    singleSelectModeHint: 'انقر على العناصر للتحديد | اضغط ESC للإلغاء',
    confirmSelectionHint: 'يمكنك الاستمرار في ضبط التحديد | انقر على "تأكيد التحديد" للحفظ | اضغط ESC للإلغاء'
  },

  // شريط ملء الشاشة
  fullscreenBar: {
    selectElement: 'تحديد العنصر',
    exitFullscreen: 'الخروج من ملء الشاشة'
  },

  // تلميح تغيير URL
  urlChangeHint: {
    useCurrentUrl: 'استخدام رابط صفحة الويب المعروضة حاليًا',
    useThisPage: 'استخدام هذه الصفحة'
  },

  // مؤقت التحديث
  refreshTimer: {
    day: 'ي',
    hour: 'س',
    hours: 'ساعات',
    minute: 'د',
    seconds: 'ث'
  },

  // أخرى
  other: {
    gridView: 'عرض الشبكة',
    canvasView: 'عرض اللوحة',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    operationFailed: 'فشلت العملية',
    operationSuccess: 'نجحت العملية',
    pleaseWait: 'يرجى الانتظار...',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    unsavedChanges: 'تغييرات غير محفوظة',
    confirmDelete: 'هل أنت متأكد من أنك تريد الحذف؟',
    confirmAction: 'هل أنت متأكد من أنك تريد تنفيذ هذا الإجراء؟',
    urlImportSuccess: 'تم استيراد التخطيط بنجاح من معاملات URL!',
    unknownError: 'خطأ غير معروف',
    networkError: 'خطأ في الشبكة',
    pleaseCheckNetwork: 'يرجى التحقق من اتصال الشبكة',
    noData: 'لا توجد بيانات',
    empty: 'فارغ',
    all: 'الكل',
    none: 'لا شيء',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء تحديد الكل',
    filter: 'تصفية',
    sort: 'ترتيب',
    ascending: 'تصاعدي',
    descending: 'تنازلي',
    byName: 'حسب الاسم',
    byDate: 'حسب التاريخ',
    bySize: 'حسب الحجم'
  }
}
