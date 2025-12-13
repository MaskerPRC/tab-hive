/**
 * 共享布局处理器
 * 负责处理共享布局的显示、导入、搜索、排序等操作
 */

export function useSharedLayoutHandlers(sharedLayouts, dialogStates, importExport) {
  // 显示分享布局弹窗
  const handleShowSharedModal = () => {
    dialogStates.openSharedModal()
    sharedLayouts.loadSharedLayouts()
  }

  // 导入布局
  const handleImportLayout = (layout) => {
    dialogStates.closeSharedModal()
    // 使用导入模式对话框
    importExport.showImportModeDialog(layout)
  }

  // 搜索共享布局
  const handleSearchShared = (query) => {
    sharedLayouts.searchQuery.value = query
    sharedLayouts.searchSharedLayouts(query)
  }

  // 排序共享布局
  const handleSortShared = (sortType) => {
    // TODO: 实现排序逻辑
    console.log('Sort shared layouts:', sortType)
  }

  return {
    handleShowSharedModal,
    handleImportLayout,
    handleSearchShared,
    handleSortShared
  }
}

