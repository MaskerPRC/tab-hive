<template>
  <div
    class="grid-view"
    :class="{ 'fullscreen-mode': fullscreenIndex !== null }"
    @dragenter.prevent="handleDragEnter"
    @dragleave="handleViewDragLeave"
    @mousemove="handleGridMouseMove"
  >
    <!-- 全屏模式下的顶部退出按钮条 -->
    <div
      v-if="fullscreenIndex !== null && showFullscreenBar"
      class="fullscreen-exit-bar"
      @mouseleave="handleFullscreenBarLeave"
    >
      <button
        class="btn-exit-fullscreen"
        @click="$emit('exitFullscreen')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>
        <span>退出全屏</span>
      </button>
    </div>
    <!-- 拖动/调整大小时的全局遮罩层，防止iframe捕获鼠标事件 -->
    <div
      v-if="isDraggingItem || isResizing"
      class="drag-overlay"
    ></div>

    <!-- 添加网站浮动按钮 -->
    <button
      v-if="fullscreenIndex === null"
      class="btn-add-website-float"
      @click="startAddWebsite(-1)"
      title="添加新网站"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    </button>

    <!-- 添加/编辑网站对话框 -->
    <div v-if="editingSlot !== null" class="edit-website-overlay" @click.self="cancelAddWebsite">
      <div class="edit-website-dialog">
        <h3>{{ editingSlot === -1 ? '添加网站' : '编辑网站' }}</h3>
        <div class="form-group">
          <label>网站名称：</label>
          <input
            v-model="newWebsite.title"
            type="text"
            placeholder="例如：Google"
            class="form-input"
            @keyup.enter="confirmAddWebsite"
            ref="titleInput"
          />
        </div>
        <div class="form-group">
          <label>网站地址：</label>
          <input
            v-model="newWebsite.url"
            type="text"
            placeholder="例如：bbc.com 或 https://bbc.com"
            class="form-input"
            @keyup.enter="confirmAddWebsite"
          />
        </div>
        <div class="form-group">
          <label>设备类型：</label>
          <div class="device-type-selector">
            <label class="device-option" :class="{ active: newWebsite.deviceType === 'desktop' }">
              <input
                type="radio"
                value="desktop"
                v-model="newWebsite.deviceType"
              />
              <span>🖥️ PC版</span>
            </label>
            <label class="device-option" :class="{ active: newWebsite.deviceType === 'mobile' }">
              <input
                type="radio"
                value="mobile"
                v-model="newWebsite.deviceType"
              />
              <span>📱 手机版</span>
            </label>
          </div>
          <div class="device-hint" v-if="newWebsite.deviceType === 'mobile'">
            💡 手机版会自动将域名转换为移动版（如 www.xxx.com → m.xxx.com）<br>
            并限制视口宽度为 375px，适合查看响应式网站的移动布局
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-confirm" @click="confirmAddWebsite">确定</button>
          <button class="btn-cancel" @click="cancelAddWebsite">取消</button>
        </div>
      </div>
    </div>

    <div
      class="grid-container"
      :class="{
        'free-layout': true,
        'is-dragging': isDraggingItem || isResizing
      }"
    >
      <div
        v-for="(item, index) in allWebsites"
        :key="item.id"
        class="grid-item"
        :class="{
          'fullscreen': fullscreenIndex === index,
          'hidden': isHidden(index),
          'empty-slot': !item.url,
          'drag-over': dragOverIndex === index && isDragging,
          'draggable': true,
          'dragging': isDraggingItem && currentDragIndex === index,
          'resizing': isResizing && currentDragIndex === index,
          'colliding': isColliding && currentDragIndex === index
        }"
        :style="getItemStyle(item, index)"
      >
        <!-- 已有网站显示 -->
        <template v-if="item.url">
          <iframe
            :src="getWebsiteUrl(item)"
            frameborder="0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            class="website-iframe"
            :class="{ 'mobile-view': item.deviceType === 'mobile' }"
            :title="item.title"
          ></iframe>
          <!-- 拖动手柄 -->
          <div
            class="drag-handle"
            @mousedown="startDrag($event, index)"
            @touchstart="startDrag($event, index)"
            title="按住拖动"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="5" r="1"/>
              <circle cx="9" cy="12" r="1"/>
              <circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="5" r="1"/>
              <circle cx="15" cy="12" r="1"/>
              <circle cx="15" cy="19" r="1"/>
            </svg>
          </div>
          <!-- 拖放捕获层 -->
          <div
            v-if="isDragging"
            class="drop-zone"
            @dragover.prevent="handleDragOver(index)"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop($event, index)"
          ></div>
          <!-- 拖放提示框 -->
          <div v-if="dragOverIndex === index && isDragging" class="drop-hint">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>替换此网站</span>
          </div>
          <!-- 非全屏模式下的浮动按钮 -->
          <div v-if="fullscreenIndex === null" class="floating-actions">
            <button
              class="btn-action btn-refresh"
              @click="handleRefreshWebsite(index)"
              title="刷新页面"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
            <button
              class="btn-action btn-edit"
              @click="handleEditWebsite(index)"
              title="编辑链接"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              class="btn-action"
              @click="$emit('fullscreen', index)"
              title="全屏查看"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
            <button
              class="btn-action btn-remove"
              @click="handleRemoveWebsite(index)"
              title="删除网站"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>

          <!-- 调整大小手柄 -->
          <div class="resize-handles">
            <div class="resize-handle resize-se" @mousedown="startResize($event, index, 'se')"></div>
            <div class="resize-handle resize-e" @mousedown="startResize($event, index, 'e')"></div>
            <div class="resize-handle resize-s" @mousedown="startResize($event, index, 's')"></div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

