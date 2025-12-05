export default {
  // Comum
  common: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    close: 'Fechar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    remove: 'Remover',
    copy: 'Copiar',
    refresh: 'Atualizar',
    search: 'Pesquisar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    tip: 'Dica',
    hint: 'Dica',
    yes: 'Sim',
    no: 'Não',
    ok: 'OK',
    retry: 'Tentar novamente',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    finish: 'Finalizar',
    skip: 'Pular',
    apply: 'Aplicar',
    reset: 'Redefinir',
    clear: 'Limpar',
    submit: 'Enviar',
    download: 'Baixar',
    upload: 'Enviar',
    install: 'Instalar',
    uninstall: 'Desinstalar',
    update: 'Atualizar',
    create: 'Criar',
    rename: 'Renomear',
    manage: 'Gerenciar',
    settings: 'Configurações',
    help: 'Ajuda',
    about: 'Sobre',
    name: 'Nome',
    title: 'Título',
    description: 'Descrição',
    url: 'URL',
    address: 'Endereço',
    type: 'Tipo',
    status: 'Status',
    time: 'Hora',
    date: 'Data',
    size: 'Tamanho',
    count: 'Quantidade',
    total: 'Total',
    current: 'Atual',
    latest: 'Mais recente',
    version: 'Versão',
    unknown: 'Desconhecido',
    untitled: 'Sem título'
  },

  // Nome e título do aplicativo
  app: {
    name: 'Tab Hive',
    title: 'Tab Hive'
  },

  // Diálogo
  dialog: {
    title: 'Dica',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Diálogo de edição de site
  websiteEdit: {
    addWebsite: 'Adicionar Site',
    editWebsite: 'Editar Site',
    quickStart: 'Início Rápido:',
    quickAddBaidu: 'Adicionar Rapidamente Baidu',
    quickAddGoogle: 'Adicionar Rapidamente Google',
    baidu: 'Baidu',
    google: 'Google',
    commonSettings: '⚙️ Configurações Comuns',
    optionalSettings: '🔧 Configurações Opcionais',
    advancedSettings: '📦 Recursos Avançados',
    websiteName: 'Nome do Site:',
    websiteUrl: 'URL do Site:',
    websiteNamePlaceholder: 'ex.: Google',
    websiteUrlPlaceholder: 'ex.: bbc.com ou https://bbc.com',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Informações básicas do site
  websiteBasicInfo: {
    name: 'Nome do Site:',
    url: 'URL do Site:',
    namePlaceholder: 'ex.: Google',
    urlPlaceholder: 'ex.: bbc.com ou https://bbc.com'
  },

  // Seletor de tipo de dispositivo
  deviceType: {
    title: 'Tipo de Dispositivo:',
    desktop: '🖥️ Desktop',
    mobile: '📱 Mobile',
    mobileHint: '💡 A versão móvel converterá automaticamente o domínio para a versão móvel (ex.: www.xxx.com → m.xxx.com) e limitará a largura da viewport para 375px'
  },

  // Configurações de áudio e visual
  audioVisual: {
    audioSettings: 'Configurações de Áudio:',
    muted: '🔇 Silenciar este site',
    mutedHint: '💡 Quando habilitado, este site não reproduzirá nenhum som',
    visualSettings: 'Configurações Visuais:',
    darkMode: '🌙 Tema Escuro',
    darkModeHint: '💡 Forçar tema escuro para o site, adequado para navegação noturna'
  },

  // Seletor de instância de sessão
  sessionInstance: {
    title: 'Instância Compartilhada de Cookie:',
    default: 'Padrão',
    create: '➕ Novo',
    createHint: 'Criar nova instância',
    manage: '⚙️ Gerenciar',
    manageHint: 'Gerenciar todas as instâncias',
    createNewInstance: 'Criar Nova Instância Compartilhada de Cookie',
    createNewInstanceMessage: 'Por favor, insira o nome da instância (ex.: Conta 2, Ambiente de Teste, etc.)',
    inputPlaceholder: 'Por favor, insira o nome da instância',
    defaultInstanceName: 'Instância Compartilhada',
    hint: '💡 Os favos na mesma instância compartilham cookies e armazenamento, as instâncias são completamente isoladas\n• Instância compartilhada padrão: Todos os sites compartilham\n• Nova instância: Pode ser usada para cenários de login com múltiplas contas'
  },

  // Configuração de padding
  padding: {
    title: 'Configuração de Padding (Opcional):',
    unit: 'px',
    hint: '💡 Ajuste a distância entre o conteúdo da página e as bordas do cartão (unidade: pixels)\n• O padrão é 0 (sem padding)\n• Faixa recomendada: 0-50px'
  },

  // Lista de seletores de destino
  targetSelector: {
    title: 'Seletor de Destino (Opcional):',
    placeholder: 'ex.: #main-content ou .video-player',
    addSelector: '➕ Adicionar Seletor',
    removeSelector: 'Remover este seletor',
    hint: '💡 Você pode adicionar múltiplos seletores CSS. No modo Grid, apenas os elementos correspondentes são exibidos, outro conteúdo está oculto\n• Múltiplos seletores manterão todos os elementos correspondentes\n• Tela cheia mostra a página completa\n• Deixe vazio para sempre mostrar a página inteira'
  },

  // Configuração de atualização automática
  autoRefresh: {
    title: 'Intervalo de Atualização Automática (Opcional):',
    custom: 'Personalizado:',
    seconds: 'Segundos',
    minutes: 'Minutos',
    hours: 'Horas',
    days: 'Dias',
    hint: '💡 Defina o intervalo de tempo de atualização automática do iframe\n• Clique em presets para seleção rápida, ou personalize o tempo e a unidade\n• Defina como 0 para desativar a atualização automática\n• Mínimo recomendado: 30 segundos (para evitar atualizações frequentes que afetem o desempenho)\n• Casos de uso: Monitoramento em tempo real, painéis de dados e outras páginas que precisam de atualizações regulares'
  },

  // Painel de configuração
  configPanel: {
    language: 'Idioma',
    languageHint: 'Selecionar idioma da interface',
    showTitles: 'Mostrar Títulos',
    showTitlesHint: 'Mostrar/Ocultar títulos dos favos',
    refreshOnFullscreenToggle: 'Atualizar ao Alternar Tela Cheia',
    refreshOnFullscreenToggleHint: 'Se deve atualizar a página ao alternar tela cheia para favos do tipo seletor',
    globalMuted: 'Silenciar Globalmente',
    globalMutedHint: 'Silenciar/Ativar som de todos os sites globalmente',
    instanceManagement: 'Gerenciamento de Instâncias',
    instanceManagementHint: 'Gerenciar instâncias compartilhadas de Cookie',
    help: 'Ajuda',
    helpHint: 'Guia do usuário',
    downloadPlugin: 'Baixar Plugin',
    downloadPluginHint: 'Baixar cliente desktop ou plugin',
    clearConfig: 'Limpar Configuração',
    clearConfigHint: 'Limpar todas as configurações',
    windowManagement: 'Gerenciamento de Janelas',
    createNewWindow: 'Nova Janela',
    createNewWindowHint: 'Criar uma nova janela Tab Hive',
    allWindows: 'Todas as Janelas',
    window: 'Janela',
    current: 'Atual',
    switchToWindow: 'Alternar para Janela',
    layoutDropdown: {
      createLayout: 'Criar Novo Layout',
      createLayoutMessage: 'Por favor, insira o nome do novo layout',
      createLayoutPlaceholder: 'Novo Layout',
      deleteLayout: 'Tem certeza de que deseja excluir o layout "{name}"?',
      clearConfig: 'Tem certeza de que deseja limpar todas as configurações? Isso excluirá todos os sites e configurações de layout.'
    },
    unnamed: 'Sem nome'
  },

  // Operações de layout
  layout: {
    create: 'Criar Novo Layout',
    createMessage: 'Por favor, insira o nome do novo layout',
    createPlaceholder: 'Novo Layout',
    delete: 'Tem certeza de que deseja excluir o layout "{name}"?',
    rename: 'Renomear Layout',
    share: 'Compartilhar Layout',
    syncTemplate: 'Sincronizar Atualização de Modelo',
    keepAlive: 'Manter Ativo',
    keepAliveEnabled: 'Layout "{name}" manter ativo habilitado\n\nAo alternar para outros layouts, este layout permanecerá em execução e não será descarregado.',
    keepAliveDisabled: 'Layout "{name}" manter ativo desabilitado\n\nAo alternar para outros layouts, este layout será descarregado para economizar recursos.',
    atLeastOne: 'Pelo menos um layout deve ser mantido',
    clearConfig: 'Tem certeza de que deseja limpar todas as configurações? Isso excluirá todos os sites e configurações de layout.',
    sharedLayouts: 'Layouts Compartilhados',
    localLayouts: 'Layouts Locais',
    myLayouts: 'Meus Layouts',
    switchToShared: 'Alternar para Compartilhado',
    searchShared: 'Pesquisar Layouts Compartilhados',
    importLayout: 'Importar Layout',
    noSharedLayouts: 'Sem layouts compartilhados',
    loadingShared: 'Carregando...',
    searchPlaceholder: 'Pesquisar nome ou descrição do layout...',
    urlImportSuccess: 'Layout importado com sucesso a partir dos parâmetros de URL!',
    layoutList: 'Lista de Layouts',
    newLayout: 'Novo Layout',
    switchLayout: 'Alternar Layout',
    realtimeSync: 'Sincronização em Tempo Real',
    modified: 'Modificado (as alterações serão sobrescritas na atualização de sincronização)',
    websites: ' sites',
    enableKeepAlive: 'Habilitar Manter Ativo (manter em execução ao alternar layouts)',
    disableKeepAlive: 'Desabilitar Manter Ativo (descarregar ao alternar layouts)',
    syncUpdate: 'Verificar e Sincronizar Atualização',
    syncUpdateModified: 'Verificar e Sincronizar Atualização (sobrescreverá suas alterações)',
    shareLayout: 'Compartilhar Layout',
    renameLayout: 'Renomear',
    deleteLayout: 'Excluir',
    websiteCount: ' sites'
  },

  // Modal de download
  downloadModal: {
    title: 'Plugin Necessário para Uso Normal',
    message: 'Esta aplicação precisa ser executada em um ambiente específico para carregar páginas iframe.<br/>Por favor, escolha um dos seguintes métodos de instalação:',
    corsPlugin: {
      title: '🔌 Plugin de Desbloqueio CORS (Recomendado)',
      description: 'Remover restrições de iframe do site, compatível com Chrome, Edge e outros navegadores',
      download: '📥 Baixar Plugin de Desbloqueio CORS',
      installHint: 'Após o download, por favor extraia e carregue a pasta extraída no seu navegador'
    },
    selectorPlugin: {
      title: '🎯 Plugin Seletor (Opcional)',
      description: 'Suporta posicionamento de seletor CSS e exibição em tela cheia de elementos específicos da página',
      download: '📥 Baixar Plugin Seletor',
      installHint: 'Use com o plugin CORS para focar em áreas específicas como players de vídeo, conteúdo de artigos, etc.\nPreencha o campo "Seletor de Destino" ao editar um site (ex.: #player)'
    },
    desktopApp: {
      title: '💻 Aplicativo Desktop',
      description: 'Independente, totalmente funcional, não requer instalação de plugin',
      download: '📥 Baixar Aplicativo Desktop'
    },
    tutorial: '📖 Ver Tutorial de Instalação Detalhado',
    dismiss: 'Entendi (Continuar navegando)',
    or: 'ou'
  },

  // Notificação de atualização
  updateNotification: {
    title: 'Nova Versão Disponível',
    currentVersion: 'Versão Atual:',
    latestVersion: 'Última Versão:',
    updateContent: 'Conteúdo da Atualização:',
    downloading: 'Baixando atualização...',
    downloaded: 'Baixado',
    downloadCompleted: 'Download Concluído!',
    downloadCompletedMessage: 'O pacote de atualização está pronto, clique no botão abaixo para instalar',
    downloadFailed: 'Download Falhou',
    downloadNow: 'Baixar Atualização Agora',
    cancelDownload: 'Cancelar Download',
    installAndRestart: 'Instalar e Reiniciar',
    retryDownload: 'Tentar Baixar Novamente',
    later: 'Lembrar Mais Tarde',
    close: 'Fechar'
  },

  // Cartão do site
  websiteCard: {
    fullscreen: 'Tela Cheia',
    edit: 'Editar',
    copy: 'Copiar',
    remove: 'Remover',
    refresh: 'Atualizar',
    toggleMute: 'Alternar Silêncio'
  },

  // Seletor de elemento
  elementSelector: {
    title: 'Seletor de Elemento',
    start: 'Iniciar Seleção',
    stop: 'Parar Seleção',
    select: 'Selecionar Elemento',
    confirm: 'Confirmar Seleção',
    cancel: 'Cancelar'
  },

  // Barra de ferramentas do seletor
  selectorToolbar: {
    startSelect: 'Iniciar Seleção',
    stopSelect: 'Parar Seleção',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Diálogo de modo de importação
  importMode: {
    title: 'Selecionar Modo de Importação',
    description: 'Como você gostaria de importar este layout?',
    realtimeSync: {
      title: 'Importação de Sincronização em Tempo Real',
      description: 'Manter sincronizado com o modelo original, sincronizar atualizações manualmente quando o autor atualizar o modelo',
      note: '⚠️ Se você modificar o layout, suas alterações serão sobrescritas ao sincronizar atualizações'
    },
    copy: {
      title: 'Importação de Cópia',
      description: 'Criar uma cópia independente que pode ser modificada livremente',
      note: '💡 Não é afetado pelas atualizações do modelo original'
    },
    cancel: 'Cancelar'
  },

  // Gerenciador de instâncias de sessão
  sessionInstanceManager: {
    title: 'Gerenciamento de Instâncias Compartilhadas de Cookie',
    whatIs: 'O que é uma Instância Compartilhada de Cookie?',
    description: 'Os favos na mesma instância compartilham cookies, LocalStorage e outros armazenamentos. As instâncias são completamente isoladas umas das outras.',
    useCases: 'Casos de Uso:',
    useCasesDesc: 'Login com múltiplas contas, isolamento de ambiente de teste, etc.',
    rename: 'Renomear',
    delete: 'Excluir',
    deleteDisabled: 'Há favos usando esta instância, não é possível excluir',
    deleteConfirm: 'Tem certeza de que deseja excluir a instância "{name}"?',
    create: 'Nova Instância',
    close: 'Fechar',
    usageCount: ' favos'
  },

  // Presets de atualização automática
  autoRefreshPresets: {
    noRefresh: 'Sem Atualização',
    thirtySeconds: '30 Segundos',
    oneMinute: '1 Minuto',
    fiveMinutes: '5 Minutos',
    thirtyMinutes: '30 Minutos',
    oneHour: '1 Hora',
    oneDay: '1 Dia'
  },

  // Ações flutuantes
  floatingActions: {
    refresh: 'Atualizar Página',
    mute: 'Silenciar',
    unmute: 'Ativar Som',
    copy: 'Copiar Favo',
    script: 'Executor de Script',
    edit: 'Editar Link',
    fullscreen: 'Visualização em Tela Cheia',
    remove: 'Remover Site'
  },

  // Barra de ferramentas do seletor
  selectorToolbar: {
    title: 'Seletor de Elemento',
    dragHandle: 'Arrastar para mover painel',
    showHighlight: 'Mostrar Destaque',
    hideHighlight: 'Ocultar Destaque',
    confirm: 'Confirmar Seleção',
    cancel: 'Cancelar Seleção',
    multiSelectMode: 'Modo de Seleção Múltipla',
    multiSelectHint: '(Manter múltiplos elementos)',
    cssSelector: 'Seletor CSS',
    placeholder: 'Clique nos elementos da página para selecionar...',
    clear: 'Limpar Seletor',
    selectedElements: 'Elementos Selecionados',
    currentSelector: 'Seletor Atual',
    addToList: 'Adicionar à Lista',
    selectParent: 'Selecionar Elemento Pai',
    parentElement: 'Elemento Pai',
    selectSibling: 'Selecionar Elemento Irmão',
    siblingElement: 'Elemento Irmão',
    selectChild: 'Selecionar Elemento Filho',
    childElement: 'Elemento Filho',
    reselect: 'Reselecionar Elemento',
    reselectShort: 'Reselecionar',
    settings: 'Configurações do Seletor',
    selectorRules: 'Regras de Geração do Seletor',
    includeId: 'Incluir ID do Elemento',
    includeClass: 'Incluir Classe',
    includeTag: 'Incluir Nome da Tag',
    includeAttributes: 'Incluir Atributos',
    tag: 'Tag',
    id: 'ID',
    class: 'Classe',
    size: 'Tamanho',
    confirmSelection: 'Confirmar Seleção',
    multiSelectModeHint: 'Modo de seleção múltipla: Clique em elementos para adicionar à lista | Pressione ESC para cancelar',
    multiSelectModeSelected: 'Modo de seleção múltipla: {count} elementos selecionados | Clique em "Adicionar à Lista" para continuar | "Confirmar Seleção" para salvar todos',
    singleSelectModeHint: 'Clique em elementos para selecionar | Pressione ESC para cancelar',
    confirmSelectionHint: 'Você pode continuar ajustando a seleção | Clique em "Confirmar Seleção" para salvar | Pressione ESC para cancelar'
  },

  // Barra de tela cheia
  fullscreenBar: {
    selectElement: 'Selecionar Elemento',
    refresh: 'Atualizar',
    exitFullscreen: 'Sair da Tela Cheia'
  },

  // Dica de mudança de URL
  urlChangeHint: {
    useCurrentUrl: 'Usar URL da página atualmente exibida',
    useThisPage: 'Usar esta página'
  },

  // Temporizador de atualização
  refreshTimer: {
    day: 'd',
    hour: 'h',
    hours: 'horas',
    minute: 'm',
    seconds: 's'
  },

  // Outros
  other: {
    gridView: 'Visualização em Grade',
    canvasView: 'Visualização em Canvas',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    operationFailed: 'Operação Falhou',
    operationSuccess: 'Operação Bem-sucedida',
    pleaseWait: 'Por favor, aguarde...',
    saving: 'Salvando...',
    saved: 'Salvo',
    unsavedChanges: 'Alterações não salvas',
    confirmDelete: 'Tem certeza de que deseja excluir?',
    confirmAction: 'Tem certeza de que deseja executar esta ação?',
    urlImportSuccess: 'Layout importado com sucesso a partir dos parâmetros de URL!',
    unknownError: 'Erro Desconhecido',
    networkError: 'Erro de Rede',
    pleaseCheckNetwork: 'Por favor, verifique a conexão de rede',
    noData: 'Sem Dados',
    empty: 'Vazio',
    all: 'Todos',
    none: 'Nenhum',
    selectAll: 'Selecionar Todos',
    deselectAll: 'Desselecionar Todos',
    filter: 'Filtrar',
    sort: 'Ordenar',
    ascending: 'Crescente',
    descending: 'Decrescente',
    byName: 'Por Nome',
    byDate: 'Por Data',
    bySize: 'Por Tamanho'
  }
}
