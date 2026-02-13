/**
 * 布局分享和导出处理器
 * 负责处理布局的分享、导出、导入等操作
 */

export function useLayoutShareExport(dialog, t, layoutManager) {
  // 分享布局到服务器
  const shareLayoutToServer = async (layout) => {
    try {
      // API 地址（桌面端专用）
      const API_BASE_URL = 'https://tabs.apexstone.ai/api'

      const response = await fetch(`${API_BASE_URL}/layouts/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          layout: {
            name: layout.name,
            websites: layout.websites,
            drawings: layout.drawings || [],
            canvasTransform: layout.canvasTransform || { x: 0, y: 0, zoom: 1 }
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '分享失败')
      }

      const result = await response.json()
      console.log('分享成功:', result)
      return result
    } catch (error) {
      console.error('分享到服务器失败:', error)
      throw error
    }
  }

  // 处理分享布局（带截图）
  const handleShareLayout = async (layout) => {
    try {
      // 询问用户是否要截图
      const shouldCapture = await dialog.showConfirm({
        title: t('layout.shareLayout'),
        message: t('layout.shareWithScreenshotConfirm')
      })

      if (!shouldCapture) {
        // 用户取消截图，直接分享到服务器
        await shareLayoutToServer(layout)
        alert(t('layout.shareSuccess') || '分享成功！')
        return
      }

      // 用户确认，进行截图
      const { captureScreenshot, embedLayoutInImage, copyImageToClipboard } = await import('../utils/layoutImageUtils.js')
      
      // 显示提示
      alert(t('layout.capturingScreenshot'))
      
      // 截图
      const screenshotBlob = await captureScreenshot()
      
      // 准备布局数据（包含必要信息和绘制内容）
      const layoutData = {
        name: layout.name,
        websites: layout.websites,
        drawings: layout.drawings || [],
        canvasTransform: layout.canvasTransform || { x: 0, y: 0, zoom: 1 },
        version: 1,
        exportedAt: new Date().toISOString()
      }
      
      // 嵌入布局数据到图片
      const imageWithLayout = await embedLayoutInImage(screenshotBlob, layoutData)
      
      // 复制到剪贴板
      const copied = await copyImageToClipboard(imageWithLayout)
      
      if (copied) {
        alert(t('layout.screenshotCopied'))
      } else {
        // 如果复制失败，下载图片
        const { downloadImage } = await import('../utils/layoutImageUtils.js')
        downloadImage(imageWithLayout, `${layout.name || 'layout'}.png`)
        alert(t('layout.screenshotDownloaded'))
      }

      // 同时执行分享逻辑（上传到服务器）
      await shareLayoutToServer(layout)
      alert(t('layout.shareSuccess') || '分享成功！')
    } catch (error) {
      console.error('分享布局失败:', error)
      alert(t('layout.shareFailed') + ': ' + error.message)
    }
  }

  // 处理导出布局（带截图）
  const handleExportLayout = async (layout) => {
    try {
      // 询问用户是否要截图
      const shouldCapture = await dialog.showConfirm({
        title: t('layout.exportLayout'),
        message: t('layout.exportWithScreenshotConfirm')
      })

      if (!shouldCapture) {
        // 用户取消，只导出JSON
        const layoutJson = JSON.stringify(layout, null, 2)
        const blob = new Blob([layoutJson], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${layout.name || 'layout'}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return
      }

      // 用户确认，进行截图
      const { captureScreenshot, embedLayoutInImage, downloadImage } = await import('../utils/layoutImageUtils.js')
      
      // 显示提示
      alert(t('layout.capturingScreenshot'))
      
      // 截图
      const screenshotBlob = await captureScreenshot()
      
      // 准备布局数据（包含绘制内容）
      const layoutData = {
        name: layout.name,
        websites: layout.websites,
        drawings: layout.drawings || [],
        canvasTransform: layout.canvasTransform || { x: 0, y: 0, zoom: 1 },
        version: 1,
        exportedAt: new Date().toISOString()
      }
      
      // 嵌入布局数据到图片
      const imageWithLayout = await embedLayoutInImage(screenshotBlob, layoutData)
      
      // 下载图片
      downloadImage(imageWithLayout, `${layout.name || 'layout'}.png`)
      alert(t('layout.exportSuccess'))
    } catch (error) {
      console.error('导出布局失败:', error)
      alert(t('layout.exportFailed') + ': ' + error.message)
    }
  }

  // 处理从图片导入布局
  const handleImportLayoutFromImage = async (layoutData, handleCreateLayout) => {
    try {
      if (!layoutData || !layoutData.websites || !Array.isArray(layoutData.websites)) {
        alert(t('layout.invalidLayoutData'))
        return
      }

      // 询问用户是否要导入
      const shouldImport = await dialog.showConfirm({
        title: t('layout.importLayout'),
        message: t('layout.importLayoutFromImageConfirm', { name: layoutData.name || t('layout.unnamedLayout') })
      })

      if (!shouldImport) {
        return
      }

      // 创建新布局
      const layoutName = layoutData.name || `${t('layout.importedLayout')} ${new Date().toLocaleString()}`
      handleCreateLayout(layoutName, {
        websites: layoutData.websites
      })

      alert(t('layout.importSuccess'))
    } catch (error) {
      console.error('导入布局失败:', error)
      alert(t('layout.importFailed') + ': ' + error.message)
    }
  }

  return {
    handleShareLayout,
    handleExportLayout,
    handleImportLayoutFromImage
  }
}