export default {
  name: 'GridView',
  props: {
    websites: {
      type: Array,
      required: true
    },
    rows: {
      type: Number,
      required: true
    },
    cols: {
      type: Number,
      required: true
    },
    fullscreenIndex: {
      type: Number,
      default: null
    }
  },
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'remove-website', 'update-website'],
  setup(props, { emit }) {
    const editingSlot = ref(null)
    const newWebsite = ref({
      title: '',
      url: '',
      deviceType: 'desktop'
    })
    const dragOverIndex = ref(null)
    const isDragging = ref(false)
    const showFullscreenBar = ref(false)
    let hideTimer = null

    // 拖拽和调整大小相关状态
    const isDraggingItem = ref(false)
    const isResizing = ref(false)
    const dragStartPos = ref({ x: 0, y: 0 })
    const dragStartItemPos = ref({ x: 0, y: 0 })
    const currentDragIndex = ref(-1)
    const resizeHandle = ref('')
    const itemPositions = ref({})
    const itemSizes = ref({})
    const isColliding = ref(false) // 碰撞状态

    // 网格吸附配置
    const GRID_SIZE = 20 // 网格单元大小（像素）
    const COLLISION_MARGIN = 20 // 碰撞检测边距（一个网格单位）

    // 吸附到网格的辅助函数
    const snapToGrid = (value) => {
      return Math.round(value / GRID_SIZE) * GRID_SIZE
    }

    // 检测两个矩形是否重叠
    const checkCollision = (rect1, rect2) => {
      return !(rect1.x + rect1.width <= rect2.x ||
               rect2.x + rect2.width <= rect1.x ||
               rect1.y + rect1.height <= rect2.y ||
               rect2.y + rect2.height <= rect1.y)
    }

    // 检测指定索引的元素是否与其他元素碰撞（包含边距）
    const checkCollisionWithOthers = (index, newPos, newSize) => {
      // 扩大检测区域，为rect1添加边距
      const rect1 = {
        x: newPos.x - COLLISION_MARGIN / 2,
        y: newPos.y - COLLISION_MARGIN / 2,
        width: newSize.width + COLLISION_MARGIN,
        height: newSize.height + COLLISION_MARGIN
      }

      // 检测与其他所有元素的碰撞
      for (let i = 0; i < allWebsites.value.length; i++) {
        if (i === index) continue // 跳过自己

        const pos = itemPositions.value[i]
        const size = itemSizes.value[i]

        if (!pos || !size) continue

        // 也为rect2添加边距
        const rect2 = {
          x: pos.x - COLLISION_MARGIN / 2,
          y: pos.y - COLLISION_MARGIN / 2,
          width: size.width + COLLISION_MARGIN,
          height: size.height + COLLISION_MARGIN
        }

        if (checkCollision(rect1, rect2)) {
          return true // 发生碰撞（考虑边距）
        }
      }

      return false // 无碰撞
    }

    // 检测移动是否在远离碰撞（用于允许从重叠状态移出）
    const isMovingAway = (index, oldPos, newPos) => {
      // 检测与所有其他元素的距离是否在增加
      for (let i = 0; i < allWebsites.value.length; i++) {
        if (i === index) continue

        const otherPos = itemPositions.value[i]
        const otherSize = itemSizes.value[i]

        if (!otherPos || !otherSize) continue

        // 计算中心点
        const currentSize = itemSizes.value[index] || { width: 400, height: 300 }
        const oldCenter = {
          x: oldPos.x + currentSize.width / 2,
          y: oldPos.y + currentSize.height / 2
        }
        const newCenter = {
          x: newPos.x + currentSize.width / 2,
          y: newPos.y + currentSize.height / 2
        }
        const otherCenter = {
          x: otherPos.x + otherSize.width / 2,
          y: otherPos.y + otherSize.height / 2
        }

        // 计算距离
        const oldDist = Math.sqrt(
          Math.pow(oldCenter.x - otherCenter.x, 2) +
          Math.pow(oldCenter.y - otherCenter.y, 2)
        )
        const newDist = Math.sqrt(
          Math.pow(newCenter.x - otherCenter.x, 2) +
          Math.pow(newCenter.y - otherCenter.y, 2)
        )

        // 如果距离增加，说明在远离
        if (newDist > oldDist) {
          return true
        }
      }

      return false
    }

    // 初始化网格布局
    const initializeGridLayout = () => {
      const container = document.querySelector('.grid-container')
      if (!container) return

      const containerWidth = container.clientWidth
      const defaultItemWidth = 400
      const defaultItemHeight = 300
      const spacing = 20

      // 计算每行可以放置多少个项目
      const itemsPerRow = Math.max(1, Math.floor(containerWidth / (defaultItemWidth + spacing)))

      // 为每个项目计算初始位置和大小
      allWebsites.value.forEach((item, index) => {
        // 优先从数据中加载位置和大小
        if (item.position && item.size) {
          itemPositions.value[index] = { ...item.position }
          itemSizes.value[index] = { ...item.size }
        }
        // 如果已经初始化过，则不重新计算
        else if (itemPositions.value[index] && itemSizes.value[index]) {
          return
        }
        // 否则计算默认位置
        else {
          const row = Math.floor(index / itemsPerRow)
          const col = index % itemsPerRow

          const x = col * (defaultItemWidth + spacing) + spacing
          const y = row * (defaultItemHeight + spacing) + spacing

          itemPositions.value[index] = { x, y }
          itemSizes.value[index] = { width: defaultItemWidth, height: defaultItemHeight }
        }
      })
    }

    // 监听全屏状态变化
    watch(() => props.fullscreenIndex, (newVal, oldVal) => {
      // 进入全屏时自动显示按钮条
      if (newVal !== null && oldVal === null) {
        showFullscreenBar.value = true

        // 清除之前的定时器
        if (hideTimer) {
          clearTimeout(hideTimer)
        }

        // 2秒后自动隐藏
        hideTimer = setTimeout(() => {
          showFullscreenBar.value = false
        }, 2000)
      }
      // 退出全屏时清除定时器
      else if (newVal === null) {
        showFullscreenBar.value = false
        if (hideTimer) {
          clearTimeout(hideTimer)
        }
      }
    })
    const gridStyle = computed(() => {
      if (props.fullscreenIndex !== null) {
        return {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr'
        }
      }

      // 如果行数超过3，使用 minmax 让每行至少有固定高度，允许滚动
      const rowTemplate = props.rows > 3
        ? `repeat(${props.rows}, minmax(300px, 1fr))`
        : `repeat(${props.rows}, 1fr)`

      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${props.cols}, 1fr)`,
        gridTemplateRows: rowTemplate,
        gap: '10px'
      }
    })

    // 只显示已有的网站，不需要填充空白槽位
    const allWebsites = computed(() => {
      return props.websites || []
    })

    // 判断某个索引的网站是否应该隐藏
    const isHidden = (index) => {
      // 如果是全屏模式，隐藏所有非全屏的网站
      if (props.fullscreenIndex !== null) {
        return index !== props.fullscreenIndex
      }
      // 非全屏模式，不隐藏任何网站
      return false
    }

    // 获取网站URL，支持设备类型
    const getWebsiteUrl = (item) => {
      if (!item.url) return ''

      // 如果是手机版，尝试转换为移动版URL
      if (item.deviceType === 'mobile') {
        try {
          const url = new URL(item.url)
          const hostname = url.hostname

          // 常见网站的移动版转换规则
          const mobileRules = {
            // 如果已经是 m. 开头，不处理
            'm.': hostname,
            // 常见模式：www.example.com -> m.example.com
            'www.': hostname.replace(/^www\./, 'm.'),
            // 其他情况：example.com -> m.example.com
            'default': 'm.' + hostname.replace(/^www\./, '')
          }

          // 应用转换规则
          let newHostname = hostname
          if (hostname.startsWith('m.')) {
            // 已经是移动版，不变
            newHostname = hostname
          } else if (hostname.startsWith('www.')) {
            newHostname = hostname.replace(/^www\./, 'm.')
          } else {
            newHostname = 'm.' + hostname
          }

          url.hostname = newHostname
          return url.toString()
        } catch (e) {
          // URL 解析失败，返回原始URL
          console.warn('无法解析URL:', item.url)
          return item.url
        }
      }

      return item.url
    }

    // 获取项目样式
    const getItemStyle = (item, index) => {
      // 如果是全屏模式，不应用位置和大小样式（由CSS处理）
      if (props.fullscreenIndex === index) {
        return {}
      }

      // 如果位置还未初始化，先初始化
      if (!itemPositions.value[index] || !itemSizes.value[index]) {
        // 确保容器已存在
        const container = document.querySelector('.grid-container')
        if (container) {
          // 立即初始化该项目的位置
          const containerWidth = container.clientWidth
          const defaultItemWidth = 400
          const defaultItemHeight = 300
          const spacing = 20
          const itemsPerRow = Math.max(1, Math.floor(containerWidth / (defaultItemWidth + spacing)))

          const row = Math.floor(index / itemsPerRow)
          const col = index % itemsPerRow

          const x = col * (defaultItemWidth + spacing) + spacing
          const y = row * (defaultItemHeight + spacing) + spacing

          itemPositions.value[index] = { x, y }
          itemSizes.value[index] = { width: defaultItemWidth, height: defaultItemHeight }
        }
      }

      const position = itemPositions.value[index] || { x: 20, y: 20 }
      const size = itemSizes.value[index] || { width: 400, height: 300 }

      return {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDraggingItem.value && currentDragIndex.value === index ? 1000 : 1
      }
    }

    const startAddWebsite = (index) => {
      editingSlot.value = index
      newWebsite.value = {
        title: '',
        url: '',
        deviceType: 'desktop'
      }
    }

    const confirmAddWebsite = () => {
      if (newWebsite.value.title && newWebsite.value.url) {
        let url = newWebsite.value.url.trim()

        // 如果URL不是以 http:// 或 https:// 开头，自动添加 https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
        }

        // 验证URL格式
        try {
          new URL(url)
        } catch (e) {
          alert('请输入有效的网址格式，例如：google.com 或 https://google.com')
          return
        }

        // 如果是编辑模式
        if (editingSlot.value !== -1 && editingSlot.value !== null) {
          emit('update-website', {
            index: editingSlot.value,
            title: newWebsite.value.title,
            url: url,
            deviceType: newWebsite.value.deviceType
          })
        } else {
          // 添加模式
          emit('add-website', {
            title: newWebsite.value.title,
            url: url,
            deviceType: newWebsite.value.deviceType
          })
        }

        editingSlot.value = null
        newWebsite.value = { title: '', url: '', deviceType: 'desktop' }
      }
    }

    const cancelAddWebsite = () => {
      editingSlot.value = null
      newWebsite.value = { title: '', url: '', deviceType: 'desktop' }
    }

    const handleRemoveWebsite = (index) => {
      if (confirm(`确定要删除 "${props.websites[index].title}" 吗？`)) {
        emit('remove-website', index)
      }
    }

    // 刷新网站
    const handleRefreshWebsite = (index) => {
      const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe`)
      if (iframe) {
        iframe.src = iframe.src
      }
    }

    // 编辑网站
    const handleEditWebsite = (index) => {
      const website = props.websites[index]
      if (website) {
        editingSlot.value = index
        newWebsite.value = {
          title: website.title,
          url: website.url,
          deviceType: website.deviceType || 'desktop'
        }
      }
    }

    const handleGridMouseMove = (event) => {
      // 全屏模式下的逻辑
      if (props.fullscreenIndex !== null) {
        // 鼠标在顶部5px区域时显示退出按钮
        if (event.clientY < 5) {
          // 清除自动隐藏定时器
          if (hideTimer) {
            clearTimeout(hideTimer)
            hideTimer = null
          }
          showFullscreenBar.value = true
        }
        // 鼠标离开顶部60px区域时隐藏（给按钮条一些空间）
        else if (event.clientY > 60) {
          showFullscreenBar.value = false
        }
      }
    }

    const handleFullscreenBarLeave = () => {
      showFullscreenBar.value = false
    }

    const handleDragEnter = (event) => {
      // 检查是否是从外部拖入链接
      const types = event.dataTransfer.types
      if (types.includes('text/uri-list') || types.includes('text/plain') || types.includes('text/x-moz-url')) {
        isDragging.value = true
      }
    }

    const handleViewDragLeave = (event) => {
      // 检查是否真的离开了grid-view
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragging.value = false
        dragOverIndex.value = null
      }
    }

    const handleDragOver = (index) => {
      if (isDragging.value) {
        dragOverIndex.value = index
      }
    }

    const handleDragLeave = (event) => {
      // 检查是否真的离开了当前元素
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
        dragOverIndex.value = null
      }
    }

    const handleDrop = (event, index) => {
      isDragging.value = false
      dragOverIndex.value = null

      // 获取拖放的数据
      let url = ''
      let title = ''

      // 尝试从不同的数据格式中获取URL
      if (event.dataTransfer.getData('text/uri-list')) {
        url = event.dataTransfer.getData('text/uri-list')
      } else if (event.dataTransfer.getData('text/plain')) {
        url = event.dataTransfer.getData('text/plain')
      } else if (event.dataTransfer.getData('URL')) {
        url = event.dataTransfer.getData('URL')
      }

      // 尝试获取标题
      if (event.dataTransfer.getData('text/x-moz-url')) {
        const mozUrl = event.dataTransfer.getData('text/x-moz-url').split('\n')
        url = mozUrl[0]
        title = mozUrl[1] || ''
      }

      // 清理URL（移除可能的换行符）
      url = url.trim().split('\n')[0]

      if (!url || !url.startsWith('http')) {
        alert('请拖入有效的网址')
        return
      }

      // 如果没有标题，尝试从URL提取
      if (!title) {
        try {
          const urlObj = new URL(url)
          title = urlObj.hostname.replace('www.', '')
        } catch (e) {
          title = '新网站'
        }
      }

      // 如果已有网站，提示用户
      const currentWebsite = props.websites[index]
      if (currentWebsite && currentWebsite.url) {
        if (confirm(`是否将 "${currentWebsite.title}" 替换为 "${title}"？`)) {
          emit('update-website', { index, title, url })
        }
      } else {
        // 直接添加新网站
        emit('add-website', { title, url })
      }
    }

    // 开始拖拽项目
    const startDrag = (event, index) => {
      // 检查是否点击了调整大小的手柄
      if (event.target.classList.contains('resize-handle')) {
        return
      }

      // 检查是否点击了表单元素或其内部
      const target = event.target
      if (target.closest('.add-website-form') ||
          target.classList.contains('add-website-form') ||
          target.tagName === 'INPUT' ||
          target.tagName === 'BUTTON' ||
          target.closest('.floating-actions')) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      isDraggingItem.value = true
      currentDragIndex.value = index

      // 给 body 添加类，全局禁用 iframe
      document.body.classList.add('dragging-item')

      const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
      const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY

      dragStartPos.value = { x: clientX, y: clientY }
      dragStartItemPos.value = { ...itemPositions.value[index] }

      document.addEventListener('mousemove', handleDragMove, { passive: false })
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove, { passive: false })
      document.addEventListener('touchend', handleDragEnd)
    }

    // 处理拖拽移动
    const handleDragMove = (event) => {
      if (!isDraggingItem.value) return

      event.preventDefault()
      event.stopPropagation()

      const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
      const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

      const deltaX = clientX - dragStartPos.value.x
      const deltaY = clientY - dragStartPos.value.y

      const newX = Math.max(0, dragStartItemPos.value.x + deltaX)
      const newY = Math.max(0, dragStartItemPos.value.y + deltaY)

      const currentSize = itemSizes.value[currentDragIndex.value] || { width: 400, height: 300 }

      // 检测碰撞
      const hasCollision = checkCollisionWithOthers(currentDragIndex.value, { x: newX, y: newY }, currentSize)
      const currentPos = itemPositions.value[currentDragIndex.value]
      const movingAway = isMovingAway(currentDragIndex.value, currentPos, { x: newX, y: newY })

      isColliding.value = hasCollision

      // 如果没有碰撞，或者正在远离碰撞（解除重叠），允许移动
      if (!hasCollision || movingAway) {
        itemPositions.value[currentDragIndex.value] = { x: newX, y: newY }
      }
    }

    // 处理拖拽结束
    const handleDragEnd = () => {
      if (isDraggingItem.value && currentDragIndex.value !== -1) {
        // 吸附到网格
        const currentPos = itemPositions.value[currentDragIndex.value]
        if (currentPos) {
          const snappedPos = {
            x: snapToGrid(currentPos.x),
            y: snapToGrid(currentPos.y)
          }
          itemPositions.value[currentDragIndex.value] = snappedPos

          // 保存位置到数据中
          emit('update-website', {
            index: currentDragIndex.value,
            position: snappedPos
          })
        }
      }

      // 移除 body 类，恢复 iframe 交互
      document.body.classList.remove('dragging-item')

      isDraggingItem.value = false
      isColliding.value = false
      currentDragIndex.value = -1

      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }

    // 开始调整大小
    const startResize = (event, index, handle) => {
      event.preventDefault()
      event.stopPropagation()

      isResizing.value = true
      resizeHandle.value = handle
      currentDragIndex.value = index

      // 给 body 添加类，全局禁用 iframe
      document.body.classList.add('resizing-item')

      const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
      const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY

      dragStartPos.value = { x: clientX, y: clientY }
      dragStartItemPos.value = { ...itemPositions.value[index] }

      const currentSize = itemSizes.value[index] || { width: 300, height: 200 }
      dragStartItemPos.value = { ...dragStartItemPos.value, ...currentSize }

      document.addEventListener('mousemove', handleResizeMove, { passive: false })
      document.addEventListener('mouseup', handleResizeEnd)
      document.addEventListener('touchmove', handleResizeMove, { passive: false })
      document.addEventListener('touchend', handleResizeEnd)
    }

    // 处理调整大小移动
    const handleResizeMove = (event) => {
      if (!isResizing.value) return

      event.preventDefault()
      event.stopPropagation()

      const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
      const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

      const deltaX = clientX - dragStartPos.value.x
      const deltaY = clientY - dragStartPos.value.y

      const currentSize = itemSizes.value[currentDragIndex.value] || { width: 300, height: 200 }
      let newWidth = currentSize.width
      let newHeight = currentSize.height

      if (resizeHandle.value.includes('e')) {
        newWidth = Math.max(200, dragStartItemPos.value.width + deltaX)
      }
      if (resizeHandle.value.includes('s')) {
        newHeight = Math.max(150, dragStartItemPos.value.height + deltaY)
      }

      const currentPos = itemPositions.value[currentDragIndex.value] || { x: 0, y: 0 }

      // 检测碰撞
      const hasCollision = checkCollisionWithOthers(currentDragIndex.value, currentPos, { width: newWidth, height: newHeight })

      // 对于调整大小，检测是否在缩小（缩小总是允许的，因为可能在解除重叠）
      const currentSizeVal = itemSizes.value[currentDragIndex.value] || { width: 300, height: 200 }
      const isShrinking = newWidth < currentSizeVal.width || newHeight < currentSizeVal.height

      isColliding.value = hasCollision

      // 如果没有碰撞，或者正在缩小（解除重叠），允许调整
      if (!hasCollision || isShrinking) {
        itemSizes.value[currentDragIndex.value] = { width: newWidth, height: newHeight }
      }
    }

    // 处理调整大小结束
    const handleResizeEnd = () => {
      if (isResizing.value && currentDragIndex.value !== -1) {
        // 吸附到网格
        const currentSize = itemSizes.value[currentDragIndex.value]
        if (currentSize) {
          const snappedSize = {
            width: snapToGrid(currentSize.width),
            height: snapToGrid(currentSize.height)
          }
          itemSizes.value[currentDragIndex.value] = snappedSize

          // 保存大小到数据中
          emit('update-website', {
            index: currentDragIndex.value,
            size: snappedSize
          })
        }
      }

      // 移除 body 类，恢复 iframe 交互
      document.body.classList.remove('resizing-item')

      isResizing.value = false
      isColliding.value = false
      resizeHandle.value = ''
      currentDragIndex.value = -1

      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.removeEventListener('touchmove', handleResizeMove)
      document.removeEventListener('touchend', handleResizeEnd)
    }

    // 监听网站列表变化，初始化新添加的项目
    watch(allWebsites, () => {
      // 使用 nextTick 确保 DOM 已更新
      nextTick(() => {
        initializeGridLayout()
      })
    }, { immediate: false })

    // 组件挂载时初始化布局
    onMounted(() => {
      nextTick(() => {
        initializeGridLayout()
      })

      // 监听窗口大小变化
      window.addEventListener('resize', initializeGridLayout)
    })

    // 组件卸载时清理定时器和事件监听
    onUnmounted(() => {
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
      window.removeEventListener('resize', initializeGridLayout)
    })

    return {
      gridStyle,
      allWebsites,
      isHidden,
      getWebsiteUrl,
      getItemStyle,
      editingSlot,
      newWebsite,
      dragOverIndex,
      isDragging,
      showFullscreenBar,
      isColliding,
      startAddWebsite,
      confirmAddWebsite,
      cancelAddWebsite,
      handleRemoveWebsite,
      handleRefreshWebsite,
      handleEditWebsite,
      handleGridMouseMove,
      handleFullscreenBarLeave,
      handleDragEnter,
      handleViewDragLeave,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      startDrag,
      startResize
    }
  }
}
</script>

