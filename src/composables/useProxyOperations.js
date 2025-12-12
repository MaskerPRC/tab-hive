import { ref, computed, watch } from 'vue'

/**
 * 代理操作 composable
 * 处理代理节点的 CRUD 和批量操作
 * @param {Object} options - 配置选项
 * @param {Function} options.showAlert - 显示 alert 对话框的函数
 * @param {Function} options.showConfirm - 显示 confirm 对话框的函数
 */
export function useProxyOperations(options = {}) {
  // 默认使用原生对话框，可被外部覆盖
  const showAlert = options.showAlert || ((msg) => { alert(msg) })
  const showConfirm = options.showConfirm || ((msg) => confirm(msg))

  // 状态
  const loading = ref(false)
  const saving = ref(false)
  const importing = ref(false)
  const testingId = ref(null)
  const proxyList = ref([])
  const selectedProxies = ref([])
  const batchOperating = ref(false)

  // 计算是否全选
  const isAllSelected = computed(() => {
    return proxyList.value.length > 0 && selectedProxies.value.length === proxyList.value.length
  })

  /**
   * 加载代理列表（不分页，加载全部）
   */
  const loadProxyList = async () => {
    if (!window.electron?.proxy) return
    
    loading.value = true
    try {
      // 加载全部代理，不分页
      const result = await window.electron.proxy.getList(1, 10000)
      if (result.success) {
        proxyList.value = result.data.list || []
      } else {
        showAlert('加载失败: ' + result.error)
      }
    } catch (error) {
      console.error('加载代理列表失败:', error)
      showAlert('加载失败: ' + error.message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存代理（新增或更新）
   */
  const saveProxy = async (proxyForm, editingProxy) => {
    if (!window.electron?.proxy) return false
    
    saving.value = true
    try {
      let result
      if (editingProxy) {
        result = await window.electron.proxy.update(editingProxy.id, proxyForm)
      } else {
        // 添加代理时设置5秒超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('代理添加超时，请稍后重试')), 5000)
        })
        result = await Promise.race([
          window.electron.proxy.add(proxyForm),
          timeoutPromise
        ])
      }
      
      if (result.success) {
        await loadProxyList()
        showAlert(editingProxy ? '更新成功' : '添加成功')
        return true
      } else {
        showAlert('保存失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('保存代理失败:', error)
      showAlert('保存失败: ' + error.message)
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 删除代理
   */
  const deleteProxy = async (proxyId) => {
    const confirmed = await showConfirm('确定要删除这个代理吗？')
    if (!confirmed) return false
    if (!window.electron?.proxy) return false
    
    try {
      const result = await window.electron.proxy.delete(proxyId)
      if (result.success) {
        await loadProxyList()
        showAlert('删除成功')
        return true
      } else {
        showAlert('删除失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('删除代理失败:', error)
      showAlert('删除失败: ' + error.message)
      return false
    }
  }

  /**
   * 测试代理
   */
  const testProxy = async (proxyId) => {
    if (!window.electron?.proxy) return
    
    testingId.value = proxyId
    try {
      const result = await window.electron.proxy.test(proxyId)
      if (result.success) {
        showAlert('代理连接成功')
      } else {
        showAlert('代理连接失败: ' + result.error)
      }
    } catch (error) {
      console.error('测试代理失败:', error)
      showAlert('测试失败: ' + error.message)
    } finally {
      testingId.value = null
    }
  }

  /**
   * 导入订阅链接
   */
  const importSubscription = async (subscriptionUrl) => {
    if (!subscriptionUrl.trim()) {
      showAlert('请输入订阅链接')
      return false
    }
    if (!window.electron?.proxy) return false
    
    importing.value = true
    try {
      const result = await window.electron.proxy.importSubscription(subscriptionUrl.trim())
      if (result.success) {
        await loadProxyList()
        showAlert(`导入成功！共导入 ${result.data.imported} 个代理节点`)
        return true
      } else {
        showAlert('导入失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('导入订阅链接失败:', error)
      showAlert('导入失败: ' + error.message)
      return false
    } finally {
      importing.value = false
    }
  }

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = (checked) => {
    if (checked) {
      selectedProxies.value = proxyList.value.map(proxy => proxy.id)
    } else {
      selectedProxies.value = []
    }
  }

  /**
   * 切换单个代理的选择状态
   */
  const toggleSelectProxy = (proxyId) => {
    const index = selectedProxies.value.indexOf(proxyId)
    if (index > -1) {
      selectedProxies.value.splice(index, 1)
    } else {
      selectedProxies.value.push(proxyId)
    }
  }

  /**
   * 批量启用
   */
  const batchEnable = async () => {
    if (selectedProxies.value.length === 0) {
      showAlert('请先选择要启用的代理')
      return
    }
    const confirmed = await showConfirm(`确定要启用选中的 ${selectedProxies.value.length} 个代理吗？`)
    if (!confirmed) return
    if (!window.electron?.proxy) return

    batchOperating.value = true
    let successCount = 0
    let failCount = 0

    try {
      for (const proxyId of selectedProxies.value) {
        const proxy = proxyList.value.find(p => p.id === proxyId)
        if (!proxy) continue

        try {
          const updateData = {
            ...proxy,
            plugin: proxy.plugin || '',
            pluginOpts: proxy.plugin_opts || proxy.pluginOpts || '',
            udp: proxy.udp || false,
            tfo: proxy.tfo || false,
            is_enabled: true
          }
          const result = await window.electron.proxy.update(proxyId, updateData)
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error(`启用代理 ${proxyId} 失败:`, error)
          failCount++
        }
      }

      selectedProxies.value = []
      await loadProxyList()
      
      if (failCount === 0) {
        showAlert(`成功启用 ${successCount} 个代理`)
      } else {
        showAlert(`启用完成：成功 ${successCount} 个，失败 ${failCount} 个`)
      }
    } catch (error) {
      console.error('批量启用失败:', error)
      showAlert('批量启用失败: ' + error.message)
    } finally {
      batchOperating.value = false
    }
  }

  /**
   * 批量删除
   */
  const batchDelete = async () => {
    if (selectedProxies.value.length === 0) {
      showAlert('请先选择要删除的代理')
      return
    }
    const confirmed = await showConfirm(`确定要删除选中的 ${selectedProxies.value.length} 个代理吗？此操作不可恢复！`)
    if (!confirmed) return
    if (!window.electron?.proxy) return

    batchOperating.value = true
    let successCount = 0
    let failCount = 0

    try {
      for (const proxyId of selectedProxies.value) {
        try {
          const result = await window.electron.proxy.delete(proxyId)
          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error(`删除代理 ${proxyId} 失败:`, error)
          failCount++
        }
      }

      selectedProxies.value = []
      await loadProxyList()
      
      if (failCount === 0) {
        showAlert(`成功删除 ${successCount} 个代理`)
      } else {
        showAlert(`删除完成：成功 ${successCount} 个，失败 ${failCount} 个`)
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      showAlert('批量删除失败: ' + error.message)
    } finally {
      batchOperating.value = false
    }
  }

  /**
   * 清空选择（当对话框关闭时）
   */
  const clearSelection = () => {
    selectedProxies.value = []
  }

  // 监听代理列表变化，清空已删除的代理选择
  watch(proxyList, (newList) => {
    selectedProxies.value = selectedProxies.value.filter(id => 
      newList.some(proxy => proxy.id === id)
    )
  })

  return {
    // 状态
    loading,
    saving,
    importing,
    testingId,
    proxyList,
    selectedProxies,
    batchOperating,
    isAllSelected,
    // 方法
    loadProxyList,
    saveProxy,
    deleteProxy,
    testProxy,
    importSubscription,
    toggleSelectAll,
    toggleSelectProxy,
    batchEnable,
    batchDelete,
    clearSelection
  }
}

