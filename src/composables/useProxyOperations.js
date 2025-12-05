import { ref, computed, watch } from 'vue'

/**
 * 代理操作 composable
 * 处理代理节点的 CRUD 和批量操作
 */
export function useProxyOperations() {
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
   * 加载代理列表
   */
  const loadProxyList = async () => {
    if (!window.electron?.proxy) return
    
    loading.value = true
    try {
      const result = await window.electron.proxy.getList(1, 100)
      if (result.success) {
        proxyList.value = result.data.list || []
      } else {
        alert('加载失败: ' + result.error)
      }
    } catch (error) {
      console.error('加载代理列表失败:', error)
      alert('加载失败: ' + error.message)
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
        result = await window.electron.proxy.add(proxyForm)
      }
      
      if (result.success) {
        await loadProxyList()
        alert(editingProxy ? '更新成功' : '添加成功')
        return true
      } else {
        alert('保存失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('保存代理失败:', error)
      alert('保存失败: ' + error.message)
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 删除代理
   */
  const deleteProxy = async (proxyId) => {
    if (!confirm('确定要删除这个代理吗？')) return false
    if (!window.electron?.proxy) return false
    
    try {
      const result = await window.electron.proxy.delete(proxyId)
      if (result.success) {
        await loadProxyList()
        alert('删除成功')
        return true
      } else {
        alert('删除失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('删除代理失败:', error)
      alert('删除失败: ' + error.message)
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
        alert('代理连接成功')
      } else {
        alert('代理连接失败: ' + result.error)
      }
    } catch (error) {
      console.error('测试代理失败:', error)
      alert('测试失败: ' + error.message)
    } finally {
      testingId.value = null
    }
  }

  /**
   * 导入订阅链接
   */
  const importSubscription = async (subscriptionUrl) => {
    if (!subscriptionUrl.trim()) {
      alert('请输入订阅链接')
      return false
    }
    if (!window.electron?.proxy) return false
    
    importing.value = true
    try {
      const result = await window.electron.proxy.importSubscription(subscriptionUrl.trim())
      if (result.success) {
        await loadProxyList()
        alert(`导入成功！共导入 ${result.data.imported} 个代理节点`)
        return true
      } else {
        alert('导入失败: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('导入订阅链接失败:', error)
      alert('导入失败: ' + error.message)
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
      alert('请先选择要启用的代理')
      return
    }
    if (!confirm(`确定要启用选中的 ${selectedProxies.value.length} 个代理吗？`)) return
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
        alert(`成功启用 ${successCount} 个代理`)
      } else {
        alert(`启用完成：成功 ${successCount} 个，失败 ${failCount} 个`)
      }
    } catch (error) {
      console.error('批量启用失败:', error)
      alert('批量启用失败: ' + error.message)
    } finally {
      batchOperating.value = false
    }
  }

  /**
   * 批量删除
   */
  const batchDelete = async () => {
    if (selectedProxies.value.length === 0) {
      alert('请先选择要删除的代理')
      return
    }
    if (!confirm(`确定要删除选中的 ${selectedProxies.value.length} 个代理吗？此操作不可恢复！`)) return
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
        alert(`成功删除 ${successCount} 个代理`)
      } else {
        alert(`删除完成：成功 ${successCount} 个，失败 ${failCount} 个`)
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      alert('批量删除失败: ' + error.message)
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