<style scoped>
.grid-view {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 15px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

/* 拖动/调整大小时的全局遮罩层 */
.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;  /* 在所有元素之上，但在全屏iframe之下 */
  background: transparent;
  cursor: move;
}

/* 添加网站浮动按钮 */
.btn-add-website-float {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(255, 92, 0, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 100;
}

.btn-add-website-float:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 92, 0, 0.5);
}

.btn-add-website-float svg {
  display: block;
}

/* 编辑网站对话框 */
.edit-website-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.edit-website-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.edit-website-dialog h3 {
  color: var(--primary-color);
  margin: 0 0 24px 0;
  font-size: 24px;
  text-align: center;
}

/* 隐藏滚动条 - Chrome, Safari */
.grid-view::-webkit-scrollbar {
  display: none;
}

.fullscreen-mode {
  padding: 0;
  overflow: hidden;
}

.fullscreen-exit-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;  /* 必须比全屏 iframe 的 9999 更高 */
  background: rgba(255, 92, 0, 0.95);
  padding: 0;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.btn-exit-fullscreen {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: white;
  border: none;
  padding: 12px 30px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-exit-fullscreen:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-exit-fullscreen svg {
  display: block;
}

.grid-container {
  width: 100%;
  min-height: 100%;
  height: auto;
  position: relative;
}

.grid-container.free-layout {
  position: relative;
  min-height: 100vh;
  background-image:
    linear-gradient(to right, rgba(255, 92, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 92, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}

/* 全局拖动或调整大小时，禁用所有iframe的鼠标事件 */
.grid-container.is-dragging .website-iframe {
  pointer-events: none;
}

.grid-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 300px;
  cursor: move;
  border: solid 1px #FF5C00;
}

.grid-item.draggable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* 拖动和调整大小时禁用所有动画 */
.grid-item.dragging,
.grid-item.resizing {
  transition: none !important;
}

/* 拖动时保持正在拖动的元素可交互 */
.grid-item.dragging {
  z-index: 9999 !important;  /* 确保在遮罩层之上 */
}

.grid-item.resizing {
  z-index: 9999 !important;  /* 确保在遮罩层之上 */
}

/* 碰撞时的视觉反馈 */
.grid-item.colliding {
  box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.5) !important;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.grid-item.hidden {
  display: none;
}

.grid-item.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding: 0;
}

.grid-item.drag-over {
  border: 3px dashed var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.website-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 拖动或调整大小时，禁用iframe的鼠标事件，防止操作中断 */
.grid-item.dragging .website-iframe,
.grid-item.resizing .website-iframe {
  pointer-events: none;
}

.website-iframe.mobile-view {
  max-width: 375px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 拖动手柄 */
.drag-handle {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 92, 0, 0.9);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  z-index: 150;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.grid-item:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: rgba(255, 92, 0, 1);
  transform: scale(1.05);
}

.drag-handle:active {
  transform: scale(0.95);
}

.drag-handle svg {
  display: block;
  stroke: white;
  fill: white;
}

/* 拖动时保持手柄可见 */
.grid-item.dragging .drag-handle {
  opacity: 1;
}

/* 全屏模式下隐藏拖动手柄 */
.grid-item.fullscreen .drag-handle {
  display: none;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: all;
}

.drop-hint {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 20px;
  background: rgba(255, 92, 0, 0.15);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 14px;
  z-index: 101;
  backdrop-filter: blur(4px);
  pointer-events: none;
  animation: pulse 1.5s ease-in-out infinite;
}

.drop-hint svg {
  stroke: var(--primary-color);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
}

.floating-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 101;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.floating-actions.show {
  opacity: 1;
  pointer-events: all;
}

.grid-item:hover .floating-actions {
  opacity: 1;
  pointer-events: all;
}

.btn-action {
  background: rgba(255, 92, 0, 0.7);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.btn-action:hover {
  background: rgba(255, 92, 0, 0.9);
  transform: scale(1.1);
}

.btn-action svg {
  display: block;
}

.btn-remove {
  background: rgba(255, 68, 68, 0.7) !important;
}

.btn-remove:hover {
  background: rgba(255, 0, 0, 0.9) !important;
}

/* 调整大小手柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 102;
}

.resize-handle {
  position: absolute;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: all;
}

.grid-item:hover .resize-handle {
  opacity: 0.8;
}

.resize-handle:hover {
  opacity: 1 !important;
  background: var(--primary-hover);
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
  border-radius: 0 0 8px 0;
}

.resize-e {
  top: 50%;
  right: 0;
  width: 4px;
  height: 20px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-s {
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 4px;
  transform: translateX(-50%);
  cursor: s-resize;
}

.empty-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  gap: 12px;
}

.empty-slot .empty-placeholder:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.empty-slot .empty-placeholder:hover svg {
  stroke: var(--primary-color);
  transform: scale(1.1);
}

.empty-placeholder svg {
  transition: all 0.3s;
}

.empty-slot.drag-over .empty-placeholder {
  background: rgba(255, 92, 0, 0.15);
  color: var(--primary-color);
  animation: pulse 1.5s ease-in-out infinite;
}

.empty-slot.drag-over .empty-placeholder svg {
  stroke: var(--primary-color);
}

.add-website-form {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px;
  background: white;
}

.add-website-form h3 {
  color: var(--primary-color);
  margin-bottom: 20px;
  font-size: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.device-type-selector {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.device-hint {
  margin-top: 10px;
  padding: 10px;
  background: #f0f7ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #1e40af;
}

.device-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  font-size: 14px;
  font-weight: 500;
}

.device-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.device-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.device-option input[type="radio"] {
  display: none;
}

.device-option span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-confirm:hover {
  background: var(--primary-hover);
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

.btn-remove {
  background: #ff4444 !important;
}

.btn-remove:hover {
  background: #ff0000 !important;
}

.btn-refresh {
  background: rgba(76, 175, 80, 0.7) !important;
}

.btn-refresh:hover {
  background: rgba(76, 175, 80, 0.9) !important;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.7) !important;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.9) !important;
}
</style>

