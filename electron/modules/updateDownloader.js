/**
 * 更新下载模块
 * 负责应用更新文件的下载和安装
 */

const { net, shell } = require('electron')
const fs = require('fs')
const os = require('os')
const path = require('path')

// 更新下载状态
let currentDownload = {
  url: null,
  savePath: null,
  totalBytes: 0,
  downloadedBytes: 0,
  status: 'idle', // idle, downloading, completed, failed
  error: null
}

/**
 * 处理下载响应
 * @param {Electron.IncomingMessage} response - HTTP响应
 * @param {fs.WriteStream} fileStream - 文件写入流
 * @param {Function} onProgress - 进度回调
 * @param {Function} onComplete - 完成回调
 * @param {Function} onError - 错误回调
 */
function handleDownloadResponse(response, fileStream, onProgress, onComplete, onError) {
  // 获取文件总大小
  const contentLength = response.headers['content-length']
  if (contentLength) {
    const totalSize = parseInt(Array.isArray(contentLength) ? contentLength[0] : contentLength, 10)
    currentDownload.totalBytes = totalSize
    console.log('[更新下载] 文件大小:', (currentDownload.totalBytes / 1024 / 1024).toFixed(2), 'MB')

    // 立即发送初始状态
    if (onProgress) {
      onProgress({
        downloaded: 0,
        total: currentDownload.totalBytes,
        progress: 0
      })
    }
  } else {
    console.warn('[更新下载] ⚠ 无法获取文件大小')
  }

  response.on('data', (chunk) => {
    currentDownload.downloadedBytes += chunk.length
    fileStream.write(chunk)

    // 发送进度更新
    if (onProgress) {
      const progress = currentDownload.totalBytes > 0
        ? (currentDownload.downloadedBytes / currentDownload.totalBytes) * 100
        : 0

      onProgress({
        downloaded: currentDownload.downloadedBytes,
        total: currentDownload.totalBytes,
        progress: progress
      })
    }
  })

  response.on('end', () => {
    fileStream.end()
    console.log('[更新下载] ✓ 下载完成')
    console.log('[更新下载] 保存路径:', currentDownload.savePath)
    console.log('[更新下载] 已下载:', currentDownload.downloadedBytes, 'bytes')

    currentDownload.status = 'completed'

    if (onComplete) {
      onComplete({ savePath: currentDownload.savePath })
    }
  })

  response.on('error', (error) => {
    console.error('[更新下载] ✗ 响应错误:', error.message)
    currentDownload.status = 'failed'
    currentDownload.error = error.message
    fileStream.close()

    if (onError) {
      onError({ error: error.message })
    }
  })
}

/**
 * 下载更新文件
 * @param {string} downloadUrl - 下载链接
 * @param {string} fileName - 文件名
 * @param {Object} callbacks - 回调函数 {onProgress, onComplete, onError}
 * @returns {Promise<Object>} {success, savePath?, error?}
 */
