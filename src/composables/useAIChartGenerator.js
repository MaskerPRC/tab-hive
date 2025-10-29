/**
 * AI 图表生成器
 * 分析选择器提取的数据，自动生成可视化图表
 * 支持多种图表类型：柱状图、折线图、饼图、表格等
 */

import { ref } from 'vue'

export function useAIChartGenerator() {
  const isGenerating = ref(false)
  const lastGeneratedChart = ref(null)

  /**
   * 分析数据类型和结构
   */
  const analyzeDataStructure = (data) => {
    if (!data || data.length === 0) {
      return { type: 'empty', columns: [], rows: 0 }
    }

    // 获取第一个数据项的键
    const firstItem = data[0]
    const keys = Object.keys(firstItem)
    
    // 分析每个键的数据类型
    const columns = keys.map(key => {
      const values = data.map(item => item[key]).filter(v => v != null)
      
      // 检测数据类型
      const types = {
        number: 0,
        string: 0,
        date: 0,
        boolean: 0
      }
      
      values.forEach(value => {
        if (typeof value === 'number' || !isNaN(Number(value))) {
          types.number++
        } else if (typeof value === 'boolean') {
          types.boolean++
        } else if (isValidDate(value)) {
          types.date++
        } else {
          types.string++
        }
      })
      
      // 确定主要类型
      let mainType = 'string'
      let maxCount = types.string
      
      for (const [type, count] of Object.entries(types)) {
        if (count > maxCount) {
          mainType = type
          maxCount = count
        }
      }
      
      return {
        key,
        type: mainType,
        uniqueValues: new Set(values).size,
        hasNull: values.length < data.length
      }
    })

    return {
      type: 'table',
      columns,
      rows: data.length
    }
  }

  /**
   * 检测是否为有效日期
   */
  const isValidDate = (value) => {
    if (!value) return false
    const date = new Date(value)
    return date instanceof Date && !isNaN(date)
  }

  /**
   * 智能推荐图表类型
   */
  const recommendChartType = (dataStructure) => {
    const { columns, rows } = dataStructure
    
    if (rows === 0) {
      return { type: 'empty', reason: '没有数据' }
    }

    // 找出数字列和文本列
    const numberColumns = columns.filter(c => c.type === 'number')
    const stringColumns = columns.filter(c => c.type === 'string')
    const dateColumns = columns.filter(c => c.type === 'date')

    // 推荐逻辑
    const recommendations = []

    // 1. 如果有时间序列数据 + 数字，推荐折线图
    if (dateColumns.length > 0 && numberColumns.length > 0) {
      recommendations.push({
        type: 'line',
        priority: 10,
        reason: '检测到时间序列数据，适合展示趋势',
        config: {
          xAxis: dateColumns[0].key,
          yAxis: numberColumns.map(c => c.key),
          title: `${numberColumns[0].key}随时间变化`
        }
      })
    }

    // 2. 如果有分类 + 数字，推荐柱状图
    if (stringColumns.length > 0 && numberColumns.length > 0) {
      const categoryColumn = stringColumns.find(c => c.uniqueValues <= 20)
      if (categoryColumn) {
        recommendations.push({
          type: 'bar',
          priority: 9,
          reason: '检测到分类数据，适合比较不同类别',
          config: {
            xAxis: categoryColumn.key,
            yAxis: numberColumns[0].key,
            title: `各${categoryColumn.key}的${numberColumns[0].key}`
          }
        })
      }
    }

    // 3. 如果只有一个分类列和一个数字列，且类别较少，推荐饼图
    if (stringColumns.length === 1 && numberColumns.length === 1) {
      const categoryColumn = stringColumns[0]
      if (categoryColumn.uniqueValues <= 10) {
        recommendations.push({
          type: 'pie',
          priority: 8,
          reason: '类别较少，适合展示占比',
          config: {
            category: categoryColumn.key,
            value: numberColumns[0].key,
            title: `${categoryColumn.key}分布`
          }
        })
      }
    }

    // 4. 如果有多个数字列，推荐雷达图
    if (numberColumns.length >= 3 && rows <= 10) {
      recommendations.push({
        type: 'radar',
        priority: 7,
        reason: '多维度数据，适合多角度对比',
        config: {
          dimensions: numberColumns.map(c => c.key),
          title: '多维度对比'
        }
      })
    }

    // 5. 默认推荐表格
    recommendations.push({
      type: 'table',
      priority: 1,
      reason: '表格适用于所有数据类型',
      config: {
        columns: columns.map(c => c.key),
        title: '数据表格'
      }
    })

    // 按优先级排序
    recommendations.sort((a, b) => b.priority - a.priority)

    return recommendations
  }

  /**
   * 生成图表配置
   */
  const generateChartConfig = (data, chartType, customConfig = {}) => {
    const dataStructure = analyzeDataStructure(data)
    let config = {}

    switch (chartType) {
      case 'bar':
        config = generateBarChartConfig(data, dataStructure, customConfig)
        break
      case 'line':
        config = generateLineChartConfig(data, dataStructure, customConfig)
        break
      case 'pie':
        config = generatePieChartConfig(data, dataStructure, customConfig)
        break
      case 'radar':
        config = generateRadarChartConfig(data, dataStructure, customConfig)
        break
      case 'table':
        config = generateTableConfig(data, dataStructure, customConfig)
        break
      default:
        config = generateTableConfig(data, dataStructure, customConfig)
    }

    return config
  }

  /**
   * 生成柱状图配置
   */
  const generateBarChartConfig = (data, dataStructure, customConfig) => {
    const numberColumns = dataStructure.columns.filter(c => c.type === 'number')
    const stringColumns = dataStructure.columns.filter(c => c.type === 'string')

    const xAxisKey = customConfig.xAxis || stringColumns[0]?.key || dataStructure.columns[0].key
    const yAxisKey = customConfig.yAxis || numberColumns[0]?.key || dataStructure.columns[1].key

    return {
      type: 'bar',
      title: customConfig.title || `柱状图`,
      xAxis: {
        type: 'category',
        data: data.map(item => item[xAxisKey])
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: yAxisKey,
        type: 'bar',
        data: data.map(item => Number(item[yAxisKey]) || 0)
      }]
    }
  }

  /**
   * 生成折线图配置
   */
  const generateLineChartConfig = (data, dataStructure, customConfig) => {
    const numberColumns = dataStructure.columns.filter(c => c.type === 'number')
    const xAxisKey = customConfig.xAxis || dataStructure.columns[0].key
    const yAxisKeys = customConfig.yAxis || numberColumns.map(c => c.key)

    return {
      type: 'line',
      title: customConfig.title || `折线图`,
      xAxis: {
        type: 'category',
        data: data.map(item => item[xAxisKey])
      },
      yAxis: {
        type: 'value'
      },
      series: (Array.isArray(yAxisKeys) ? yAxisKeys : [yAxisKeys]).map(key => ({
        name: key,
        type: 'line',
        data: data.map(item => Number(item[key]) || 0),
        smooth: true
      }))
    }
  }

  /**
   * 生成饼图配置
   */
  const generatePieChartConfig = (data, dataStructure, customConfig) => {
    const stringColumns = dataStructure.columns.filter(c => c.type === 'string')
    const numberColumns = dataStructure.columns.filter(c => c.type === 'number')

    const categoryKey = customConfig.category || stringColumns[0]?.key || dataStructure.columns[0].key
    const valueKey = customConfig.value || numberColumns[0]?.key || dataStructure.columns[1].key

    return {
      type: 'pie',
      title: customConfig.title || `饼图`,
      series: [{
        name: valueKey,
        type: 'pie',
        radius: '60%',
        data: data.map(item => ({
          name: item[categoryKey],
          value: Number(item[valueKey]) || 0
        }))
      }]
    }
  }

  /**
   * 生成雷达图配置
   */
  const generateRadarChartConfig = (data, dataStructure, customConfig) => {
    const numberColumns = dataStructure.columns.filter(c => c.type === 'number')
    const dimensions = customConfig.dimensions || numberColumns.map(c => c.key)

    return {
      type: 'radar',
      title: customConfig.title || `雷达图`,
      radar: {
        indicator: dimensions.map(dim => ({
          name: dim,
          max: Math.max(...data.map(item => Number(item[dim]) || 0)) * 1.2
        }))
      },
      series: [{
        name: '数据',
        type: 'radar',
        data: data.map((item, index) => ({
          value: dimensions.map(dim => Number(item[dim]) || 0),
          name: item[dataStructure.columns[0].key] || `项目${index + 1}`
        }))
      }]
    }
  }

  /**
   * 生成表格配置
   */
  const generateTableConfig = (data, dataStructure, customConfig) => {
    return {
      type: 'table',
      title: customConfig.title || `数据表格`,
      columns: customConfig.columns || dataStructure.columns.map(c => ({
        key: c.key,
        label: c.key,
        type: c.type
      })),
      data: data
    }
  }

  /**
   * 主函数：分析数据并生成图表
   */
  const generateChart = async (data, options = {}) => {
    isGenerating.value = true

    try {
      // 1. 分析数据结构
      const dataStructure = analyzeDataStructure(data)
      console.log('[AI Chart] 数据结构:', dataStructure)

      // 2. 推荐图表类型
      const recommendations = recommendChartType(dataStructure)
      console.log('[AI Chart] 推荐图表:', recommendations)

      // 3. 使用指定的图表类型或第一个推荐
      const chartType = options.chartType || recommendations[0].type
      const selectedRecommendation = recommendations.find(r => r.type === chartType) || recommendations[0]

      // 4. 生成图表配置
      const chartConfig = generateChartConfig(
        data, 
        chartType, 
        { ...selectedRecommendation.config, ...options.customConfig }
      )

      // 5. 保存结果
      lastGeneratedChart.value = {
        config: chartConfig,
        dataStructure,
        recommendations,
        selectedType: chartType,
        generatedAt: new Date().toISOString()
      }

      console.log('[AI Chart] 图表配置:', chartConfig)

      return {
        success: true,
        chart: lastGeneratedChart.value
      }
    } catch (error) {
      console.error('[AI Chart] 生成失败:', error)
      return {
        success: false,
        error: error.message
      }
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 导出图表配置
   */
  const exportChartConfig = () => {
    if (!lastGeneratedChart.value) {
      throw new Error('没有可导出的图表')
    }

    const json = JSON.stringify(lastGeneratedChart.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chart-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    // 状态
    isGenerating,
    lastGeneratedChart,

    // 方法
    generateChart,
    analyzeDataStructure,
    recommendChartType,
    generateChartConfig,
    exportChartConfig
  }
}

