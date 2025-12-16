export default {
  // Allgemein
  common: {
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    close: 'Schließen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    remove: 'Entfernen',
    copy: 'Kopieren',
    refresh: 'Aktualisieren',
    search: 'Suchen',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    warning: 'Warnung',
    tip: 'Tipp',
    hint: 'Hinweis',
    yes: 'Ja',
    no: 'Nein',
    ok: 'OK',
    retry: 'Wiederholen',
    back: 'Zurück',
    next: 'Weiter',
    previous: 'Vorherige',
    finish: 'Fertig',
    skip: 'Überspringen',
    apply: 'Anwenden',
    reset: 'Zurücksetzen',
    clear: 'Löschen',
    submit: 'Senden',
    download: 'Herunterladen',
    upload: 'Hochladen',
    install: 'Installieren',
    uninstall: 'Deinstallieren',
    update: 'Aktualisieren',
    create: 'Erstellen',
    rename: 'Umbenennen',
    manage: 'Verwalten',
    settings: 'Einstellungen',
    help: 'Hilfe',
    about: 'Über',
    name: 'Name',
    title: 'Titel',
    description: 'Beschreibung',
    url: 'URL',
    address: 'Adresse',
    type: 'Typ',
    status: 'Status',
    time: 'Zeit',
    date: 'Datum',
    size: 'Größe',
    count: 'Anzahl',
    total: 'Gesamt',
    current: 'Aktuell',
    latest: 'Neueste',
    version: 'Version',
    unknown: 'Unbekannt',
    untitled: 'Ohne Titel'
  },

  // App-Name und Titel
  app: {
    name: '全视界',
    title: '全视界'
  },

  // Dialog
  dialog: {
    title: 'Tipp',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen'
  },

  // Website-Bearbeitungsdialog
  websiteEdit: {
    addWebsite: 'Website hinzufügen',
    editWebsite: 'Website bearbeiten',
    quickStart: 'Schnellstart:',
    quickAddBaidu: 'Baidu schnell hinzufügen',
    quickAddGoogle: 'Google schnell hinzufügen',
    quickAddExcalidraw: 'Excalidraw schnell hinzufügen',
    baidu: 'Baidu',
    google: 'Google',
    excalidraw: 'Excalidraw',
    commonSettings: '⚙️ Allgemeine Einstellungen',
    optionalSettings: '🔧 Optionale Einstellungen',
    advancedSettings: '📦 Erweiterte Funktionen',
    websiteName: 'Website-Name:',
    websiteUrl: 'Website-URL:',
    websiteNamePlaceholder: 'z.B. Google',
    websiteUrlPlaceholder: 'z.B. bbc.com oder https://bbc.com',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen'
  },

  // Grundlegende Website-Informationen
  websiteBasicInfo: {
    name: 'Website-Name:',
    url: 'Website-URL:',
    namePlaceholder: 'z.B. Google',
    urlPlaceholder: 'z.B. bbc.com oder https://bbc.com'
  },

  // Gerätetyp-Auswahl
  deviceType: {
    title: 'Gerätetyp:',
    desktop: '🖥️ Desktop',
    mobile: '📱 Mobil',
    mobileHint: '💡 Die mobile Version konvertiert automatisch die Domain in die mobile Version (z.B. www.xxx.com → m.xxx.com) und begrenzt die Viewport-Breite auf 375px'
  },

  // Audio-/Visuelle Einstellungen
  audioVisual: {
    audioSettings: 'Audio-Einstellungen:',
    muted: '🔇 Diese Website stummschalten',
    mutedHint: '💡 Wenn aktiviert, spielt diese Website keinen Ton ab',
    visualSettings: 'Visuelle Einstellungen:',
    darkMode: '🌙 Dunkles Thema',
    darkModeHint: '💡 Dunkles Thema für die Website erzwingen, geeignet für nächtliches Surfen'
  },

  // Sitzungsinstanz-Auswahl
  sessionInstance: {
    title: 'Cookie-Gemeinsame Instanz:',
    default: 'Standard',
    create: '➕ Neu',
    createHint: 'Neue Instanz erstellen',
    manage: '⚙️ Verwalten',
    manageHint: 'Alle Instanzen verwalten',
    createNewInstance: 'Neue Cookie-Gemeinsame Instanz erstellen',
    createNewInstanceMessage: 'Bitte geben Sie den Instanznamen ein (z.B. Konto 2, Testumgebung usw.)',
    inputPlaceholder: 'Bitte geben Sie den Instanznamen ein',
    defaultInstanceName: 'Gemeinsame Instanz',
    hint: '💡 Waben in derselben Instanz teilen Cookies und Speicher, Instanzen sind vollständig isoliert\n• Standard-Gemeinsame Instanz: Alle Websites teilen\n• Neue Instanz: Kann für Multi-Konto-Anmeldeszenarien verwendet werden'
  },

  // Padding-Konfiguration
  padding: {
    title: 'Padding-Konfiguration (Optional):',
    unit: 'px',
    hint: '💡 Passen Sie den Abstand zwischen Webseiteninhalt und Kartenrändern an (Einheit: Pixel)\n• Standard ist 0 (kein Padding)\n• Empfohlener Bereich: 0-50px'
  },

  // Ziel-Selektor-Liste
  targetSelector: {
    title: 'Ziel-Selektor (Optional):',
    placeholder: 'z.B. #main-content oder .video-player',
    addSelector: '➕ Selektor hinzufügen',
    removeSelector: 'Diesen Selektor entfernen',
    hint: '💡 Sie können mehrere CSS-Selektoren hinzufügen. Im Rastermodus werden nur passende Elemente angezeigt, anderer Inhalt ist ausgeblendet\n• Mehrere Selektoren behalten alle passenden Elemente\n• Vollbild zeigt die vollständige Seite\n• Leer lassen, um immer die gesamte Seite anzuzeigen'
  },

  // Auto-Aktualisierungs-Konfiguration
  autoRefresh: {
    title: 'Auto-Aktualisierungsintervall (Optional):',
    custom: 'Benutzerdefiniert:',
    seconds: 'Sekunden',
    minutes: 'Minuten',
    hours: 'Stunden',
    days: 'Tage',
    hint: '💡 Legen Sie das Zeitintervall für die automatische Aktualisierung des iframe fest\n• Klicken Sie auf Voreinstellungen für schnelle Auswahl oder passen Sie Zeit und Einheit an\n• Auf 0 setzen, um Auto-Aktualisierung zu deaktivieren\n• Empfohlenes Minimum: 30 Sekunden (um häufige Aktualisierungen zu vermeiden, die die Leistung beeinträchtigen)\n• Anwendungsfälle: Echtzeit-Monitoring, Daten-Dashboards und andere Seiten, die regelmäßige Updates benötigen'
  },

  // Konfigurationspanel
  configPanel: {
    language: 'Sprache',
    languageHint: 'Interface-Sprache auswählen',
    showTitles: 'Titel anzeigen',
    showTitlesHint: 'Waben-Titel anzeigen/ausblenden',
    refreshOnFullscreenToggle: 'Bei Vollbildumschaltung aktualisieren',
    refreshOnFullscreenToggleHint: 'Ob die Webseite bei Vollbildumschaltung für Selektor-Typ-Waben aktualisiert werden soll',
    globalMuted: 'Global stumm',
    globalMutedHint: 'Alle Websites global stumm schalten/stumm aufheben',
    instanceManagement: 'Instanzverwaltung',
    instanceManagementHint: 'Cookie-gemeinsame Instanzen verwalten',
    help: 'Hilfe',
    helpHint: 'Benutzerhandbuch',
    downloadPlugin: 'Plugin herunterladen',
    downloadPluginHint: 'Desktop-Client oder Plugin herunterladen',
    clearConfig: 'Konfiguration löschen',
    clearConfigHint: 'Alle Konfigurationen löschen',
    windowManagement: 'Fensterverwaltung',
    createNewWindow: 'Neues Fenster',
    createNewWindowHint: 'Ein neues 全视界-Fenster erstellen',
    allWindows: 'Alle Fenster',
    window: 'Fenster',
    current: 'Aktuell',
    switchToWindow: 'Zu Fenster wechseln',
    layoutDropdown: {
      createLayout: 'Neues Layout erstellen',
      createLayoutMessage: 'Bitte geben Sie den neuen Layout-Namen ein',
      createLayoutPlaceholder: 'Neues Layout',
      deleteLayout: 'Sind Sie sicher, dass Sie das Layout "{name}" löschen möchten?',
      clearConfig: 'Sind Sie sicher, dass Sie alle Konfigurationen löschen möchten? Dies löscht alle Websites und Layout-Einstellungen.'
    },
    unnamed: 'Unbenannt'
  },

  // Layout-Operationen
  layout: {
    create: 'Neues Layout erstellen',
    createMessage: 'Bitte geben Sie den neuen Layout-Namen ein',
    createPlaceholder: 'Neues Layout',
    delete: 'Sind Sie sicher, dass Sie das Layout "{name}" löschen möchten?',
    rename: 'Layout umbenennen',
    share: 'Layout teilen',
    syncTemplate: 'Vorlagen-Update synchronisieren',
    keepAlive: 'Am Leben halten',
    keepAliveEnabled: 'Layout "{name}" am Leben halten aktiviert\n\nBeim Wechseln zu anderen Layouts bleibt dieses Layout laufen und wird nicht entladen.',
    keepAliveDisabled: 'Layout "{name}" am Leben halten deaktiviert\n\nBeim Wechseln zu anderen Layouts wird dieses Layout entladen, um Ressourcen zu sparen.',
    atLeastOne: 'Mindestens ein Layout muss behalten werden',
    clearConfig: 'Sind Sie sicher, dass Sie alle Konfigurationen löschen möchten? Dies löscht alle Websites und Layout-Einstellungen.',
    sharedLayouts: 'Geteilte Layouts',
    localLayouts: 'Lokale Layouts',
    myLayouts: 'Meine Layouts',
    switchToShared: 'Zu geteilt wechseln',
    searchShared: 'Geteilte Layouts durchsuchen',
    importLayout: 'Layout importieren',
    noSharedLayouts: 'Keine geteilten Layouts',
    loadingShared: 'Lädt...',
    searchPlaceholder: 'Layout-Name oder Beschreibung suchen...',
    urlImportSuccess: 'Layout erfolgreich aus URL-Parametern importiert!',
    layoutList: 'Layout-Liste',
    newLayout: 'Neues Layout',
    switchLayout: 'Layout wechseln',
    realtimeSync: 'Echtzeit-Synchronisation',
    modified: 'Geändert (Änderungen werden bei Synchronisations-Update überschrieben)',
    websites: ' Websites',
    enableKeepAlive: 'Am Leben halten aktivieren (weiterlaufen beim Layoutwechsel)',
    disableKeepAlive: 'Am Leben halten deaktivieren (beim Layoutwechsel entladen)',
    syncUpdate: 'Update prüfen und synchronisieren',
    syncUpdateModified: 'Update prüfen und synchronisieren (überschreibt Ihre Änderungen)',
    shareLayout: 'Layout teilen',
    renameLayout: 'Umbenennen',
    deleteLayout: 'Löschen',
    websiteCount: ' Websites'
  },

  // Download-Modal
  downloadModal: {
    title: 'Plugin für normale Nutzung erforderlich',
    message: 'Diese Anwendung muss in einer bestimmten Umgebung ausgeführt werden, um iframe-Webseiten zu laden.<br/>Bitte wählen Sie eine der folgenden Installationsmethoden:',
    corsPlugin: {
      title: '🔌 CORS-Entsperr-Plugin (Empfohlen)',
      description: 'Website-iframe-Einschränkungen entfernen, kompatibel mit Chrome, Edge und anderen Browsern',
      download: '📥 CORS-Entsperr-Plugin herunterladen',
      installHint: 'Nach dem Herunterladen bitte extrahieren und den extrahierten Ordner in Ihrem Browser laden'
    },
    selectorPlugin: {
      title: '🎯 Selektor-Plugin (Optional)',
      description: 'Unterstützt CSS-Selektor-Positionierung und Vollbildanzeige bestimmter Webseitenelemente',
      download: '📥 Selektor-Plugin herunterladen',
      installHint: 'Mit CORS-Plugin verwenden, um sich auf bestimmte Bereiche wie Videoplayer, Artikelinhalt usw. zu konzentrieren\nFüllen Sie das Feld "Ziel-Selektor" beim Bearbeiten einer Website aus (z.B. #player)'
    },
    desktopApp: {
      title: '💻 Desktop-Anwendung',
      description: 'Standalone, voll funktionsfähig, keine Plugin-Installation erforderlich',
      download: '📥 Desktop-App herunterladen'
    },
    tutorial: '📖 Detailliertes Installations-Tutorial anzeigen',
    dismiss: 'Verstanden (Weiter surfen)',
    or: 'oder'
  },

  // Update-Benachrichtigung
  updateNotification: {
    title: 'Neue Version verfügbar',
    currentVersion: 'Aktuelle Version:',
    latestVersion: 'Neueste Version:',
    updateContent: 'Update-Inhalt:',
    downloading: 'Update wird heruntergeladen...',
    downloaded: 'Heruntergeladen',
    downloadCompleted: 'Download abgeschlossen!',
    downloadCompletedMessage: 'Update-Paket ist bereit, klicken Sie auf die Schaltfläche unten zum Installieren',
    downloadFailed: 'Download fehlgeschlagen',
    downloadNow: 'Update jetzt herunterladen',
    cancelDownload: 'Download abbrechen',
    installAndRestart: 'Installieren und neu starten',
    retryDownload: 'Download wiederholen',
    later: 'Später erinnern',
    close: 'Schließen'
  },

  // Website-Karte
  websiteCard: {
    fullscreen: 'Vollbild',
    edit: 'Bearbeiten',
    copy: 'Kopieren',
    remove: 'Entfernen',
    refresh: 'Aktualisieren',
    toggleMute: 'Stumm schalten'
  },

  // Element-Selektor
  elementSelector: {
    title: 'Element-Selektor',
    start: 'Auswahl starten',
    stop: 'Auswahl stoppen',
    select: 'Element auswählen',
    confirm: 'Auswahl bestätigen',
    cancel: 'Abbrechen'
  },

  // Selektor-Symbolleiste
  selectorToolbar: {
    startSelect: 'Auswahl starten',
    stopSelect: 'Auswahl stoppen',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen'
  },

  // Importmodus-Dialog
  importMode: {
    title: 'Importmodus auswählen',
    description: 'Wie möchten Sie dieses Layout importieren?',
    realtimeSync: {
      title: 'Echtzeit-Synchronisations-Import',
      description: 'Mit der Originalvorlage synchron bleiben, Updates manuell synchronisieren, wenn der Autor die Vorlage aktualisiert',
      note: '⚠️ Wenn Sie das Layout ändern, werden Ihre Änderungen beim Synchronisieren von Updates überschrieben'
    },
    copy: {
      title: 'Kopier-Import',
      description: 'Eine unabhängige Kopie erstellen, die frei geändert werden kann',
      note: '💡 Nicht betroffen von Originalvorlagen-Updates'
    },
    cancel: 'Abbrechen'
  },

  // Sitzungsinstanz-Manager
  sessionInstanceManager: {
    title: 'Cookie-Gemeinsame Instanz-Verwaltung',
    whatIs: 'Was ist eine Cookie-Gemeinsame Instanz?',
    description: 'Waben in derselben Instanz teilen Cookies, LocalStorage und andere Speicher. Instanzen sind vollständig voneinander isoliert.',
    useCases: 'Anwendungsfälle:',
    useCasesDesc: 'Multi-Konto-Anmeldung, Testumgebungs-Isolation usw.',
    rename: 'Umbenennen',
    delete: 'Löschen',
    deleteDisabled: 'Es gibt Waben, die diese Instanz verwenden, kann nicht gelöscht werden',
    deleteConfirm: 'Sind Sie sicher, dass Sie die Instanz "{name}" löschen möchten?',
    create: 'Neue Instanz',
    close: 'Schließen',
    usageCount: ' Waben'
  },

  // Auto-Aktualisierungs-Voreinstellungen
  autoRefreshPresets: {
    noRefresh: 'Keine Aktualisierung',
    thirtySeconds: '30 Sekunden',
    oneMinute: '1 Minute',
    fiveMinutes: '5 Minuten',
    thirtyMinutes: '30 Minuten',
    oneHour: '1 Stunde',
    oneDay: '1 Tag'
  },

  // Schwebende Aktionen
  floatingActions: {
    refresh: 'Seite aktualisieren',
    goBack: 'Zurück',
    goForward: 'Vorwärts',
    mute: 'Stumm schalten',
    unmute: 'Stumm aufheben',
    copy: 'Wabe kopieren',
    script: 'Skript-Ausführer',
    devtools: 'Entwicklertools',
    edit: 'Link bearbeiten',
    fullscreen: 'Vollbild-Ansicht',
    remove: 'Website entfernen'
  },

  // Selektor-Symbolleiste
  selectorToolbar: {
    title: 'Element-Selektor',
    dragHandle: 'Zum Verschieben des Panels ziehen',
    showHighlight: 'Hervorhebung anzeigen',
    hideHighlight: 'Hervorhebung ausblenden',
    confirm: 'Auswahl bestätigen',
    cancel: 'Auswahl abbrechen',
    multiSelectMode: 'Mehrfachauswahlmodus',
    multiSelectHint: '(Mehrere Elemente behalten)',
    cssSelector: 'CSS-Selektor',
    placeholder: 'Klicken Sie auf Seitenelemente zum Auswählen...',
    clear: 'Selektor löschen',
    selectedElements: 'Ausgewählte Elemente',
    currentSelector: 'Aktueller Selektor',
    addToList: 'Zur Liste hinzufügen',
    selectParent: 'Übergeordnetes Element auswählen',
    parentElement: 'Übergeordnetes Element',
    selectSibling: 'Geschwisterelement auswählen',
    siblingElement: 'Geschwisterelement',
    selectChild: 'Untergeordnetes Element auswählen',
    childElement: 'Untergeordnetes Element',
    reselect: 'Element erneut auswählen',
    reselectShort: 'Erneut auswählen',
    settings: 'Selektor-Einstellungen',
    selectorRules: 'Selektor-Generierungsregeln',
    includeId: 'Element-ID einschließen',
    includeClass: 'Klasse einschließen',
    includeTag: 'Tag-Name einschließen',
    includeAttributes: 'Attribute einschließen',
    tag: 'Tag',
    id: 'ID',
    class: 'Klasse',
    size: 'Größe',
    confirmSelection: 'Auswahl bestätigen',
    multiSelectModeHint: 'Mehrfachauswahlmodus: Klicken Sie auf Elemente zum Hinzufügen zur Liste | ESC drücken zum Abbrechen',
    multiSelectModeSelected: 'Mehrfachauswahlmodus: {count} Elemente ausgewählt | Klicken Sie auf "Zur Liste hinzufügen" zum Fortsetzen | "Auswahl bestätigen" zum Speichern aller',
    singleSelectModeHint: 'Klicken Sie auf Elemente zum Auswählen | ESC drücken zum Abbrechen',
    confirmSelectionHint: 'Sie können die Auswahl weiter anpassen | Klicken Sie auf "Auswahl bestätigen" zum Speichern | ESC drücken zum Abbrechen'
  },

  // Vollbild-Leiste
  fullscreenBar: {
    selectElement: 'Element auswählen',
    refresh: 'Aktualisieren',
    exitFullscreen: 'Vollbild beenden'
  },

  // URL-Änderungs-Hinweis
  urlChangeHint: {
    useCurrentUrl: 'URL der derzeit angezeigten Webseite verwenden',
    useThisPage: 'Diese Seite verwenden'
  },

  // Aktualisierungs-Timer
  refreshTimer: {
    day: 'd',
    hour: 'h',
    hours: 'Stunden',
    minute: 'm',
    seconds: 's'
  },

  // Sonstiges
  other: {
    gridView: 'Rasteransicht',
    canvasView: 'Leinwandansicht',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    operationFailed: 'Vorgang fehlgeschlagen',
    operationSuccess: 'Vorgang erfolgreich',
    pleaseWait: 'Bitte warten...',
    saving: 'Speichert...',
    saved: 'Gespeichert',
    unsavedChanges: 'Ungespeicherte Änderungen',
    confirmDelete: 'Sind Sie sicher, dass Sie löschen möchten?',
    confirmAction: 'Sind Sie sicher, dass Sie diese Aktion ausführen möchten?',
    urlImportSuccess: 'Layout erfolgreich aus URL-Parametern importiert!',
    unknownError: 'Unbekannter Fehler',
    networkError: 'Netzwerkfehler',
    pleaseCheckNetwork: 'Bitte überprüfen Sie die Netzwerkverbindung',
    noData: 'Keine Daten',
    empty: 'Leer',
    all: 'Alle',
    none: 'Keine',
    selectAll: 'Alle auswählen',
    deselectAll: 'Auswahl aufheben',
    filter: 'Filtern',
    sort: 'Sortieren',
    ascending: 'Aufsteigend',
    descending: 'Absteigend',
    byName: 'Nach Name',
    byDate: 'Nach Datum',
    bySize: 'Nach Größe'
  }
}
