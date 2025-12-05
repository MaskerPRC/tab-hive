export default {
  // Común
  common: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    remove: 'Eliminar',
    copy: 'Copiar',
    refresh: 'Actualizar',
    search: 'Buscar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    tip: 'Consejo',
    hint: 'Pista',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    retry: 'Reintentar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    finish: 'Finalizar',
    skip: 'Omitir',
    apply: 'Aplicar',
    reset: 'Restablecer',
    clear: 'Limpiar',
    submit: 'Enviar',
    download: 'Descargar',
    upload: 'Subir',
    install: 'Instalar',
    uninstall: 'Desinstalar',
    update: 'Actualizar',
    create: 'Crear',
    rename: 'Renombrar',
    manage: 'Gestionar',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    name: 'Nombre',
    title: 'Título',
    description: 'Descripción',
    url: 'URL',
    address: 'Dirección',
    type: 'Tipo',
    status: 'Estado',
    time: 'Hora',
    date: 'Fecha',
    size: 'Tamaño',
    count: 'Cantidad',
    total: 'Total',
    current: 'Actual',
    latest: 'Más reciente',
    version: 'Versión',
    unknown: 'Desconocido',
    untitled: 'Sin título'
  },

  // Nombre y título de la aplicación
  app: {
    name: 'Tab Hive',
    title: 'Tab Hive'
  },

  // Diálogo
  dialog: {
    title: 'Consejo',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Diálogo de edición de sitio web
  websiteEdit: {
    addWebsite: 'Añadir Sitio Web',
    editWebsite: 'Editar Sitio Web',
    quickStart: 'Inicio Rápido:',
    quickAddBaidu: 'Añadir Rápidamente Baidu',
    quickAddGoogle: 'Añadir Rápidamente Google',
    baidu: 'Baidu',
    google: 'Google',
    commonSettings: '⚙️ Configuración Común',
    optionalSettings: '🔧 Configuración Opcional',
    advancedSettings: '📦 Funciones Avanzadas',
    websiteName: 'Nombre del Sitio Web:',
    websiteUrl: 'URL del Sitio Web:',
    websiteNamePlaceholder: 'por ej., Google',
    websiteUrlPlaceholder: 'por ej., bbc.com o https://bbc.com',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Información básica del sitio web
  websiteBasicInfo: {
    name: 'Nombre del Sitio Web:',
    url: 'URL del Sitio Web:',
    namePlaceholder: 'por ej., Google',
    urlPlaceholder: 'por ej., bbc.com o https://bbc.com'
  },

  // Selector de tipo de dispositivo
  deviceType: {
    title: 'Tipo de Dispositivo:',
    desktop: '🖥️ Escritorio',
    mobile: '📱 Móvil',
    mobileHint: '💡 La versión móvil convertirá automáticamente el dominio a la versión móvil (por ej., www.xxx.com → m.xxx.com) y limitará el ancho de la ventana a 375px'
  },

  // Configuración de audio y visual
  audioVisual: {
    audioSettings: 'Configuración de Audio:',
    muted: '🔇 Silenciar este sitio web',
    mutedHint: '💡 Cuando esté habilitado, este sitio web no reproducirá ningún sonido',
    visualSettings: 'Configuración Visual:',
    darkMode: '🌙 Tema Oscuro',
    darkModeHint: '💡 Forzar tema oscuro para el sitio web, adecuado para navegación nocturna'
  },

  // Selector de instancia de sesión
  sessionInstance: {
    title: 'Instancia Compartida de Cookie:',
    default: 'Predeterminado',
    create: '➕ Nuevo',
    createHint: 'Crear nueva instancia',
    manage: '⚙️ Gestionar',
    manageHint: 'Gestionar todas las instancias',
    createNewInstance: 'Crear Nueva Instancia Compartida de Cookie',
    createNewInstanceMessage: 'Por favor ingrese el nombre de la instancia (por ej., Cuenta 2, Entorno de Prueba, etc.)',
    inputPlaceholder: 'Por favor ingrese el nombre de la instancia',
    defaultInstanceName: 'Instancia Compartida',
    hint: '💡 Los panales en la misma instancia comparten cookies y almacenamiento, las instancias están completamente aisladas\n• Instancia compartida predeterminada: Todos los sitios web comparten\n• Nueva instancia: Puede usarse para escenarios de inicio de sesión con múltiples cuentas'
  },

  // Configuración de padding
  padding: {
    title: 'Configuración de Padding (Opcional):',
    unit: 'px',
    hint: '💡 Ajuste la distancia entre el contenido de la página web y los bordes de la tarjeta (unidad: píxeles)\n• El predeterminado es 0 (sin padding)\n• Rango recomendado: 0-50px'
  },

  // Lista de selectores objetivo
  targetSelector: {
    title: 'Selector Objetivo (Opcional):',
    placeholder: 'por ej., #main-content o .video-player',
    addSelector: '➕ Añadir Selector',
    removeSelector: 'Eliminar este selector',
    hint: '💡 Puede añadir múltiples selectores CSS. En modo Grid, solo se muestran los elementos coincidentes, otro contenido está oculto\n• Múltiples selectores mantendrán todos los elementos coincidentes\n• Pantalla completa muestra la página completa\n• Dejar vacío para mostrar siempre la página completa'
  },

  // Configuración de actualización automática
  autoRefresh: {
    title: 'Intervalo de Actualización Automática (Opcional):',
    custom: 'Personalizado:',
    seconds: 'Segundos',
    minutes: 'Minutos',
    hours: 'Horas',
    days: 'Días',
    hint: '💡 Establecer el intervalo de tiempo de actualización automática del iframe\n• Haga clic en presets para selección rápida, o personalice el tiempo y la unidad\n• Establecer en 0 para desactivar la actualización automática\n• Mínimo recomendado: 30 segundos (para evitar actualizaciones frecuentes que afecten el rendimiento)\n• Casos de uso: Monitoreo en tiempo real, tableros de datos y otras páginas que necesiten actualizaciones regulares'
  },

  // Panel de configuración
  configPanel: {
    language: 'Idioma',
    languageHint: 'Seleccionar idioma de la interfaz',
    showTitles: 'Mostrar Títulos',
    showTitlesHint: 'Mostrar/Ocultar títulos de panales',
    refreshOnFullscreenToggle: 'Actualizar al Cambiar Pantalla Completa',
    refreshOnFullscreenToggleHint: 'Si se debe actualizar la página web al cambiar pantalla completa para panales de tipo selector',
    globalMuted: 'Silencio Global',
    globalMutedHint: 'Silenciar/Activar sonido de todos los sitios web globalmente',
    instanceManagement: 'Gestión de Instancias',
    instanceManagementHint: 'Gestionar instancias compartidas de Cookie',
    help: 'Ayuda',
    helpHint: 'Guía de usuario',
    downloadPlugin: 'Descargar Plugin',
    downloadPluginHint: 'Descargar cliente de escritorio o plugin',
    clearConfig: 'Limpiar Configuración',
    clearConfigHint: 'Limpiar todas las configuraciones',
    windowManagement: 'Gestión de Ventanas',
    createNewWindow: 'Nueva Ventana',
    createNewWindowHint: 'Crear una nueva ventana Tab Hive',
    allWindows: 'Todas las Ventanas',
    window: 'Ventana',
    current: 'Actual',
    switchToWindow: 'Cambiar a Ventana',
    layoutDropdown: {
      createLayout: 'Crear Nuevo Diseño',
      createLayoutMessage: 'Por favor ingrese el nombre del nuevo diseño',
      createLayoutPlaceholder: 'Nuevo Diseño',
      deleteLayout: '¿Está seguro de que desea eliminar el diseño "{name}"?',
      clearConfig: '¿Está seguro de que desea limpiar todas las configuraciones? Esto eliminará todos los sitios web y configuraciones de diseño.'
    },
    unnamed: 'Sin nombre'
  },

  // Operaciones de diseño
  layout: {
    create: 'Crear Nuevo Diseño',
    createMessage: 'Por favor ingrese el nombre del nuevo diseño',
    createPlaceholder: 'Nuevo Diseño',
    delete: '¿Está seguro de que desea eliminar el diseño "{name}"?',
    rename: 'Renombrar Diseño',
    share: 'Compartir Diseño',
    syncTemplate: 'Sincronizar Actualización de Plantilla',
    keepAlive: 'Mantener Activo',
    keepAliveEnabled: 'Diseño "{name}" mantener activo habilitado\n\nAl cambiar a otros diseños, este diseño seguirá ejecutándose y no se descargará.',
    keepAliveDisabled: 'Diseño "{name}" mantener activo deshabilitado\n\nAl cambiar a otros diseños, este diseño se descargará para ahorrar recursos.',
    atLeastOne: 'Debe mantenerse al menos un diseño',
    clearConfig: '¿Está seguro de que desea limpiar todas las configuraciones? Esto eliminará todos los sitios web y configuraciones de diseño.',
    sharedLayouts: 'Diseños Compartidos',
    localLayouts: 'Diseños Locales',
    myLayouts: 'Mis Diseños',
    switchToShared: 'Cambiar a Compartido',
    searchShared: 'Buscar Diseños Compartidos',
    importLayout: 'Importar Diseño',
    noSharedLayouts: 'No hay diseños compartidos',
    loadingShared: 'Cargando...',
    searchPlaceholder: 'Buscar nombre o descripción de diseño...',
    urlImportSuccess: '¡Diseño importado exitosamente desde parámetros de URL!',
    layoutList: 'Lista de Diseños',
    newLayout: 'Nuevo Diseño',
    switchLayout: 'Cambiar Diseño',
    realtimeSync: 'Sincronización en Tiempo Real',
    modified: 'Modificado (los cambios serán sobrescritos en la actualización de sincronización)',
    websites: ' sitios web',
    enableKeepAlive: 'Habilitar Mantener Activo (mantener ejecutándose al cambiar diseños)',
    disableKeepAlive: 'Deshabilitar Mantener Activo (descargar al cambiar diseños)',
    syncUpdate: 'Verificar y Sincronizar Actualización',
    syncUpdateModified: 'Verificar y Sincronizar Actualización (sobrescribirá sus cambios)',
    shareLayout: 'Compartir Diseño',
    renameLayout: 'Renombrar',
    deleteLayout: 'Eliminar',
    websiteCount: ' sitios web'
  },

  // Modal de descarga
  downloadModal: {
    title: 'Plugin Requerido para Uso Normal',
    message: 'Esta aplicación necesita ejecutarse en un entorno específico para cargar páginas web iframe.<br/>Por favor elija uno de los siguientes métodos de instalación:',
    corsPlugin: {
      title: '🔌 Plugin de Desbloqueo CORS (Recomendado)',
      description: 'Eliminar restricciones iframe del sitio web, compatible con Chrome, Edge y otros navegadores',
      download: '📥 Descargar Plugin de Desbloqueo CORS',
      installHint: 'Después de descargar, por favor extraiga y cargue la carpeta extraída en su navegador'
    },
    selectorPlugin: {
      title: '🎯 Plugin Selector (Opcional)',
      description: 'Soporta posicionamiento de selector CSS y visualización en pantalla completa de elementos específicos de página web',
      download: '📥 Descargar Plugin Selector',
      installHint: 'Úselo con el plugin CORS para enfocarse en áreas específicas como reproductores de video, contenido de artículos, etc.\nComplete el campo "Selector Objetivo" al editar un sitio web (por ej., #player)'
    },
    desktopApp: {
      title: '💻 Aplicación de Escritorio',
      description: 'Independiente, completamente funcional, no requiere instalación de plugin',
      download: '📥 Descargar Aplicación de Escritorio'
    },
    tutorial: '📖 Ver Tutorial de Instalación Detallado',
    dismiss: 'Entendido (Continuar navegando)',
    or: 'o'
  },

  // Notificación de actualización
  updateNotification: {
    title: 'Nueva Versión Disponible',
    currentVersion: 'Versión Actual:',
    latestVersion: 'Última Versión:',
    updateContent: 'Contenido de Actualización:',
    downloading: 'Descargando actualización...',
    downloaded: 'Descargado',
    downloadCompleted: '¡Descarga Completada!',
    downloadCompletedMessage: 'El paquete de actualización está listo, haga clic en el botón a continuación para instalar',
    downloadFailed: 'Descarga Fallida',
    downloadNow: 'Descargar Actualización Ahora',
    cancelDownload: 'Cancelar Descarga',
    installAndRestart: 'Instalar y Reiniciar',
    retryDownload: 'Reintentar Descarga',
    later: 'Recordar Más Tarde',
    close: 'Cerrar'
  },

  // Tarjeta de sitio web
  websiteCard: {
    fullscreen: 'Pantalla Completa',
    edit: 'Editar',
    copy: 'Copiar',
    remove: 'Eliminar',
    refresh: 'Actualizar',
    toggleMute: 'Alternar Silencio'
  },

  // Selector de elementos
  elementSelector: {
    title: 'Selector de Elementos',
    start: 'Iniciar Selección',
    stop: 'Detener Selección',
    select: 'Seleccionar Elemento',
    confirm: 'Confirmar Selección',
    cancel: 'Cancelar'
  },

  // Barra de herramientas de selector
  selectorToolbar: {
    startSelect: 'Iniciar Selección',
    stopSelect: 'Detener Selección',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Diálogo de modo de importación
  importMode: {
    title: 'Seleccionar Modo de Importación',
    description: '¿Cómo le gustaría importar este diseño?',
    realtimeSync: {
      title: 'Importación de Sincronización en Tiempo Real',
      description: 'Mantenerse sincronizado con la plantilla original, sincronizar actualizaciones manualmente cuando el autor actualice la plantilla',
      note: '⚠️ Si modifica el diseño, sus cambios serán sobrescritos al sincronizar actualizaciones'
    },
    copy: {
      title: 'Importación de Copia',
      description: 'Crear una copia independiente que puede ser modificada libremente',
      note: '💡 No se ve afectado por las actualizaciones de la plantilla original'
    },
    cancel: 'Cancelar'
  },

  // Gestor de instancias de sesión
  sessionInstanceManager: {
    title: 'Gestión de Instancias Compartidas de Cookie',
    whatIs: '¿Qué es una Instancia Compartida de Cookie?',
    description: 'Los panales en la misma instancia comparten cookies, LocalStorage y otros almacenamientos. Las instancias están completamente aisladas entre sí.',
    useCases: 'Casos de Uso:',
    useCasesDesc: 'Inicio de sesión con múltiples cuentas, aislamiento de entorno de prueba, etc.',
    rename: 'Renombrar',
    delete: 'Eliminar',
    deleteDisabled: 'Hay panales usando esta instancia, no se puede eliminar',
    deleteConfirm: '¿Está seguro de que desea eliminar la instancia "{name}"?',
    create: 'Nueva Instancia',
    close: 'Cerrar',
    usageCount: ' panales'
  },

  // Presets de actualización automática
  autoRefreshPresets: {
    noRefresh: 'Sin Actualización',
    thirtySeconds: '30 Segundos',
    oneMinute: '1 Minuto',
    fiveMinutes: '5 Minutos',
    thirtyMinutes: '30 Minutos',
    oneHour: '1 Hora',
    oneDay: '1 Día'
  },

  // Acciones flotantes
  floatingActions: {
    refresh: 'Actualizar Página',
    mute: 'Silenciar',
    unmute: 'Activar Sonido',
    copy: 'Copiar Panel',
    script: 'Ejecutor de Scripts',
    edit: 'Editar Enlace',
    fullscreen: 'Vista de Pantalla Completa',
    remove: 'Eliminar Sitio Web'
  },

  // Barra de herramientas de selector
  selectorToolbar: {
    title: 'Selector de Elementos',
    dragHandle: 'Arrastrar para mover panel',
    showHighlight: 'Mostrar Resaltado',
    hideHighlight: 'Ocultar Resaltado',
    confirm: 'Confirmar Selección',
    cancel: 'Cancelar Selección',
    multiSelectMode: 'Modo de Selección Múltiple',
    multiSelectHint: '(Mantener múltiples elementos)',
    cssSelector: 'Selector CSS',
    placeholder: 'Haga clic en elementos de la página para seleccionar...',
    clear: 'Limpiar Selector',
    selectedElements: 'Elementos Seleccionados',
    currentSelector: 'Selector Actual',
    addToList: 'Añadir a Lista',
    selectParent: 'Seleccionar Elemento Padre',
    parentElement: 'Elemento Padre',
    selectSibling: 'Seleccionar Elemento Hermano',
    siblingElement: 'Elemento Hermano',
    selectChild: 'Seleccionar Elemento Hijo',
    childElement: 'Elemento Hijo',
    reselect: 'Reseleccionar Elemento',
    reselectShort: 'Reseleccionar',
    settings: 'Configuración del Selector',
    selectorRules: 'Reglas de Generación del Selector',
    includeId: 'Incluir ID del Elemento',
    includeClass: 'Incluir Clase',
    includeTag: 'Incluir Nombre de Etiqueta',
    includeAttributes: 'Incluir Atributos',
    tag: 'Etiqueta',
    id: 'ID',
    class: 'Clase',
    size: 'Tamaño',
    confirmSelection: 'Confirmar Selección',
    multiSelectModeHint: 'Modo de selección múltiple: Haga clic en elementos para añadir a la lista | Presione ESC para cancelar',
    multiSelectModeSelected: 'Modo de selección múltiple: {count} elementos seleccionados | Haga clic en "Añadir a Lista" para continuar | "Confirmar Selección" para guardar todo',
    singleSelectModeHint: 'Haga clic en elementos para seleccionar | Presione ESC para cancelar',
    confirmSelectionHint: 'Puede continuar ajustando la selección | Haga clic en "Confirmar Selección" para guardar | Presione ESC para cancelar'
  },

  // Barra de pantalla completa
  fullscreenBar: {
    selectElement: 'Seleccionar Elemento',
    refresh: 'Actualizar',
    exitFullscreen: 'Salir de Pantalla Completa'
  },

  // Pista de cambio de URL
  urlChangeHint: {
    useCurrentUrl: 'Usar URL de página web actualmente mostrada',
    useThisPage: 'Usar esta página'
  },

  // Temporizador de actualización
  refreshTimer: {
    day: 'd',
    hour: 'h',
    hours: 'horas',
    minute: 'm',
    seconds: 's'
  },

  // Otro
  other: {
    gridView: 'Vista de Cuadrícula',
    canvasView: 'Vista de Lienzo',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    operationFailed: 'Operación Fallida',
    operationSuccess: 'Operación Exitosa',
    pleaseWait: 'Por favor espere...',
    saving: 'Guardando...',
    saved: 'Guardado',
    unsavedChanges: 'Cambios no guardados',
    confirmDelete: '¿Está seguro de que desea eliminar?',
    confirmAction: '¿Está seguro de que desea realizar esta acción?',
    urlImportSuccess: '¡Diseño importado exitosamente desde parámetros de URL!',
    unknownError: 'Error Desconocido',
    networkError: 'Error de Red',
    pleaseCheckNetwork: 'Por favor verifique la conexión de red',
    noData: 'Sin Datos',
    empty: 'Vacío',
    all: 'Todo',
    none: 'Nada',
    selectAll: 'Seleccionar Todo',
    deselectAll: 'Deseleccionar Todo',
    filter: 'Filtrar',
    sort: 'Ordenar',
    ascending: 'Ascendente',
    descending: 'Descendente',
    byName: 'Por Nombre',
    byDate: 'Por Fecha',
    bySize: 'Por Tamaño'
  }
}

