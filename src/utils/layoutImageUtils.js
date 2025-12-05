/**
 * 布局图片工具函数
 * 用于截图、嵌入布局JSON到图片元数据、从图片提取布局JSON
 */

/**
 * 截图当前页面（只截取画板中包含所有页面的最小区域）
 * @returns {Promise<Blob>} 图片Blob对象
 */
export async function captureScreenshot() {
  try {
    // 使用 html2canvas 库进行截图
    const html2canvas = (await import('html2canvas')).default
    
    // 获取画布容器和网格容器
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    const gridContainer = document.querySelector('.grid-container')
    
    if (!canvasWrapper || !gridContainer) {
      throw new Error('找不到画布容器')
    }
    
    // 获取所有网站卡片元素（使用实际的类名 grid-item）
    const websiteCards = gridContainer.querySelectorAll('.grid-item:not(.hidden)')
    
    // 如果没有找到卡片，降级为截取整个画布区域
    if (websiteCards.length === 0) {
      console.warn('[captureScreenshot] 没有找到网站卡片，降级为截取整个画布区域')
      const canvas = await html2canvas(canvasWrapper, {
        backgroundColor: '#f8fafc',
        scale: 1,
        useCORS: true,
        logging: false
      })
      
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('截图转换失败'))
          }
        }, 'image/png')
      })
    }
    
    // 计算所有卡片在视口中的边界框
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    websiteCards.forEach((card) => {
      const rect = card.getBoundingClientRect()
      minX = Math.min(minX, rect.left)
      minY = Math.min(minY, rect.top)
      maxX = Math.max(maxX, rect.right)
      maxY = Math.max(maxY, rect.bottom)
    })
    
    // 添加一些边距（20px）
    const padding = 20
    minX = minX - padding
    minY = minY - padding
    maxX = maxX + padding
    maxY = maxY + padding
    
    const width = maxX - minX
    const height = maxY - minY
    
    // 获取画布容器在视口中的位置
    const wrapperRect = canvasWrapper.getBoundingClientRect()
    
    // 计算相对于画布容器的裁剪区域
    const x = minX - wrapperRect.left
    const y = minY - wrapperRect.top
    
    // 截图画布容器，并裁剪到包含所有卡片的区域
    const canvas = await html2canvas(canvasWrapper, {
      backgroundColor: '#f8fafc',
      scale: 1,
      useCORS: true,
      logging: false,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.min(width, wrapperRect.width - Math.max(0, x)),
      height: Math.min(height, wrapperRect.height - Math.max(0, y))
    })
    
    // 转换为Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('截图转换失败'))
        }
      }, 'image/png')
    })
  } catch (error) {
    console.error('截图失败:', error)
    throw error
  }
}

/**
 * 将布局JSON嵌入到图片的元数据中
 * 使用PNG的tEXt块存储JSON数据
 * @param {Blob} imageBlob - 原始图片Blob
 * @param {Object} layoutData - 布局数据
 * @returns {Promise<Blob>} 包含元数据的图片Blob
 */
