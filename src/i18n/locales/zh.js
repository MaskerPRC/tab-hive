export default {
  // 通用
  common: {
    confirm: '确定',
    cancel: '取消',
    close: '关闭',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    remove: '移除',
    copy: '复制',
    refresh: '刷新',
    search: '搜索',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    tip: '提示',
    hint: '提示',
    yes: '是',
    no: '否',
    ok: '确定',
    retry: '重试',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    finish: '完成',
    skip: '跳过',
    apply: '应用',
    reset: '重置',
    clear: '清除',
    submit: '提交',
    download: '下载',
    upload: '上传',
    install: '安装',
    uninstall: '卸载',
    update: '更新',
    create: '创建',
    rename: '重命名',
    manage: '管理',
    settings: '设置',
    help: '帮助',
    about: '关于',
    name: '名称',
    title: '标题',
    description: '描述',
    url: '地址',
    address: '地址',
    type: '类型',
    status: '状态',
    time: '时间',
    date: '日期',
    size: '大小',
    count: '数量',
    total: '总计',
    current: '当前',
    latest: '最新',
    version: '版本',
    unknown: '未知',
    untitled: '未命名'
  },

  // 应用标题和名称
  app: {
    name: 'Tab Hive',
    title: 'Tab Hive'
  },

  // 对话框
  dialog: {
    title: '提示',
    confirm: '确定',
    cancel: '取消'
  },

  // 网站编辑对话框
  websiteEdit: {
    addWebsite: '添加网站',
    editWebsite: '编辑网站',
    quickStart: '快速开始：',
    quickAddBaidu: '快捷添加百度',
    quickAddGoogle: '快捷添加谷歌',
    baidu: '百度',
    google: '谷歌',
    commonSettings: '⚙️ 常用设置',
    optionalSettings: '🔧 可选配置',
    advancedSettings: '📦 进阶功能',
    websiteName: '网站名称：',
    websiteUrl: '网站地址：',
    websiteNamePlaceholder: '例如：Google',
    websiteUrlPlaceholder: '例如：bbc.com 或 https://bbc.com',
    confirm: '确定',
    cancel: '取消'
  },

  // 网站基础信息
  websiteBasicInfo: {
    name: '网站名称：',
    url: '网站地址：',
    namePlaceholder: '例如：Google',
    urlPlaceholder: '例如：bbc.com 或 https://bbc.com'
  },

  // 设备类型选择器
  deviceType: {
    title: '设备类型：',
    desktop: '🖥️ PC版',
    mobile: '📱 手机版',
    mobileHint: '💡 手机版会自动将域名转换为移动版（如 www.xxx.com → m.xxx.com）并限制视口宽度为 375px'
  },

  // 音频视觉设置
  audioVisual: {
    audioSettings: '音频设置：',
    muted: '🔇 静音此网页',
    mutedHint: '💡 开启后该网页将不会播放任何声音',
    visualSettings: '视觉设置：',
    darkMode: '🌙 暗色主题',
    darkModeHint: '💡 为网页强制应用暗色主题，适合夜间浏览',
    actionButtonSettings: '操作按钮设置：',
    requireModifierForActions: '⌨️ 需要修饰键显示按钮',
    requireModifierForActionsHint: '💡 勾选后，需要按住 Ctrl 或 Alt 键才会显示操作按钮，避免干扰网页操作'
  },

  // Session实例选择器
  sessionInstance: {
    title: 'Cookie共享实例：',
    default: '默认',
    create: '➕ 新建',
    createHint: '创建新实例',
    manage: '⚙️ 管理',
    manageHint: '管理所有实例',
    createNewInstance: '创建新的Cookie共享实例',
    createNewInstanceMessage: '请输入实例名称（例如：账号2、测试环境等）',
    inputPlaceholder: '请输入实例名称',
    defaultInstanceName: '共享实例',
    hint: '💡 相同实例的蜂巢会共享Cookie和存储，不同实例之间完全隔离\n• 默认共享实例：所有网站共用\n• 新建实例：可用于多账号登录等场景'
  },

  // 内边距配置
  padding: {
    title: '内边距配置（可选）：',
    unit: 'px',
    hint: '💡 调整网页内容与卡片边缘的距离（单位：像素）\n• 默认为 0（无内边距）\n• 建议范围：0-50px'
  },

  // 目标选择器列表
  targetSelector: {
    title: '目标选择器（可选）：',
    placeholder: '例如：#main-content 或 .video-player',
    addSelector: '➕ 添加选择器',
    removeSelector: '移除此选择器',
    hint: '💡 可以添加多个CSS选择器，Grid模式下只显示匹配的元素，隐藏其他内容\n• 多个选择器会同时保留所有匹配的元素\n• 全屏时显示完整页面\n• 留空则始终显示整个页面'
  },

  // 自动刷新配置
  autoRefresh: {
    title: '自动刷新间隔（可选）：',
    custom: '自定义：',
    seconds: '秒',
    minutes: '分钟',
    hours: '小时',
    days: '天',
    hint: '💡 设置iframe自动刷新的时间间隔\n• 点击预设快速选择，或自定义时间和单位\n• 设置为 0 表示不自动刷新\n• 建议最小值：30秒（避免频繁刷新影响性能）\n• 适用场景：实时监控、数据大屏等需要定期更新的页面'
  },

  // 配置面板
  configPanel: {
    language: '语言',
    languageHint: '选择界面语言',
    showTitles: '显示标题',
    showTitlesHint: '显示/隐藏蜂巢标题',
    refreshOnFullscreenToggle: '全屏切换刷新',
    refreshOnFullscreenToggleHint: '选择器类型的蜂巢，全屏切换时是否刷新网页',
    globalMuted: '全局静音',
    globalMutedHint: '全局静音/取消静音所有网页',
    adBlockEnabled: '去广告',
    adBlockEnabledHint: '启用后，所有网页将自动拦截广告',
    customCodeEnabled: '自定义代码',
    customCodeEnabledHint: '启用后，可以在浮动按钮中看到脚本执行器按钮',
    instanceManagement: '实例管理',
    instanceManagementHint: '管理Cookie共享实例',
    help: '使用帮助',
    helpHint: '使用帮助',
    proxy: '代理',
    proxyHint: '管理代理设置',
    downloadPlugin: '下载插件',
    downloadPluginHint: '下载桌面客户端或插件',
    clearConfig: '清除配置',
    clearConfigHint: '清除所有配置',
    windowManagement: '窗口管理',
    createNewWindow: '新建窗口',
    createNewWindowHint: '创建新的 Tab Hive 窗口',
    allWindows: '所有窗口',
    window: '窗口',
    current: '当前',
    switchToWindow: '切换到窗口',
    layoutDropdown: {
      createLayout: '创建新布局',
      createLayoutMessage: '请输入新布局名称',
      createLayoutPlaceholder: '新布局',
      deleteLayout: '确定要删除布局 "{name}" 吗？',
      clearConfig: '确定要清除所有配置吗？这将删除所有网站和布局设置。'
    },
    unnamed: '未命名'
  },

  // 画布控制
  canvasControls: {
    addWebsite: '添加窗口',
    autoArrange: '适应屏幕',
    clearDrawings: '清除绘制',
    drawingMode: '绘制模式',
    drawingSettings: '绘制设置',
    resetZoom: '重置缩放 (100%)',
    zoomIn: '放大',
    zoomOut: '缩小'
  },

  // 布局操作
  layout: {
    create: '创建新布局',
    createMessage: '请输入新布局名称',
    createPlaceholder: '新布局',
    delete: '确定要删除布局 "{name}" 吗？',
    rename: '重命名布局',
    share: '分享布局',
    syncTemplate: '同步模板更新',
    keepAlive: '后台运行',
    keepAliveEnabled: '布局 "{name}" 已开启后台运行\n\n切换到其他布局时，该布局将保持运行状态，不会被卸载。',
    keepAliveDisabled: '布局 "{name}" 已关闭后台运行\n\n切换到其他布局时，该布局将被卸载以节省资源。',
    atLeastOne: '至少需要保留一个布局',
    clearConfig: '确定要清除所有配置吗？这将删除所有网站和布局设置。',
    sharedLayouts: '共享布局',
    localLayouts: '本地布局',
    myLayouts: '我的布局',
    switchToShared: '切换到共享',
    searchShared: '搜索共享布局',
    importLayout: '导入布局',
    noSharedLayouts: '暂无共享布局',
    loadingShared: '加载中...',
    searchPlaceholder: '搜索布局名称或描述...',
    urlImportSuccess: '已成功从 URL 参数导入布局！',
    layoutList: '布局列表',
    newLayout: '新建布局',
    switchLayout: '切换布局',
    realtimeSync: '实时同步',
    modified: '已修改（同步更新时会覆盖改动）',
    websites: '个网站',
    enableKeepAlive: '开启后台运行（切换布局时保持运行）',
    disableKeepAlive: '关闭后台运行（切换布局时卸载）',
    syncUpdate: '检查并同步更新',
    syncUpdateModified: '检查并同步更新（将覆盖你的改动）',
    shareLayout: '分享布局',
    renameLayout: '重命名',
    deleteLayout: '删除',
    websiteCount: '个网站',
    preview: '预览',
    sharedLayoutsDesc: '浏览并导入网友分享的 Tab Hive 布局配置',
    sortHot: '最热下载',
    sortLatest: '最新发布'
  },

  // 下载弹窗
  downloadModal: {
    title: '需要安装插件才能正常使用',
    message: '本应用需要在特定环境中运行才能加载 iframe 网页。<br/>请选择下列方式之一安装后使用：',
    corsPlugin: {
      title: '🔌 CORS 解除插件（推荐）',
      description: '解除网站 iframe 限制，适用于 Chrome、Edge 等浏览器',
      download: '📥 下载 CORS 解除插件',
      installHint: '下载后请解压，然后在浏览器中加载解压后的文件夹'
    },
    selectorPlugin: {
      title: '🎯 选择器插件（可选）',
      description: '支持使用 CSS 选择器定位并全屏显示网页特定元素',
      download: '📥 下载选择器插件',
      installHint: '配合 CORS 插件使用，可聚焦于视频播放器、文章内容等特定区域\n在编辑网站时填写"目标选择器"字段（如 #player）'
    },
    desktopApp: {
      title: '💻 桌面应用程序',
      description: '独立运行，功能完整，无需安装插件',
      download: '📥 下载桌面应用'
    },
    tutorial: '📖 查看详细安装教程',
    dismiss: '我知道了（暂时继续浏览）',
    or: '或'
  },

  // 更新通知
  updateNotification: {
    title: '发现新版本',
    currentVersion: '当前版本:',
    latestVersion: '最新版本:',
    updateContent: '更新内容：',
    downloading: '正在下载更新...',
    downloaded: '已下载',
    downloadCompleted: '下载完成！',
    downloadCompletedMessage: '更新包已准备就绪，点击下方按钮安装',
    downloadFailed: '下载失败',
    downloadNow: '立即下载更新',
    cancelDownload: '取消下载',
    installAndRestart: '安装并重启',
    retryDownload: '重试下载',
    later: '稍后提醒',
    close: '关闭'
  },

  // 网站卡片
  websiteCard: {
    fullscreen: '全屏',
    edit: '编辑',
    copy: '复制',
    remove: '移除',
    refresh: '刷新',
    toggleMute: '切换静音'
  },

  // 元素选择器
  elementSelector: {
    title: '元素选择器',
    start: '开始选择',
    stop: '停止选择',
    select: '选择元素',
    confirm: '确认选择',
    cancel: '取消'
  },

  // 选择器工具栏
  selectorToolbar: {
    startSelect: '开始选择',
    stopSelect: '停止选择',
    confirm: '确认',
    cancel: '取消'
  },

  // 导入模式对话框
  importMode: {
    title: '选择导入模式',
    description: '你想如何导入这个布局？',
    realtimeSync: {
      title: '实时同步导入',
      description: '保持与原模板同步，当作者更新模板时可手动同步更新',
      note: '⚠️ 如果你修改了布局，同步更新时会覆盖你的改动'
    },
    copy: {
      title: '拷贝导入',
      description: '创建一个独立的副本，可以自由修改',
      note: '💡 不受原模板更新影响'
    },
    cancel: '取消'
  },

  // Session实例管理
  sessionInstanceManager: {
    title: 'Cookie共享实例管理',
    whatIs: '什么是Cookie共享实例？',
    description: '同一实例的蜂巢会共享Cookie、LocalStorage等存储。不同实例之间完全隔离。',
    useCases: '使用场景：',
    useCasesDesc: '多账号登录、测试环境隔离等。',
    rename: '重命名',
    delete: '删除',
    deleteDisabled: '有蜂巢正在使用此实例，无法删除',
    deleteConfirm: '确定要删除实例 "{name}" 吗？',
    create: '新建实例',
    close: '关闭',
    usageCount: '个蜂巢'
  },

  // 自动刷新预设
  autoRefreshPresets: {
    noRefresh: '不刷新',
    thirtySeconds: '30秒',
    oneMinute: '1分钟',
    fiveMinutes: '5分钟',
    thirtyMinutes: '30分钟',
    oneHour: '1小时',
    oneDay: '1天'
  },

  // 浮动操作按钮
  floatingActions: {
    refresh: '刷新页面',
    goBack: '后退',
    goForward: '前进',
    mute: '静音',
    unmute: '取消静音',
    copy: '复制蜂巢',
    script: '脚本执行器',
    edit: '编辑链接',
    fullscreen: '全屏查看',
    remove: '删除网站'
  },

  // 选择器工具栏
  selectorToolbar: {
    title: '元素选择器',
    elementCapture: '元素捕获',
    dragHandle: '拖动移动面板',
    showHighlight: '显示高亮',
    hideHighlight: '隐藏高亮',
    confirm: '确认选择',
    cancel: '取消选择',
    multiSelectMode: '多选模式',
    multiSelectHint: '（同时保留多个元素）',
    cssSelector: 'CSS 选择器',
    currentPath: '当前路径',
    depth: '深度',
    copySelector: '复制选择器',
    placeholder: '点击页面元素选择...',
    clear: '清除选择器',
    selectedElements: '已选择的元素',
    currentSelector: '当前选择器',
    addToList: '添加到列表',
    selectParent: '选择父元素',
    parentElement: '父级元素',
    selectSibling: '选择兄弟元素',
    siblingElement: '兄弟元素',
    selectChild: '选择子元素',
    childElement: '子级元素',
    reselect: '重新选择元素',
    reselectShort: '重新选取',
    settings: '选择器设置',
    selectorRules: '选择器生成规则',
    includeId: '包含元素 ID',
    includeClass: '包含 Class',
    includeTag: '包含标签名',
    includeAttributes: '包含属性',
    tag: '标签',
    tagName: '标签名',
    id: 'ID',
    class: 'Class',
    classList: 'Class 列表',
    size: '尺寸',
    dimensions: '尺寸',
    confirmSelection: '确认选择',
    multiSelectModeHint: '多选模式：点击元素添加到列表 | 按 ESC 取消',
    multiSelectModeSelected: '多选模式：已选择 {count} 个元素 | 点击"添加到列表"继续选择 | "确认选择"保存所有',
    singleSelectModeHint: '点击元素选择 | 按 ESC 取消',
    confirmSelectionHint: '可继续调整选择 | 点击"确认选择"保存 | 按 ESC 取消',
    shiftLockHint: '按住 Shift 锁定选中区域'
  },

  // 全屏栏
  fullscreenBar: {
    selectElement: '选择元素',
    refresh: '刷新',
    goBack: '后退',
    goForward: '前进',
    exitFullscreen: '退出全屏'
  },

  // URL变化提示
  urlChangeHint: {
    useCurrentUrl: '使用当前显示的网页地址',
    useThisPage: '使用此网页'
  },

  // 刷新计时器
  refreshTimer: {
    day: '天',
    hour: '时',
    hours: '小时',
    minute: '分',
    seconds: '秒'
  },

  // 其他
  other: {
    gridView: '网格视图',
    canvasView: '画布视图',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    operationFailed: '操作失败',
    operationSuccess: '操作成功',
    pleaseWait: '请稍候...',
    saving: '保存中...',
    saved: '已保存',
    unsavedChanges: '有未保存的更改',
    confirmDelete: '确定要删除吗？',
    confirmAction: '确定要执行此操作吗？',
    urlImportSuccess: '已成功从 URL 参数导入布局！',
    unknownError: '未知错误',
    networkError: '网络错误',
    pleaseCheckNetwork: '请检查网络连接',
    noData: '暂无数据',
    empty: '空',
    all: '全部',
    none: '无',
    selectAll: '全选',
    deselectAll: '取消全选',
    filter: '筛选',
    sort: '排序',
    ascending: '升序',
    descending: '降序',
    byName: '按名称',
    byDate: '按日期',
    bySize: '按大小'
  }
}

