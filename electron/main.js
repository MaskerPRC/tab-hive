const { app, BrowserWindow } = require('electron')
const path = require('path')

// 完全禁用CORS和安全策略
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-site-isolation-trials')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 禁用web安全策略
      allowRunningInsecureContent: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f5f5f5',
    show: false,
    frame: true,
    titleBarStyle: 'default'
  })

  // 开发模式加载开发服务器，生产模式加载构建文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 禁用所有iframe的CORS限制
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    (details, callback) => {
      callback({
        requestHeaders: {
          ...details.requestHeaders,
          'Referer': details.url,
        }
      })
    }
  )

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    { urls: ['*://*/*'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders }
      
      // 移除阻止iframe加载的headers
      delete responseHeaders['x-frame-options']
      delete responseHeaders['X-Frame-Options']
      delete responseHeaders['content-security-policy']
      delete responseHeaders['Content-Security-Policy']
      
      // 添加允许CORS的headers
      responseHeaders['Access-Control-Allow-Origin'] = ['*']
      responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS']
      responseHeaders['Access-Control-Allow-Headers'] = ['*']
      responseHeaders['Access-Control-Allow-Credentials'] = ['true']

      callback({ responseHeaders })
    }
  )

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