export async function embedLayoutInImage(imageBlob, layoutData) {
  try {
    // 读取图片数据
    const arrayBuffer = await imageBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // 将布局数据转换为JSON字符串
    const layoutJson = JSON.stringify(layoutData)
    
    // 使用 png-metadata 库或手动处理PNG格式
    // 这里我们使用一个简单的方法：在PNG的IEND块之前插入tEXt块
    
    // PNG文件格式：
    // - PNG签名 (8 bytes)
    // - IHDR块
    // - 数据块（IDAT等）
    // - tEXt块（我们在这里插入）
    // - IEND块
    
    // 查找IEND块的位置（PNG文件末尾）
    const iendSignature = [0x49, 0x45, 0x4E, 0x44] // "IEND"
    let iendIndex = -1
    
    // 从后往前查找IEND块
    for (let i = uint8Array.length - 8; i >= 0; i--) {
      if (uint8Array[i] === iendSignature[0] &&
          uint8Array[i + 1] === iendSignature[1] &&
          uint8Array[i + 2] === iendSignature[2] &&
          uint8Array[i + 3] === iendSignature[3]) {
        iendIndex = i - 4 // 减去4字节的长度字段
        break
      }
    }
    
    if (iendIndex === -1) {
      throw new Error('无法找到PNG IEND块')
    }
    
    // 创建tEXt块
    const keyword = 'QuanShiJieLayout'
    const textData = layoutJson
    const textChunk = createTextChunk(keyword, textData)
    
    // 创建新的数组，在IEND之前插入tEXt块
    const newArray = new Uint8Array(uint8Array.length + textChunk.length)
    newArray.set(uint8Array.slice(0, iendIndex), 0)
    newArray.set(textChunk, iendIndex)
    newArray.set(uint8Array.slice(iendIndex), iendIndex + textChunk.length)
    
    return new Blob([newArray], { type: 'image/png' })
  } catch (error) {
    console.error('嵌入布局数据失败:', error)
    // 如果嵌入失败，返回原始图片
    return imageBlob
  }
}

/**
 * 创建PNG tEXt块
 * @param {string} keyword - 关键字（最多79字符）
 * @param {string} text - 文本内容
 * @returns {Uint8Array} tEXt块数据
 */
function createTextChunk(keyword, text) {
  // tEXt块格式：
  // - 长度 (4 bytes, big-endian)
  // - 类型 "tEXt" (4 bytes)
  // - 关键字 + 0x00 + 文本
  // - CRC32 (4 bytes, big-endian)
  
  const keywordBytes = new TextEncoder().encode(keyword)
  const textBytes = new TextEncoder().encode(text)
  
  if (keywordBytes.length > 79) {
    throw new Error('关键字长度不能超过79字符')
  }
  
  // 计算数据长度
  const dataLength = keywordBytes.length + 1 + textBytes.length
  
  // 创建块数据
  const chunkData = new Uint8Array(dataLength)
  chunkData.set(keywordBytes, 0)
  chunkData[keywordBytes.length] = 0x00 // 分隔符
  chunkData.set(textBytes, keywordBytes.length + 1)
  
  // 计算CRC32
  const crc = calculateCRC32('tEXt', chunkData)
  
  // 创建完整的块
  const chunk = new Uint8Array(4 + 4 + dataLength + 4)
  writeUint32BE(chunk, 0, dataLength) // 长度
  chunk.set(new TextEncoder().encode('tEXt'), 4) // 类型
  chunk.set(chunkData, 8) // 数据
  writeUint32BE(chunk, 8 + dataLength, crc) // CRC32
  
  return chunk
}

/**
 * 从图片中提取布局JSON
 * @param {Blob} imageBlob - 图片Blob
 * @returns {Promise<Object|null>} 布局数据，如果没有则返回null
 */
