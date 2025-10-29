const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

console.log('[Electron Main] ========== Tab Hive 启动 (Webview 架构) ==========')

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 (KHTML, like Gecko) Safari/537.36'

let mainWindow

// 存储已注册的 webview
// key: webviewId, value: { processId, frameId, webContents }
const registeredWebviews = new Map()

function createWindow() {
  console.log('[Electron Main] ========== 创建主窗口 ==========')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/256x256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      webviewTag: true, // 启用 webview 标签支持
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true
  })

  console.log('[Electron Main] ✓ 主窗口创建完成')

  // 加载页面
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式,加载 http://localhost:3000')
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    console.log('[Electron Main] 生产模式,加载本地文件')
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[Electron Main] 文件路径:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  console.log('[Electron Main] ========== 设置 CORS 和 Cookie 处理 ==========')

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron Main] ✓ 窗口准备完成,显示窗口')
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    console.log('[Electron Main] 窗口已关闭')
    registeredWebviews.clear()
    mainWindow = null
  })

  console.log('[Electron Main] ========== 主窗口创建流程完成 ==========')
}

// ========== IPC 处理器 ==========

// Webview 注册
ipcMain.handle('webview-register', (event, webviewId) => {
  console.log('[IPC] ========== Webview 注册 ==========')
  console.log('[IPC] Webview ID:', webviewId)
  console.log('[IPC] Process ID:', event.processId)
  console.log('[IPC] Frame ID:', event.frameId)

  // 保存 webview 信息
  registeredWebviews.set(webviewId, {
    processId: event.processId,
    frameId: event.frameId,
    webContents: event.sender
  })

  console.log('[IPC] ✓ Webview 注册成功')
  console.log('[IPC] 当前已注册的 Webview 数量:', registeredWebviews.size)

  // 向 webview 发送欢迎消息
  event.sender.sendToFrame(
    [event.processId, event.frameId],
    'main-to-webview',
    'welcome',
    { webviewId, message: '欢迎来到 Tab Hive!' }
  )

  return { success: true, webviewId }
})

// 在 webview 中执行 JavaScript
ipcMain.handle('execute-in-webview', async (event, webviewId, code) => {
  console.log('[IPC] ========== 在 Webview 中执行代码 ==========')
  console.log('[IPC] Webview ID:', webviewId)
  console.log('[IPC] 代码长度:', code.length, 'bytes')

  const webview = registeredWebviews.get(webviewId)

  if (!webview) {
    console.error('[IPC] ✗ Webview 未注册:', webviewId)
    return { success: false, error: 'Webview not registered' }
  }

  try {
    // 通过 webContents 发送执行命令
    webview.webContents.sendToFrame(
      [webview.processId, webview.frameId],
      'main-to-webview',
      'execute',
      code
    )

    console.log('[IPC] ✓ 执行命令已发送')
    return { success: true }
  } catch (error) {
    console.error('[IPC] ✗ 执行失败:', error.message)
    return { success: false, error: error.message }
  }
})

// 刷新 webview
ipcMain.handle('refresh-webview', async (event, webviewId) => {
  console.log('[IPC] ========== 刷新 Webview ==========')
  console.log('[IPC] Webview ID:', webviewId)

  // 发送刷新命令到渲染进程
  // 由渲染进程调用 webview.reload()
  mainWindow.webContents.send('refresh-webview-from-main', webviewId)

  return { success: true }
})

// 获取所有已注册的 webview
ipcMain.handle('get-registered-webviews', () => {
  const webviewIds = Array.from(registeredWebviews.keys())
  console.log('[IPC] 获取已注册的 Webview 列表:', webviewIds)
  return { success: true, webviews: webviewIds }
})

// 取消注册 webview
ipcMain.handle('webview-unregister', (event, webviewId) => {
  console.log('[IPC] ========== Webview 取消注册 ==========')
  console.log('[IPC] Webview ID:', webviewId)

  const removed = registeredWebviews.delete(webviewId)

  if (removed) {
    console.log('[IPC] ✓ Webview 已取消注册')
    console.log('[IPC] 剩余已注册的 Webview 数量:', registeredWebviews.size)
  } else {
    console.warn('[IPC] ⚠ Webview 未找到:', webviewId)
  }

  return { success: removed }
})

// ========== 应用生命周期 ==========

console.log('[Electron Main] 等待应用就绪...')

app.whenReady().then(() => {
  console.log('[Electron Main] ========== 应用已就绪 ==========')
  createWindow()

  app.on('activate', () => {
    console.log('[Electron Main] activate 事件触发')
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Electron Main] 没有窗口,创建新窗口')
      createWindow()
    }
  })

  console.log('[Electron Main] ✓ 事件监听器已设置')
})

app.on('window-all-closed', () => {
  console.log('[Electron Main] 所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

console.log('[Electron Main] ========== 主进程初始化完成 ==========')
