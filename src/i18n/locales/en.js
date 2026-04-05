export default {
  // Common
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    copy: 'Copy',
    refresh: 'Refresh',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    tip: 'Tip',
    hint: 'Hint',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    retry: 'Retry',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    skip: 'Skip',
    apply: 'Apply',
    reset: 'Reset',
    clear: 'Clear',
    submit: 'Submit',
    download: 'Download',
    upload: 'Upload',
    install: 'Install',
    uninstall: 'Uninstall',
    update: 'Update',
    create: 'Create',
    rename: 'Rename',
    manage: 'Manage',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    name: 'Name',
    title: 'Title',
    description: 'Description',
    url: 'URL',
    address: 'Address',
    type: 'Type',
    status: 'Status',
    time: 'Time',
    date: 'Date',
    size: 'Size',
    count: 'Count',
    total: 'Total',
    current: 'Current',
    latest: 'Latest',
    version: 'Version',
    unknown: 'Unknown',
    untitled: 'Untitled'
  },

  // App title and name
  app: {
    name: '全视界',
    title: '全视界'
  },

  // Dialog
  dialog: {
    title: 'Tip',
    confirm: 'Confirm',
    cancel: 'Cancel'
  },

  // Website edit dialog
  websiteEdit: {
    addWebsite: 'Add Website',
    editWebsite: 'Edit Website',
    quickStart: 'Quick Start:',
    quickAddBaidu: 'Quick Add Baidu',
    quickAddGoogle: 'Quick Add Google',
    quickAddExcalidraw: 'Quick Add Excalidraw',
    baidu: 'Baidu',
    google: 'Google',
    excalidraw: 'Excalidraw',
    commonSettings: '⚙️ Common Settings',
    optionalSettings: '🔧 Optional Settings',
    advancedSettings: '📦 Advanced Features',
    websiteName: 'Website Name:',
    websiteUrl: 'Website URL:',
    websiteNamePlaceholder: 'e.g., Google',
    websiteUrlPlaceholder: 'e.g., bbc.com or https://bbc.com',
    confirm: 'Confirm',
    cancel: 'Cancel'
  },

  // Website basic info
  websiteBasicInfo: {
    name: 'Website Name:',
    url: 'Website URL:',
    namePlaceholder: 'e.g., Google',
    urlPlaceholder: 'e.g., bbc.com or https://bbc.com'
  },

  // Device type selector
  deviceType: {
    title: 'Device Type:',
    desktop: '🖥️ Desktop',
    mobile: '📱 Mobile',
    mobileHint: '💡 Mobile version will automatically convert domain to mobile version (e.g., www.xxx.com → m.xxx.com) and limit viewport width to 375px'
  },

  // Audio visual settings
  audioVisual: {
    audioSettings: 'Audio Settings:',
    muted: '🔇 Mute this website',
    mutedHint: '💡 When enabled, this website will not play any sound',
    visualSettings: 'Visual Settings:',
    darkMode: '🌙 Dark Theme',
    darkModeHint: '💡 Force dark theme for the website, suitable for night browsing',
    actionButtonSettings: 'Action Button Settings:',
    requireModifierForActions: '⌨️ Require Modifier Key',
    requireModifierForActionsHint: '💡 When enabled, hold Ctrl or Alt to show action buttons, avoiding interference with webpage operations'
  },

  // Session instance selector
  sessionInstance: {
    title: 'Cookie Shared Instance:',
    default: 'Default',
    create: '➕ New',
    createHint: 'Create new instance',
    manage: '⚙️ Manage',
    manageHint: 'Manage all instances',
    createNewInstance: 'Create New Cookie Shared Instance',
    createNewInstanceMessage: 'Please enter instance name (e.g., Account 2, Test Environment, etc.)',
    inputPlaceholder: 'Please enter instance name',
    defaultInstanceName: 'Shared Instance',
    hint: '💡 Honeycombs in the same instance share cookies and storage, instances are completely isolated\n• Default shared instance: All websites share\n• New instance: Can be used for multi-account login scenarios'
  },

  // Padding config
  padding: {
    title: 'Padding Config (Optional):',
    unit: 'px',
    hint: '💡 Adjust the distance between webpage content and card edges (unit: pixels)\n• Default is 0 (no padding)\n• Recommended range: 0-50px'
  },

  // Target selector list
  targetSelector: {
    title: 'Target Selector (Optional):',
    placeholder: 'e.g., #main-content or .video-player',
    addSelector: '➕ Add Selector',
    removeSelector: 'Remove this selector',
    hint: '💡 You can add multiple CSS selectors. In Grid mode, only matching elements are displayed, other content is hidden\n• Multiple selectors will keep all matching elements\n• Fullscreen shows the complete page\n• Leave empty to always show the entire page'
  },

  // Auto refresh config
  autoRefresh: {
    title: 'Auto Refresh Interval (Optional):',
    custom: 'Custom:',
    seconds: 'Seconds',
    minutes: 'Minutes',
    hours: 'Hours',
    days: 'Days',
    hint: '💡 Set the iframe auto-refresh time interval\n• Click presets for quick selection, or customize time and unit\n• Set to 0 to disable auto-refresh\n• Recommended minimum: 30 seconds (to avoid frequent refreshes affecting performance)\n• Use cases: Real-time monitoring, data dashboards, and other pages that need regular updates'
  },

  // Config panel
  configPanel: {
    language: 'Language',
    languageHint: 'Select interface language',
    showTitles: 'Show Titles',
    showTitlesHint: 'Show/Hide honeycomb titles',
    refreshOnFullscreenToggle: 'Refresh on Fullscreen Toggle',
    refreshOnFullscreenToggleHint: 'Whether to refresh the webpage when toggling fullscreen for selector-type honeycombs',
    globalMuted: 'Global Mute',
    globalMutedHint: 'Mute/Unmute all websites globally',
    adBlockEnabled: 'Ad Block',
    adBlockEnabledHint: 'Enable to automatically block ads on all websites',
    showCertificateErrorShadow: 'Certificate Error Red Shadow',
    showCertificateErrorShadowHint: 'Enable to show red shadow on certificate error websites',
    customCodeEnabled: 'Custom Code',
    customCodeEnabledHint: 'Enable to show script executor button in floating actions',
    instanceManagement: 'Instance Management',
    instanceManagementHint: 'Manage Cookie shared instances',
    help: 'Help',
    helpHint: 'User guide',
    settings: 'Settings',
    settingsHint: 'Configure LLM API and other settings',
    proxy: 'Proxy',
    proxyHint: 'Manage proxy settings',
    downloadPlugin: 'Download Plugin',
    downloadPluginHint: 'Download desktop client or plugin',
    clearConfig: 'Clear Config',
    clearConfigHint: 'Clear all configurations',
    windowManagement: 'Window Management',
    createNewWindow: 'New Window',
    createNewWindowHint: 'Create a new 全视界 window',
    allWindows: 'All Windows',
    window: 'Window',
    current: 'Current',
    switchToWindow: 'Switch to Window',
    layoutDropdown: {
      createLayout: 'Create New Layout',
      createLayoutMessage: 'Please enter new layout name',
      createLayoutPlaceholder: 'New Layout',
      deleteLayout: 'Are you sure you want to delete layout "{name}"?',
      clearConfig: 'Are you sure you want to clear all configurations? This will delete all websites and layout settings.'
    },
    unnamed: 'Unnamed'
  },

  // Layout operations
  layout: {
    create: 'Create New Layout',
    createMessage: 'Please enter new layout name',
    createPlaceholder: 'New Layout',
    delete: 'Are you sure you want to delete layout "{name}"?',
    rename: 'Rename Layout',
    share: 'Share Layout',
    syncTemplate: 'Sync Template Update',
    keepAlive: 'Keep Alive',
    keepAliveEnabled: 'Layout "{name}" keep alive enabled\n\nWhen switching to other layouts, this layout will remain running and will not be unloaded.',
    keepAliveDisabled: 'Layout "{name}" keep alive disabled\n\nWhen switching to other layouts, this layout will be unloaded to save resources.',
    atLeastOne: 'At least one layout must be kept',
    clearConfig: 'Are you sure you want to clear all configurations? This will delete all websites and layout settings.',
    sharedLayouts: 'Shared Layouts',
    localLayouts: 'Local Layouts',
    myLayouts: 'My Layouts',
    switchToShared: 'Switch to Shared',
    searchShared: 'Search Shared Layouts',
    importLayout: 'Import Layout',
    noSharedLayouts: 'No shared layouts',
    loadingShared: 'Loading...',
    searchPlaceholder: 'Search layout name or description...',
    urlImportSuccess: 'Successfully imported layout from URL parameters!',
    layoutList: 'Layout List',
    newLayout: 'New Layout',
    switchLayout: 'Switch Layout',
    realtimeSync: 'Real-time Sync',
    modified: 'Modified (changes will be overwritten on sync update)',
    websites: ' websites',
    enableKeepAlive: 'Enable Keep Alive (keep running when switching layouts)',
    disableKeepAlive: 'Disable Keep Alive (unload when switching layouts)',
    syncUpdate: 'Check and Sync Update',
    syncUpdateModified: 'Check and Sync Update (will overwrite your changes)',
    shareLayout: 'Share Layout',
    renameLayout: 'Rename',
    deleteLayout: 'Delete',
    websiteCount: ' websites',
    exportLayout: 'Export Layout',
    preview: 'Preview',
    sharedLayoutsDesc: 'Browse and import shared Tab Hive layout configurations',
    sortHot: 'Most Downloaded',
    sortLatest: 'Latest',
    shareWithScreenshotConfirm: 'Do you want to capture a screenshot of the current page and embed layout data?\n\nThe screenshot will be used as the sharing image, and the layout JSON data will be saved in the image metadata.',
    exportWithScreenshotConfirm: 'Do you want to capture a screenshot of the current page and embed layout data?\n\nThe screenshot will be used as the export image, and the layout JSON data will be saved in the image metadata.',
    capturingScreenshot: 'Capturing screenshot...',
    screenshotCopied: 'Screenshot copied to clipboard!',
    screenshotDownloaded: 'Screenshot downloaded!',
    shareFailed: 'Share failed',
    shareSuccess: 'Share successful!',
    exportSuccess: 'Export successful!',
    exportFailed: 'Export failed',
    importLayoutFromImageConfirm: 'Detected layout data in image ("{name}").\n\nDo you want to import this layout?',
    importedLayout: 'Imported Layout',
    unnamedLayout: 'Unnamed Layout',
    invalidLayoutData: 'Invalid layout data',
    importSuccess: 'Import successful!',
    importFailed: 'Import failed'
  },

  // Update notification
  updateNotification: {
    title: 'New Version Available',
    currentVersion: 'Current Version:',
    latestVersion: 'Latest Version:',
    updateContent: 'Update Content:',
    downloading: 'Downloading update...',
    downloaded: 'Downloaded',
    downloadCompleted: 'Download Complete!',
    downloadCompletedMessage: 'Update package is ready, click the button below to install',
    downloadFailed: 'Download Failed',
    downloadNow: 'Download Update Now',
    cancelDownload: 'Cancel Download',
    installAndRestart: 'Install and Restart',
    retryDownload: 'Retry Download',
    later: 'Remind Later',
    close: 'Close'
  },

  // Website card
  websiteCard: {
    fullscreen: 'Fullscreen',
    edit: 'Edit',
    copy: 'Copy',
    remove: 'Remove',
    refresh: 'Refresh',
    toggleMute: 'Toggle Mute'
  },

  // Element selector
  elementSelector: {
    title: 'Element Selector',
    start: 'Start Selection',
    stop: 'Stop Selection',
    select: 'Select Element',
    confirm: 'Confirm Selection',
    cancel: 'Cancel'
  },

  // Selector toolbar
  selectorToolbar: {
    startSelect: 'Start Selection',
    stopSelect: 'Stop Selection',
    confirm: 'Confirm',
    cancel: 'Cancel'
  },

  // Import mode dialog
  importMode: {
    title: 'Select Import Mode',
    description: 'How would you like to import this layout?',
    realtimeSync: {
      title: 'Real-time Sync Import',
      description: 'Keep in sync with the original template, manually sync updates when the author updates the template',
      note: '⚠️ If you modify the layout, your changes will be overwritten when syncing updates'
    },
    copy: {
      title: 'Copy Import',
      description: 'Create an independent copy that can be freely modified',
      note: '💡 Not affected by original template updates'
    },
    cancel: 'Cancel'
  },

  // Session instance manager
  sessionInstanceManager: {
    title: 'Cookie Shared Instance Management',
    whatIs: 'What is a Cookie Shared Instance?',
    description: 'Honeycombs in the same instance share cookies, LocalStorage, and other storage. Instances are completely isolated from each other.',
    useCases: 'Use Cases:',
    useCasesDesc: 'Multi-account login, test environment isolation, etc.',
    rename: 'Rename',
    delete: 'Delete',
    deleteDisabled: 'There are honeycombs using this instance, cannot delete',
    deleteConfirm: 'Are you sure you want to delete instance "{name}"?',
    create: 'New Instance',
    close: 'Close',
    usageCount: ' honeycombs'
  },

  // Auto refresh presets
  autoRefreshPresets: {
    noRefresh: 'No Refresh',
    thirtySeconds: '30 Seconds',
    oneMinute: '1 Minute',
    fiveMinutes: '5 Minutes',
    thirtyMinutes: '30 Minutes',
    oneHour: '1 Hour',
    oneDay: '1 Day'
  },

  // Floating actions
  floatingActions: {
    refresh: 'Refresh Page',
    goBack: 'Go Back',
    goForward: 'Go Forward',
    mute: 'Mute',
    unmute: 'Unmute',
    copy: 'Copy Honeycomb',
    script: 'Script Executor',
    devtools: 'Developer Tools',
    edit: 'Edit Link',
    fullscreen: 'Fullscreen View',
    remove: 'Remove Website',
    importCookies: 'Import Cookies'
  },

  // Selector toolbar
  selectorToolbar: {
    title: 'Element Selector',
    elementCapture: 'Element Capture',
    dragHandle: 'Drag to move panel',
    showHighlight: 'Show Highlight',
    hideHighlight: 'Hide Highlight',
    confirm: 'Confirm Selection',
    cancel: 'Cancel Selection',
    multiSelectMode: 'Multi-select Mode',
    multiSelectHint: '(Keep multiple elements)',
    cssSelector: 'CSS Selector',
    currentPath: 'Current Path',
    depth: 'Depth',
    copySelector: 'Copy Selector',
    placeholder: 'Click page elements to select...',
    clear: 'Clear Selector',
    selectedElements: 'Selected Elements',
    currentSelector: 'Current Selector',
    addToList: 'Add to List',
    selectParent: 'Select Parent Element',
    parentElement: 'Parent Element',
    selectSibling: 'Select Sibling Element',
    siblingElement: 'Sibling Element',
    selectChild: 'Select Child Element',
    childElement: 'Child Element',
    reselect: 'Reselect Element',
    reselectShort: 'Reselect',
    settings: 'Selector Settings',
    selectorRules: 'Selector Generation Rules',
    includeId: 'Include Element ID',
    includeClass: 'Include Class',
    includeTag: 'Include Tag Name',
    includeAttributes: 'Include Attributes',
    tag: 'Tag',
    tagName: 'Tag Name',
    id: 'ID',
    class: 'Class',
    classList: 'Class List',
    size: 'Size',
    dimensions: 'Dimensions',
    confirmSelection: 'Confirm Selection',
    multiSelectModeHint: 'Multi-select mode: Click elements to add to list | Press ESC to cancel',
    multiSelectModeSelected: 'Multi-select mode: {count} elements selected | Click "Add to List" to continue | "Confirm Selection" to save all',
    singleSelectModeHint: 'Click elements to select | Press ESC to cancel',
    confirmSelectionHint: 'You can continue adjusting the selection | Click "Confirm Selection" to save | Press ESC to cancel',
    shiftLockHint: 'Hold Shift to lock selection area'
  },

  // Fullscreen bar
  fullscreenBar: {
    selectElement: 'Select Element',
    refresh: 'Refresh',
    goBack: 'Go Back',
    goForward: 'Go Forward',
    exitFullscreen: 'Exit Fullscreen'
  },

  // URL change hint
  urlChangeHint: {
    useCurrentUrl: 'Use current displayed webpage URL',
    useThisPage: 'Use this page'
  },

  // Refresh timer
  refreshTimer: {
    day: 'd',
    hour: 'h',
    hours: 'hours',
    minute: 'm',
    seconds: 's'
  },

  // Basic Auth dialog
  basicAuth: {
    title: 'Authentication Required',
    username: 'Username',
    password: 'Password',
    login: 'Login'
  },

  // External URL modal
  externalUrl: {
    title: 'External Link'
  },

  // Content script panel
  contentScript: {
    title: 'Content Script Executor',
    tabs: {
      highlight: 'Highlight',
      extract: 'Extract',
      actions: 'Actions',
      custom: 'Custom'
    },
    highlight: {
      title: 'Element Highlight',
      selectors: 'Selectors (one per line)',
      color: 'Highlight Color',
      duration: 'Duration (ms)',
      permanentHint: '0 = permanent highlight',
      enablePulse: 'Enable pulse animation',
      apply: 'Apply Highlight',
      clear: 'Clear Highlights',
      executing: 'Executing...',
      success: 'Highlighted {count} elements',
      failed: 'Highlight failed: {error}',
      cleared: 'All highlights cleared',
      clearFailed: 'Clear failed: {error}'
    },
    extract: {
      title: 'Data Extraction',
      selectors: 'Selectors (one per line)',
      extractText: 'Extract text',
      extractHtml: 'Extract HTML',
      attributes: 'Attributes (comma-separated)',
      styles: 'Style attributes (comma-separated)',
      extractBtn: 'Extract Data',
      exportJson: 'Export JSON',
      executing: 'Extracting...',
      results: 'Extraction Results',
      items: '{count} items',
      success: 'Extracted {count} items',
      failed: 'Extraction failed: {error}'
    },
    actions: {
      title: 'Batch Operations',
      selectors: 'Selectors (one per line)',
      actionType: 'Action Type',
      click: 'Click',
      focus: 'Focus',
      scrollIntoView: 'Scroll to View',
      hide: 'Hide',
      show: 'Show',
      remove: 'Remove',
      execute: 'Execute Action',
      executing: 'Executing...',
      results: 'Action Results',
      success: 'Success: {count}',
      failed: 'Failed: {count}',
      viewFailedDetails: 'View failure details',
      completeSuccess: 'Action complete\nSuccess: {success}\nFailed: {failed}',
      completeFailed: 'Action failed: {error}'
    },
    custom: {
      title: 'Custom Script',
      codeLabel: 'JavaScript Code',
      execute: 'Execute Script',
      executing: 'Executing...',
      results: 'Execution Results'
    },
    history: {
      title: 'Execution History',
      clear: 'Clear History',
      noResult: 'No result',
      executionFailed: 'Execution failed',
      noReturnValue: 'No return value',
      emptyResult: 'Empty result'
    }
  },

  // Canvas controls
  canvasControls: {
    addWebsite: 'Add Window',
    fitToScreen: 'Fit to Screen',
    autoArrange: 'Fit to Screen',
    rearrange: 'Rearrange',
    clearDrawings: 'Clear Drawings',
    drawingMode: 'Drawing Mode',
    drawingSettings: 'Drawing Settings',
    resetZoom: 'Reset Zoom (100%)',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out'
  },

  // Rearrange dialog
  rearrangeDialog: {
    title: 'Rearrange Windows',
    columns: 'Columns',
    itemWidth: 'Window Width (px)',
    itemHeight: 'Window Height (px)',
    scale: 'Window Scale',
    scaleHint: '1.0 is original size, 2.0 is double size',
    preview: 'Preview',
    finalSize: 'Final Window Size',
    layout: 'Layout',
    reset: 'Reset Default'
  },

  // API settings panel
  apiSettings: {
    title: 'API Service Settings',
    server: 'API Server',
    enable: 'Enable',
    bindAddress: 'Bind Address',
    port: 'Port',
    showHide: 'Show/Hide',
    copy: 'Copy',
    regenerate: 'Regenerate',
    running: 'Running',
    stopped: 'Stopped',
    networkHook: 'Global Network Hook (Bypass Forward)',
    hookUrlHint: 'Page network requests will be forwarded as POST JSON to this address. You can set an independent Hook URL for individual pages in website edit.',
    usageGuide: 'Usage Guide',
    externalApi: 'External Access API:',
    apiListWorkspaces: 'List workspaces and pages',
    apiExecute: 'Multi-step JS execution',
    apiTraffic: 'Get network traffic',
    apiKeyHeader: 'Request header must include'
  },

  // Proxy management
  proxy: {
    title: 'Proxy Node Management',
    addProxy: 'Add Proxy',
    importSubscription: 'Import Subscription',
    selected: '{count} selected',
    enable: 'Enable',
    batchDelete: 'Delete',
    editProxy: 'Edit Proxy',
    name: 'Name',
    namePlaceholder: 'Proxy name',
    type: 'Type',
    host: 'Host',
    hostPlaceholder: 'Server address',
    portPlaceholder: 'Port number',
    usernameOptional: 'Username (optional)',
    usernamePlaceholder: 'Username',
    passwordOptional: 'Password (optional)',
    passwordPlaceholder: 'Password',
    password: 'Password',
    ssPassword: 'Shadowsocks password',
    cipher: 'Encryption Method',
    pluginOptional: 'Plugin (optional)',
    pluginOpts: 'Plugin Options (JSON format)',
    enableUdp: 'Enable UDP',
    enableTfo: 'Enable TCP Fast Open',
    uuid: 'UUID',
    saving: 'Saving...'
  },

  // LLM config
  llmConfig: {
    title: 'LLM API Configuration',
    subtitle: 'Configure LLM API to generate custom web pages',
    apiUrl: 'API URL',
    apiUrlHint: 'Full URL of the LLM API',
    apiKey: 'API Key',
    apiKeyHint: 'API Key for authentication.',
    apiKeyLink: 'Get from OpenRouter',
    model: 'Model Name',
    modelHint: 'Name of the model to use',
    temperature: 'Temperature',
    temperatureHint: 'Controls output randomness (0-2)',
    maxTokens: 'Max Tokens',
    maxTokensHint: 'Maximum length of generated content (0 for unlimited)'
  },

  // Custom HTML dialog
  customHtml: {
    title: 'Create Custom Web Page',
    subtitle: 'Describe your needs, AI will generate web page code for you',
    requirement: 'Requirement Description',
    requirementPlaceholder: 'e.g., Create a todo list that supports adding, deleting, and marking as complete...',
    requirementHint: 'Describe the web page features and styles you want in detail',
    generating: 'Generating HTML code, please wait...',
    generatingBtn: 'Generating...',
    generateBtn: 'Generate Page',
    defaultTitle: 'Custom Web Page',
    configError: 'Please configure LLM API in settings first',
    generateFailed: 'Generation failed'
  },

  // Monitoring rules
  monitoring: {
    rulesTitle: 'Page Monitoring Rules',
    noRules: 'No monitoring rules yet',
    noRulesDesc: 'Create rules to automatically monitor page changes',
    createFirst: 'Create First Rule',
    createRule: '+ New Rule',
    editRule: 'Edit Monitoring Rule',
    newRule: 'New Monitoring Rule',
    ruleName: 'Rule Name',
    ruleNamePlaceholder: 'e.g., Detect price changes',
    condition: 'Monitoring Condition',
    visionMonitor: 'Vision Monitor (LLM)',
    visionMonitorDesc: 'Use AI to analyze page screenshots',
    textMonitor: 'Text Monitor',
    textMonitorDesc: 'Monitor page text changes (coming soon)',
    conditionDesc: 'Condition Description (describe trigger condition in natural language)',
    conditionPlaceholder: "e.g., Trigger when the page shows 'out of stock' or 'sold out'",
    conditionHint: 'AI will analyze page screenshots based on this description to determine if the condition is met',
    checkInterval: 'Check Interval',
    seconds: 'seconds',
    intervalHint: 'Avoid setting too short to prevent high API costs from frequent calls',
    actions: 'Actions',
    desktopNotification: 'Desktop Notification',
    required: 'Required',
    sendEmail: 'Send Email',
    webhook: 'Webhook Notification',
    comingSoon: 'Coming Soon',
    notificationMessage: 'Notification Message',
    notificationPlaceholder: 'e.g., Product status has changed!',
    apiConfigTitle: 'LLM API Configuration Required',
    apiConfigDesc: 'This feature requires LLM API (e.g., OpenAI GPT-4 Vision) to analyze screenshots. Please configure your API key in settings.',
    goConfig: 'Go to Settings →',
    testScreenshot: '🖼️ Test Screenshot',
    testVision: '🤖 Test Vision Analysis',
    conditionLabel: 'Condition:',
    checkEvery: 'Check every {interval}s',
    lastTrigger: 'Last triggered: {time}',
    triggerCount: 'Triggered {count} times'
  },

  // Canvas view
  canvasView: {
    addWebsite: 'Add Website',
    addWebsiteNode: 'Add website node',
    drawingMode: 'Drawing mode',
    exitDrawing: 'Exit Drawing',
    startDrawing: 'Drawing',
    color: 'Color:',
    strokeWidth: 'Width:',
    clearDrawing: 'Clear Drawing',
    fitToView: 'Fit to View',
    newWebsite: 'New Website'
  },

  // Desktop capture
  desktopCapture: {
    connecting: 'Connecting to desktop source...',
    readonlyMode: '📺 Read-only mode (interaction not supported)',
    noSource: 'No desktop source specified',
    electronOnly: 'Desktop capture is only available in Electron environment',
    addCapture: 'Add Desktop Capture',
    editCapture: 'Edit Desktop Capture',
    basicInfo: 'Basic Info',
    captureTitle: 'Name',
    titlePlaceholder: 'Enter desktop capture name',
    sourceTitle: 'Desktop Source',
    fullScreen: '🖥️ Full Screen',
    appWindow: '🪟 App Window',
    changeSource: 'Change Source',
    selectSource: 'Please select a desktop source to capture',
    selectSourceBtn: 'Select Desktop Source',
    captureOptions: 'Capture Options',
    fitScreen: 'Fit to screen size',
    displaySettings: 'Display Settings',
    padding: 'Padding',
    mute: 'Mute'
  },

  // Canvas controls panel
  canvasControlsPanel: {
    brushTool: 'Brush Tool',
    textTool: 'Text Tool',
    imageTool: 'Image Tool',
    drawColor: 'Drawing Color',
    strokeWidth: 'Stroke Width'
  },

  // Canvas context menu
  canvasContextMenu: {
    addWebsite: 'Add Website',
    aiCustomPage: 'AI Generate Custom Page'
  },

  // Config panel extra
  configPanelExtra: {
    logoAlt: 'Tab Hive Logo',
    collapseSidebar: 'Collapse Sidebar',
    currentViewSettings: 'Current View Settings'
  },

  // Website edit dialog extra
  websiteEditExtra: {
    subtitle: 'Configure display options, proxy, and advanced features',
    basicInfo: 'Basic Info',
    addDesktopCapture: 'Add Desktop Capture',
    aiCustomPage: 'AI Generate Custom Page'
  },

  // Other
  other: {
    gridView: 'Grid View',
    canvasView: 'Canvas View',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    operationFailed: 'Operation Failed',
    operationSuccess: 'Operation Success',
    pleaseWait: 'Please wait...',
    saving: 'Saving...',
    saved: 'Saved',
    unsavedChanges: 'Unsaved changes',
    confirmDelete: 'Are you sure you want to delete?',
    confirmAction: 'Are you sure you want to perform this action?',
    urlImportSuccess: 'Successfully imported layout from URL parameters!',
    unknownError: 'Unknown Error',
    networkError: 'Network Error',
    pleaseCheckNetwork: 'Please check network connection',
    certificateError: 'Certificate Error',
    certificateErrorDescription: 'This website uses an invalid SSL certificate and cannot be securely connected.',
    certificateErrorHint: 'This is usually because a self-signed certificate is used or the certificate has expired.',
    ignoreCertificateError: 'Ignore Error',
    reload: 'Reload',
    noData: 'No Data',
    empty: 'Empty',
    all: 'All',
    none: 'None',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    filter: 'Filter',
    sort: 'Sort',
    ascending: 'Ascending',
    descending: 'Descending',
    byName: 'By Name',
    byDate: 'By Date',
    bySize: 'By Size'
  }
}