export async function extractLayoutFromImage(imageBlob) {
  try {
    console.log('[extractLayoutFromImage] 开始提取布局数据，图片大小:', imageBlob.size, 'bytes')
    
    const arrayBuffer = await imageBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // 检查PNG签名
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    let isPng = true
    for (let i = 0; i < 8; i++) {
      if (uint8Array[i] !== pngSignature[i]) {
        isPng = false
        break
      }
    }
    
    if (!isPng) {
      console.warn('[extractLayoutFromImage] 不是有效的PNG文件')
      return null
    }
    
    console.log('[extractLayoutFromImage] 确认是PNG文件，开始查找tEXt块')
    
    // 查找tEXt块
    let offset = 8 // 跳过PNG签名
    let chunkCount = 0
    
    while (offset < uint8Array.length - 8) {
      // 读取块长度
      const chunkLength = readUint32BE(uint8Array, offset)
      offset += 4
      
      // 读取块类型
      const chunkType = String.fromCharCode(
        uint8Array[offset],
        uint8Array[offset + 1],
        uint8Array[offset + 2],
        uint8Array[offset + 3]
      )
      offset += 4
      
      chunkCount++
      
      if (chunkType === 'tEXt') {
        console.log('[extractLayoutFromImage] 找到tEXt块，长度:', chunkLength)
        
        // 读取关键字
        let keywordEnd = offset
        while (keywordEnd < offset + chunkLength && uint8Array[keywordEnd] !== 0x00) {
          keywordEnd++
        }
        
        const keyword = String.fromCharCode(...uint8Array.slice(offset, keywordEnd))
        console.log('[extractLayoutFromImage] tEXt块关键字:', keyword)
        
        if (keyword === 'QuanShiJieLayout') {
          // 读取文本数据
          const textStart = keywordEnd + 1
          const textEnd = offset + chunkLength
          const textBytes = uint8Array.slice(textStart, textEnd)
          const text = new TextDecoder().decode(textBytes)
          
          console.log('[extractLayoutFromImage] 找到布局数据，JSON长度:', text.length)
          
          try {
            const layoutData = JSON.parse(text)
            console.log('[extractLayoutFromImage] 成功解析布局数据:', layoutData)
            return layoutData
          } catch (e) {
            console.error('[extractLayoutFromImage] 解析布局JSON失败:', e)
            console.error('[extractLayoutFromImage] JSON文本:', text.substring(0, 200))
            return null
          }
        }
      }
      
      // 跳过数据块和CRC32，移动到下一个块
      offset += chunkLength + 4
      
      // 如果遇到IEND块，停止搜索
      if (chunkType === 'IEND') {
        console.log('[extractLayoutFromImage] 遇到IEND块，停止搜索。共检查了', chunkCount, '个块')
        break
      }
    }
    
    console.log('[extractLayoutFromImage] 未找到QuanShiJieLayout tEXt块。共检查了', chunkCount, '个块')
    return null
  } catch (error) {
    console.error('[extractLayoutFromImage] 提取布局数据失败:', error)
    return null
  }
}

/**
 * 写入32位大端序整数
 */
function writeUint32BE(buffer, offset, value) {
  buffer[offset] = (value >>> 24) & 0xFF
  buffer[offset + 1] = (value >>> 16) & 0xFF
  buffer[offset + 2] = (value >>> 8) & 0xFF
  buffer[offset + 3] = value & 0xFF
}

/**
 * 读取32位大端序整数
 */
function readUint32BE(buffer, offset) {
  return (buffer[offset] << 24) |
         (buffer[offset + 1] << 16) |
         (buffer[offset + 2] << 8) |
         buffer[offset + 3]
}

/**
 * 计算CRC32校验和
 */
function calculateCRC32(type, data) {
  // 简化的CRC32计算（实际应该使用完整的CRC32算法）
  // 这里使用一个简单的实现
  const crcTable = []
  for (let i = 0; i < 256; i++) {
    let crc = i
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : (crc >>> 1)
    }
    crcTable[i] = crc
  }
  
  let crc = 0xFFFFFFFF
  const typeBytes = new TextEncoder().encode(type)
  for (let i = 0; i < typeBytes.length; i++) {
    crc = crcTable[(crc ^ typeBytes[i]) & 0xFF] ^ (crc >>> 8)
  }
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

/**
 * 下载图片
 * @param {Blob} imageBlob - 图片Blob
 * @param {string} filename - 文件名
 */
export function downloadImage(imageBlob, filename = 'layout.png') {
  const url = URL.createObjectURL(imageBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 复制图片到剪贴板
 * @param {Blob} imageBlob - 图片Blob
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyImageToClipboard(imageBlob) {
  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': imageBlob })
      await navigator.clipboard.write([item])
      return true
    } else {
      // 降级方案：使用传统方法
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              // 使用execCommand作为降级方案
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.style.display = 'none'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              resolve(false) // 表示使用了降级方案
            } else {
              reject(new Error('无法创建图片Blob'))
            }
          }, 'image/png')
        }
        img.onerror = reject
        img.src = URL.createObjectURL(imageBlob)
      })
    }
  } catch (error) {
    console.error('复制图片到剪贴板失败:', error)
    return false
  }
}

