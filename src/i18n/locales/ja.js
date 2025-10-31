export default {
  // 共通
  common: {
    confirm: '確認',
    cancel: 'キャンセル',
    close: '閉じる',
    save: '保存',
    delete: '削除',
    edit: '編集',
    add: '追加',
    remove: '削除',
    copy: 'コピー',
    refresh: '更新',
    search: '検索',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    warning: '警告',
    tip: 'ヒント',
    hint: 'ヒント',
    yes: 'はい',
    no: 'いいえ',
    ok: 'OK',
    retry: '再試行',
    back: '戻る',
    next: '次へ',
    previous: '前へ',
    finish: '完了',
    skip: 'スキップ',
    apply: '適用',
    reset: 'リセット',
    clear: 'クリア',
    submit: '送信',
    download: 'ダウンロード',
    upload: 'アップロード',
    install: 'インストール',
    uninstall: 'アンインストール',
    update: '更新',
    create: '作成',
    rename: '名前を変更',
    manage: '管理',
    settings: '設定',
    help: 'ヘルプ',
    about: 'について',
    name: '名前',
    title: 'タイトル',
    description: '説明',
    url: 'URL',
    address: 'アドレス',
    type: '種類',
    status: 'ステータス',
    time: '時間',
    date: '日付',
    size: 'サイズ',
    count: '数',
    total: '合計',
    current: '現在',
    latest: '最新',
    version: 'バージョン',
    unknown: '不明',
    untitled: '無題'
  },

  // アプリ名とタイトル
  app: {
    name: 'Tab Hive',
    title: 'Tab Hive'
  },

  // ダイアログ
  dialog: {
    title: 'ヒント',
    confirm: '確認',
    cancel: 'キャンセル'
  },

  // ウェブサイト編集ダイアログ
  websiteEdit: {
    addWebsite: 'ウェブサイトを追加',
    editWebsite: 'ウェブサイトを編集',
    quickStart: 'クイックスタート:',
    quickAddBaidu: 'Baiduをクイック追加',
    quickAddGoogle: 'Googleをクイック追加',
    baidu: 'Baidu',
    google: 'Google',
    commonSettings: '⚙️ 共通設定',
    optionalSettings: '🔧 オプション設定',
    advancedSettings: '📦 高度な機能',
    websiteName: 'ウェブサイト名:',
    websiteUrl: 'ウェブサイトURL:',
    websiteNamePlaceholder: '例: Google',
    websiteUrlPlaceholder: '例: bbc.com または https://bbc.com',
    confirm: '確認',
    cancel: 'キャンセル'
  },

  // ウェブサイト基本情報
  websiteBasicInfo: {
    name: 'ウェブサイト名:',
    url: 'ウェブサイトURL:',
    namePlaceholder: '例: Google',
    urlPlaceholder: '例: bbc.com または https://bbc.com'
  },

  // デバイスタイプセレクター
  deviceType: {
    title: 'デバイスタイプ:',
    desktop: '🖥️ デスクトップ',
    mobile: '📱 モバイル',
    mobileHint: '💡 モバイル版は自動的にドメインをモバイル版に変換し（例: www.xxx.com → m.xxx.com）、ビューポート幅を375pxに制限します'
  },

  // オーディオビジュアル設定
  audioVisual: {
    audioSettings: 'オーディオ設定:',
    muted: '🔇 このウェブサイトをミュート',
    mutedHint: '💡 有効にすると、このウェブサイトは音を再生しません',
    visualSettings: 'ビジュアル設定:',
    darkMode: '🌙 ダークテーマ',
    darkModeHint: '💡 ウェブサイトにダークテーマを強制適用します。夜間の閲覧に適しています'
  },

  // セッションインスタンスセレクター
  sessionInstance: {
    title: 'Cookie共有インスタンス:',
    default: 'デフォルト',
    create: '➕ 新規',
    createHint: '新しいインスタンスを作成',
    manage: '⚙️ 管理',
    manageHint: 'すべてのインスタンスを管理',
    createNewInstance: '新しいCookie共有インスタンスを作成',
    createNewInstanceMessage: 'インスタンス名を入力してください（例: アカウント2、テスト環境など）',
    inputPlaceholder: 'インスタンス名を入力してください',
    defaultInstanceName: '共有インスタンス',
    hint: '💡 同じインスタンスのハニカムはCookieとストレージを共有し、インスタンス間は完全に分離されています\n• デフォルト共有インスタンス: すべてのウェブサイトが共有\n• 新しいインスタンス: マルチアカウントログインなどのシナリオに使用できます'
  },

  // パディング設定
  padding: {
    title: 'パディング設定（オプション）:',
    unit: 'px',
    hint: '💡 ウェブページコンテンツとカードエッジ間の距離を調整（単位: ピクセル）\n• デフォルトは0（パディングなし）\n• 推奨範囲: 0-50px'
  },

  // ターゲットセレクターリスト
  targetSelector: {
    title: 'ターゲットセレクター（オプション）:',
    placeholder: '例: #main-content または .video-player',
    addSelector: '➕ セレクターを追加',
    removeSelector: 'このセレクターを削除',
    hint: '💡 複数のCSSセレクターを追加できます。グリッドモードでは、一致する要素のみが表示され、他のコンテンツは非表示になります\n• 複数のセレクターはすべての一致する要素を保持します\n• フルスクリーンでは完全なページを表示します\n• 空のままにすると常にページ全体を表示します'
  },

  // 自動更新設定
  autoRefresh: {
    title: '自動更新間隔（オプション）:',
    custom: 'カスタム:',
    seconds: '秒',
    minutes: '分',
    hours: '時間',
    days: '日',
    hint: '💡 iframe自動更新の時間間隔を設定\n• プリセットをクリックしてクイック選択するか、時間と単位をカスタマイズ\n• 0に設定すると自動更新が無効になります\n• 推奨最小値: 30秒（パフォーマンスに影響を与える頻繁な更新を避けるため）\n• 使用例: リアルタイム監視、データダッシュボード、定期的な更新が必要なその他のページ'
  },

  // 設定パネル
  configPanel: {
    language: '言語',
    languageHint: 'インターフェース言語を選択',
    showTitles: 'タイトルを表示',
    showTitlesHint: 'ハニカムタイトルを表示/非表示',
    refreshOnFullscreenToggle: 'フルスクリーン切り替え時に更新',
    refreshOnFullscreenToggleHint: 'セレクタータイプのハニカムでフルスクリーン切り替え時にウェブページを更新するかどうか',
    globalMuted: 'グローバルミュート',
    globalMutedHint: 'すべてのウェブサイトをグローバルにミュート/ミュート解除',
    instanceManagement: 'インスタンス管理',
    instanceManagementHint: 'Cookie共有インスタンスを管理',
    help: 'ヘルプ',
    helpHint: 'ユーザーガイド',
    downloadPlugin: 'プラグインをダウンロード',
    downloadPluginHint: 'デスクトップクライアントまたはプラグインをダウンロード',
    clearConfig: '設定をクリア',
    clearConfigHint: 'すべての設定をクリア',
    windowManagement: 'ウィンドウ管理',
    createNewWindow: '新しいウィンドウ',
    createNewWindowHint: '新しいTab Hiveウィンドウを作成',
    allWindows: 'すべてのウィンドウ',
    window: 'ウィンドウ',
    current: '現在',
    switchToWindow: 'ウィンドウに切り替え',
    layoutDropdown: {
      createLayout: '新しいレイアウトを作成',
      createLayoutMessage: '新しいレイアウト名を入力してください',
      createLayoutPlaceholder: '新しいレイアウト',
      deleteLayout: 'レイアウト "{name}" を削除してもよろしいですか？',
      clearConfig: 'すべての設定をクリアしてもよろしいですか？これによりすべてのウェブサイトとレイアウト設定が削除されます。'
    },
    unnamed: '無名'
  },

  // レイアウト操作
  layout: {
    create: '新しいレイアウトを作成',
    createMessage: '新しいレイアウト名を入力してください',
    createPlaceholder: '新しいレイアウト',
    delete: 'レイアウト "{name}" を削除してもよろしいですか？',
    rename: 'レイアウトの名前を変更',
    share: 'レイアウトを共有',
    syncTemplate: 'テンプレート更新を同期',
    keepAlive: 'キープアライブ',
    keepAliveEnabled: 'レイアウト "{name}" キープアライブが有効\n\n他のレイアウトに切り替える際、このレイアウトは実行を継続し、アンロードされません。',
    keepAliveDisabled: 'レイアウト "{name}" キープアライブが無効\n\n他のレイアウトに切り替える際、このレイアウトはリソースを節約するためにアンロードされます。',
    atLeastOne: '少なくとも1つのレイアウトを保持する必要があります',
    clearConfig: 'すべての設定をクリアしてもよろしいですか？これによりすべてのウェブサイトとレイアウト設定が削除されます。',
    sharedLayouts: '共有レイアウト',
    localLayouts: 'ローカルレイアウト',
    myLayouts: 'マイレイアウト',
    switchToShared: '共有に切り替え',
    searchShared: '共有レイアウトを検索',
    importLayout: 'レイアウトをインポート',
    noSharedLayouts: '共有レイアウトなし',
    loadingShared: '読み込み中...',
    searchPlaceholder: 'レイアウト名または説明を検索...',
    urlImportSuccess: 'URLパラメータからレイアウトを正常にインポートしました！',
    layoutList: 'レイアウトリスト',
    newLayout: '新しいレイアウト',
    switchLayout: 'レイアウトを切り替え',
    realtimeSync: 'リアルタイム同期',
    modified: '変更済み（同期更新時に変更が上書きされます）',
    websites: ' ウェブサイト',
    enableKeepAlive: 'キープアライブを有効化（レイアウト切り替え時に実行を継続）',
    disableKeepAlive: 'キープアライブを無効化（レイアウト切り替え時にアンロード）',
    syncUpdate: '更新を確認して同期',
    syncUpdateModified: '更新を確認して同期（変更が上書きされます）',
    shareLayout: 'レイアウトを共有',
    renameLayout: '名前を変更',
    deleteLayout: '削除',
    websiteCount: ' ウェブサイト'
  },

  // ダウンロードモーダル
  downloadModal: {
    title: '通常の使用にはプラグインが必要です',
    message: 'このアプリケーションはiframeウェブページを読み込むために特定の環境で実行する必要があります。<br/>次のインストール方法のいずれかを選択してください:',
    corsPlugin: {
      title: '🔌 CORS解除プラグイン（推奨）',
      description: 'ウェブサイトのiframe制限を削除、Chrome、Edge、その他のブラウザと互換性があります',
      download: '📥 CORS解除プラグインをダウンロード',
      installHint: 'ダウンロード後、解凍してブラウザに解凍したフォルダを読み込んでください'
    },
    selectorPlugin: {
      title: '🎯 セレクタープラグイン（オプション）',
      description: 'CSSセレクターの位置指定と特定のウェブページ要素のフルスクリーン表示をサポート',
      download: '📥 セレクタープラグインをダウンロード',
      installHint: 'CORSプラグインと一緒に使用して、ビデオプレーヤー、記事コンテンツなどの特定の領域に焦点を当てます\nウェブサイトを編集する際に「ターゲットセレクター」フィールドに入力してください（例: #player）'
    },
    desktopApp: {
      title: '💻 デスクトップアプリケーション',
      description: 'スタンドアロン、完全に機能し、プラグインのインストールは不要',
      download: '📥 デスクトップアプリをダウンロード'
    },
    tutorial: '📖 詳細なインストールチュートリアルを表示',
    dismiss: '了解（閲覧を続ける）',
    or: 'または'
  },

  // 更新通知
  updateNotification: {
    title: '新しいバージョンが利用可能',
    currentVersion: '現在のバージョン:',
    latestVersion: '最新バージョン:',
    updateContent: '更新内容:',
    downloading: '更新をダウンロード中...',
    downloaded: 'ダウンロード済み',
    downloadCompleted: 'ダウンロード完了！',
    downloadCompletedMessage: '更新パッケージの準備ができました。下のボタンをクリックしてインストールしてください',
    downloadFailed: 'ダウンロード失敗',
    downloadNow: '今すぐ更新をダウンロード',
    cancelDownload: 'ダウンロードをキャンセル',
    installAndRestart: 'インストールして再起動',
    retryDownload: 'ダウンロードを再試行',
    later: '後で思い出す',
    close: '閉じる'
  },

  // ウェブサイトカード
  websiteCard: {
    fullscreen: 'フルスクリーン',
    edit: '編集',
    copy: 'コピー',
    remove: '削除',
    refresh: '更新',
    toggleMute: 'ミュートを切り替え'
  },

  // 要素セレクター
  elementSelector: {
    title: '要素セレクター',
    start: '選択を開始',
    stop: '選択を停止',
    select: '要素を選択',
    confirm: '選択を確認',
    cancel: 'キャンセル'
  },

  // セレクターツールバー
  selectorToolbar: {
    startSelect: '選択を開始',
    stopSelect: '選択を停止',
    confirm: '確認',
    cancel: 'キャンセル'
  },

  // インポートモードダイアログ
  importMode: {
    title: 'インポートモードを選択',
    description: 'このレイアウトをどのようにインポートしますか？',
    realtimeSync: {
      title: 'リアルタイム同期インポート',
      description: '元のテンプレートと同期を維持し、作成者がテンプレートを更新したときに手動で更新を同期',
      note: '⚠️ レイアウトを変更した場合、同期更新時に変更が上書きされます'
    },
    copy: {
      title: 'コピーインポート',
      description: '自由に変更できる独立したコピーを作成',
      note: '💡 元のテンプレートの更新の影響を受けません'
    },
    cancel: 'キャンセル'
  },

  // セッションインスタンスマネージャー
  sessionInstanceManager: {
    title: 'Cookie共有インスタンス管理',
    whatIs: 'Cookie共有インスタンスとは何ですか？',
    description: '同じインスタンスのハニカムはCookie、LocalStorage、その他のストレージを共有します。インスタンス間は完全に分離されています。',
    useCases: '使用例:',
    useCasesDesc: 'マルチアカウントログイン、テスト環境の分離など。',
    rename: '名前を変更',
    delete: '削除',
    deleteDisabled: 'このインスタンスを使用しているハニカムがあるため、削除できません',
    deleteConfirm: 'インスタンス "{name}" を削除してもよろしいですか？',
    create: '新しいインスタンス',
    close: '閉じる',
    usageCount: ' ハニカム'
  },

  // 自動更新プリセット
  autoRefreshPresets: {
    noRefresh: '更新なし',
    thirtySeconds: '30秒',
    oneMinute: '1分',
    fiveMinutes: '5分',
    thirtyMinutes: '30分',
    oneHour: '1時間',
    oneDay: '1日'
  },

  // フローティングアクション
  floatingActions: {
    refresh: 'ページを更新',
    mute: 'ミュート',
    unmute: 'ミュート解除',
    copy: 'ハニカムをコピー',
    script: 'スクリプトエグゼキュータ',
    edit: 'リンクを編集',
    fullscreen: 'フルスクリーンビュー',
    remove: 'ウェブサイトを削除'
  },

  // セレクターツールバー
  selectorToolbar: {
    title: '要素セレクター',
    dragHandle: 'ドラッグしてパネルを移動',
    showHighlight: 'ハイライトを表示',
    hideHighlight: 'ハイライトを非表示',
    confirm: '選択を確認',
    cancel: '選択をキャンセル',
    multiSelectMode: '複数選択モード',
    multiSelectHint: '（複数の要素を保持）',
    cssSelector: 'CSSセレクター',
    placeholder: 'ページ要素をクリックして選択...',
    clear: 'セレクターをクリア',
    selectedElements: '選択された要素',
    currentSelector: '現在のセレクター',
    addToList: 'リストに追加',
    selectParent: '親要素を選択',
    parentElement: '親要素',
    selectSibling: '兄弟要素を選択',
    siblingElement: '兄弟要素',
    selectChild: '子要素を選択',
    childElement: '子要素',
    reselect: '要素を再選択',
    reselectShort: '再選択',
    settings: 'セレクター設定',
    selectorRules: 'セレクター生成ルール',
    includeId: '要素IDを含める',
    includeClass: 'クラスを含める',
    includeTag: 'タグ名を含める',
    includeAttributes: '属性を含める',
    tag: 'タグ',
    id: 'ID',
    class: 'クラス',
    size: 'サイズ',
    confirmSelection: '選択を確認',
    multiSelectModeHint: '複数選択モード: 要素をクリックしてリストに追加 | ESCキーを押してキャンセル',
    multiSelectModeSelected: '複数選択モード: {count} 個の要素が選択されました | 「リストに追加」をクリックして続行 | 「選択を確認」ですべてを保存',
    singleSelectModeHint: '要素をクリックして選択 | ESCキーを押してキャンセル',
    confirmSelectionHint: '選択を調整し続けることができます | 「選択を確認」をクリックして保存 | ESCキーを押してキャンセル'
  },

  // フルスクリーンバー
  fullscreenBar: {
    selectElement: '要素を選択',
    exitFullscreen: 'フルスクリーンを終了'
  },

  // URL変更ヒント
  urlChangeHint: {
    useCurrentUrl: '現在表示されているウェブページのURLを使用',
    useThisPage: 'このページを使用'
  },

  // 更新タイマー
  refreshTimer: {
    day: '日',
    hour: '時',
    hours: '時間',
    minute: '分',
    seconds: '秒'
  },

  // その他
  other: {
    gridView: 'グリッドビュー',
    canvasView: 'キャンバスビュー',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    operationFailed: '操作失敗',
    operationSuccess: '操作成功',
    pleaseWait: 'お待ちください...',
    saving: '保存中...',
    saved: '保存済み',
    unsavedChanges: '未保存の変更',
    confirmDelete: '削除してもよろしいですか？',
    confirmAction: 'この操作を実行してもよろしいですか？',
    urlImportSuccess: 'URLパラメータからレイアウトを正常にインポートしました！',
    unknownError: '不明なエラー',
    networkError: 'ネットワークエラー',
    pleaseCheckNetwork: 'ネットワーク接続を確認してください',
    noData: 'データなし',
    empty: '空',
    all: 'すべて',
    none: 'なし',
    selectAll: 'すべて選択',
    deselectAll: 'すべての選択を解除',
    filter: 'フィルター',
    sort: '並び替え',
    ascending: '昇順',
    descending: '降順',
    byName: '名前で',
    byDate: '日付で',
    bySize: 'サイズで'
  }
}