async function downloadUpdate(downloadUrl, fileName, callbacks = {}) {
  console.log('[更新下载] ========== 开始下载更新 ==========')
  console.log('[更新下载] URL:', downloadUrl)
  console.log('[更新下载] 文件名:', fileName)

  const { onProgress, onComplete, onError } = callbacks

  // 如果正在下载，返回错误
  if (currentDownload.status === 'downloading') {
    console.log('[更新下载] ✗ 已有下载任务在进行中')
    return { success: false, error: '已有下载任务在进行中' }
  }

  // 确定保存路径（下载到临时目录）
  const downloadDir = path.join(os.tmpdir(), 'tab-hive-updates')
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true })
  }
  const savePath = path.join(downloadDir, fileName)

  // 初始化下载状态
  currentDownload = {
    url: downloadUrl,
    savePath: savePath,
    totalBytes: 0,
    downloadedBytes: 0,
    status: 'downloading',
    error: null
  }

  try {
    // 使用 Electron 的 net 模块下载
    const request = net.request(downloadUrl)
    const fileStream = fs.createWriteStream(savePath)

    request.on('response', (response) => {
      console.log('[更新下载] 响应状态码:', response.statusCode)
      console.log('[更新下载] 响应头:', response.headers)

      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location
        if (redirectUrl && redirectUrl.length > 0) {
          const redirectUrlStr = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl
          console.log('[更新下载] 重定向到:', redirectUrlStr)
          fileStream.close()

          // 重新发起请求到重定向的地址
          const redirectRequest = net.request(redirectUrlStr)
          const redirectFileStream = fs.createWriteStream(savePath)

          redirectRequest.on('response', (redirectResponse) => {
            handleDownloadResponse(redirectResponse, redirectFileStream, onProgress, onComplete, onError)
          })

          redirectRequest.on('error', (error) => {
            console.error('[更新下载] ✗ 重定向请求失败:', error.message)
            currentDownload.status = 'failed'
            currentDownload.error = error.message
            redirectFileStream.close()
            if (onError) {
              onError({ error: error.message })
            }
          })

          redirectRequest.end()
          return
        }
      }

      if (response.statusCode !== 200) {
        currentDownload.status = 'failed'
        currentDownload.error = `HTTP ${response.statusCode}`
        fileStream.close()
        return
      }

      handleDownloadResponse(response, fileStream, onProgress, onComplete, onError)
    })

    request.on('error', (error) => {
      console.error('[更新下载] ✗ 下载失败:', error.message)
      currentDownload.status = 'failed'
      currentDownload.error = error.message
      fileStream.close()

      if (onError) {
        onError({ error: error.message })
      }
    })

    request.end()

    return { success: true, savePath: savePath }
  } catch (error) {
    console.error('[更新下载] ✗ 启动下载失败:', error.message)
    currentDownload.status = 'failed'
    currentDownload.error = error.message
    return { success: false, error: error.message }
  }
}

/**
 * 获取当前下载状态
 * @returns {Object}
 */
function getDownloadStatus() {
  return {
    success: true,
    download: {
      status: currentDownload.status,
      downloaded: currentDownload.downloadedBytes,
      total: currentDownload.totalBytes,
      progress: currentDownload.totalBytes > 0
        ? (currentDownload.downloadedBytes / currentDownload.totalBytes) * 100
        : 0,
      savePath: currentDownload.savePath,
      error: currentDownload.error
    }
  }
}

/**
 * 打开安装文件
 * @param {string} filePath - 文件路径
 * @param {Function} onQuit - 退出应用的回调
 * @returns {Promise<Object>} {success, error?}
 */
async function openInstaller(filePath, onQuit) {
  console.log('[更新下载] 打开安装文件:', filePath)

  try {
    if (!fs.existsSync(filePath)) {
      console.error('[更新下载] ✗ 文件不存在:', filePath)
      return { success: false, error: '文件不存在' }
    }

    // 使用 shell.openPath 打开安装文件
    const result = await shell.openPath(filePath)

    if (result) {
      console.error('[更新下载] ✗ 打开失败:', result)
      return { success: false, error: result }
    }

    console.log('[更新下载] ✓ 安装文件已打开')

    // 等待一会儿后退出应用（让用户安装新版本）
    if (onQuit) {
      setTimeout(() => {
        console.log('[更新下载] 退出应用以便安装')
        onQuit()
      }, 1000)
    }

    return { success: true }
  } catch (error) {
    console.error('[更新下载] ✗ 打开安装文件失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 取消下载
 * @returns {Object} {success}
 */
function cancelDownload() {
  console.log('[更新下载] 取消下载')

  if (currentDownload.status === 'downloading') {
    currentDownload.status = 'idle'
    currentDownload.error = '用户取消'

    // 删除未完成的文件
    if (currentDownload.savePath && fs.existsSync(currentDownload.savePath)) {
      try {
        fs.unlinkSync(currentDownload.savePath)
        console.log('[更新下载] 已删除未完成的文件')
      } catch (e) {
        console.error('[更新下载] 删除文件失败:', e.message)
      }
    }
  }

  return { success: true }
}

module.exports = {
  downloadUpdate,
  getDownloadStatus,
  openInstaller,
  cancelDownload
}

