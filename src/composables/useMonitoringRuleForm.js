import { ref, computed, watch } from 'vue'

/**
 * 管理监听规则表单的逻辑
 * 包括表单状态、验证、数据转换等
 */
export function useMonitoringRuleForm(props, emit) {
  // 表单数据
  const formData = ref({
    name: '',
    conditionType: 'llm_screenshot',
    conditionDescription: '',
    checkInterval: 60,
    actionType: 'desktop_notification',
    notificationMessage: ''
  })

  // 检测间隔预设值
  const intervalPresets = [
    { label: '30秒', value: 30 },
    { label: '1分钟', value: 60 },
    { label: '5分钟', value: 300 },
    { label: '10分钟', value: 600 },
    { label: '30分钟', value: 1800 },
    { label: '1小时', value: 3600 }
  ]

  // 是否为编辑模式
  const isEdit = computed(() => !!props.rule)

  // 表单验证
  const isFormValid = computed(() => {
    return formData.value.name.trim() !== '' &&
           formData.value.conditionDescription.trim() !== '' &&
           formData.value.checkInterval >= 10
  })

  /**
   * 重置表单
   */
  const resetForm = () => {
    formData.value = {
      name: '',
      conditionType: 'llm_screenshot',
      conditionDescription: '',
      checkInterval: 60,
      actionType: 'desktop_notification',
      notificationMessage: ''
    }
  }

  /**
   * 监听规则变化，填充表单
   */
  watch(() => props.rule, (newRule) => {
    if (newRule) {
      formData.value = {
        name: newRule.name || '',
        conditionType: newRule.condition_type || 'llm_screenshot',
        conditionDescription: newRule.condition_config ? JSON.parse(newRule.condition_config).description : '',
        checkInterval: newRule.check_interval || 60,
        actionType: newRule.action_type || 'desktop_notification',
        notificationMessage: newRule.action_config ? JSON.parse(newRule.action_config).message : ''
      }
    } else {
      // 重置表单
      resetForm()
    }
  }, { immediate: true })

  /**
   * 保存规则
   */
  const handleSave = () => {
    if (!isFormValid.value) return

    const ruleData = {
      website_id: props.websiteId,
      name: formData.value.name.trim(),
      condition_type: formData.value.conditionType,
      condition_config: JSON.stringify({
        description: formData.value.conditionDescription.trim()
      }),
      action_type: formData.value.actionType,
      action_config: JSON.stringify({
        message: formData.value.notificationMessage.trim()
      }),
      check_interval: formData.value.checkInterval
    }

    if (isEdit.value) {
      ruleData.id = props.rule.id
    }

    emit('save', ruleData)
  }

  /**
   * 关闭对话框
   */
  const handleClose = () => {
    emit('close')
  }

  return {
    formData,
    intervalPresets,
    isEdit,
    isFormValid,
    handleSave,
    handleClose,
    resetForm
  }
}

