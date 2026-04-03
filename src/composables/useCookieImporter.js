import { ref } from 'vue'

const isElectron = !!window.electron

/**
 * Cookie 导入 composable
 * 支持从 JSON 文件导入 cookie 到指定的 session partition
 */
export function useCookieImporter() {
  const importing = ref(false)

  /**
   * 解析 cookie 数据，支持多种格式
   */
  function parseCookieData(text) {
    const data = JSON.parse(text)

    if (Array.isArray(data)) {
      return data
    }
    if (data && Array.isArray(data.cookies)) {
      return data.cookies
    }
    if (data && typeof data === 'object' && data.name) {
      return [data]
    }
    throw new Error('不支持的 cookie 数据格式')
  }

  /**
   * 读取文件内容
   */
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  /**
   * 打开文件选择器并返回选中的文件
   */
  function pickFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,.txt'
      input.onchange = (e) => {
        resolve(e.target.files[0] || null)
      }
      input.click()
    })
  }

  /**
   * 从文件导入 cookies 到指定 partition
   * @param {string} partitionName - Electron session partition 名称
   * @returns {Promise<{success: boolean, imported: number, failed: number, total: number, errors: Array}>}
   */
  async function importCookiesFromFile(partitionName) {
    if (!isElectron) {
      throw new Error('Cookie 导入仅在桌面客户端中可用')
    }

    const file = await pickFile()
    if (!file) {
      return null // 用户取消
    }

    importing.value = true
    try {
      const text = await readFile(file)
      const cookies = parseCookieData(text)

      if (cookies.length === 0) {
        return { success: true, imported: 0, failed: 0, total: 0, errors: [] }
      }

      const result = await window.electron.cookie.import(partitionName, cookies)
      return result
    } finally {
      importing.value = false
    }
  }

  return {
    importing,
    importCookiesFromFile
  }
}
