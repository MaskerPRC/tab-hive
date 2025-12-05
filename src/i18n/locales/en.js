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
    name: 'Tab Hive',
    title: 'Tab Hive'
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
    baidu: 'Baidu',
    google: 'Google',
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
    customCodeEnabled: 'Custom Code',
    customCodeEnabledHint: 'Enable to show script executor button in floating actions',
    instanceManagement: 'Instance Management',
    instanceManagementHint: 'Manage Cookie shared instances',
    help: 'Help',
    helpHint: 'User guide',
    proxy: 'Proxy',
    proxyHint: 'Manage proxy settings',
    downloadPlugin: 'Download Plugin',
    downloadPluginHint: 'Download desktop client or plugin',
    clearConfig: 'Clear Config',
    clearConfigHint: 'Clear all configurations',
    windowManagement: 'Window Management',
    createNewWindow: 'New Window',
    createNewWindowHint: 'Create a new Tab Hive window',
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
    websiteCount: ' websites'
  },

  // Download modal
  downloadModal: {
    title: 'Plugin Required for Normal Use',
    message: 'This application needs to run in a specific environment to load iframe webpages.<br/>Please choose one of the following installation methods:',
    corsPlugin: {
      title: '🔌 CORS Unlock Plugin (Recommended)',
      description: 'Remove website iframe restrictions, compatible with Chrome, Edge, and other browsers',
      download: '📥 Download CORS Unlock Plugin',
      installHint: 'After downloading, please extract and load the extracted folder in your browser'
    },
    selectorPlugin: {
      title: '🎯 Selector Plugin (Optional)',
      description: 'Support CSS selector positioning and fullscreen display of specific webpage elements',
      download: '📥 Download Selector Plugin',
      installHint: 'Use with CORS plugin to focus on specific areas like video players, article content, etc.\nFill in the "Target Selector" field when editing a website (e.g., #player)'
    },
    desktopApp: {
      title: '💻 Desktop Application',
      description: 'Standalone, fully functional, no plugin installation required',
      download: '📥 Download Desktop App'
    },
    tutorial: '📖 View Detailed Installation Tutorial',
    dismiss: 'Got it (Continue browsing)',
    or: 'or'
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
    edit: 'Edit Link',
    fullscreen: 'Fullscreen View',
    remove: 'Remove Website'
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

