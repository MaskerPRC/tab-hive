/**
 * 碰撞推开算法
 * 处理蜂巢之间的碰撞，当一个蜂巢调整大小或移动时，自动推开其他蜂巢
 */

// 最小间距（像素）
const MIN_SPACING = 20

// 网格大小（像素）- 用于对齐
const GRID_SIZE = 20

// 最大递归深度，防止无限循环
const MAX_RECURSION_DEPTH = 10

/**
 * 将坐标吸附到网格点
 * @param {number} value - 要吸附的值
 * @returns {number} - 吸附后的值
 */
function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

// 推开方向优先级配置
const PUSH_DIRECTIONS = {
  HORIZONTAL: 'horizontal',  // 水平推开
  VERTICAL: 'vertical',      // 垂直推开
  DIAGONAL: 'diagonal'       // 对角推开
}

/**
 * 检测两个矩形是否重叠
 * @param {Object} rect1 - 第一个矩形 {x, y, width, height}
 * @param {Object} rect2 - 第二个矩形 {x, y, width, height}
 * @returns {boolean} - 是否重叠
 */
function checkOverlap(rect1, rect2) {
  return !(
    rect1.x + rect1.width + MIN_SPACING <= rect2.x ||
    rect2.x + rect2.width + MIN_SPACING <= rect1.x ||
    rect1.y + rect1.height + MIN_SPACING <= rect2.y ||
    rect2.y + rect2.height + MIN_SPACING <= rect1.y
  )
}

/**
 * 计算两个矩形的重叠区域
 * @param {Object} rect1 - 第一个矩形
 * @param {Object} rect2 - 第二个矩形
 * @returns {Object} - 重叠信息 {overlap, direction, distance}
 */
function calculateOverlap(rect1, rect2) {
  if (!checkOverlap(rect1, rect2)) {
    return { overlap: false, direction: null, distance: 0 }
  }

  // 计算中心点
  const center1 = {
    x: rect1.x + rect1.width / 2,
    y: rect1.y + rect1.height / 2
  }
  const center2 = {
    x: rect2.x + rect2.width / 2,
    y: rect2.y + rect2.height / 2
  }

  // 计算重叠量
  const overlapX = Math.min(
    rect1.x + rect1.width + MIN_SPACING - rect2.x,
    rect2.x + rect2.width + MIN_SPACING - rect1.x
  )
  const overlapY = Math.min(
    rect1.y + rect1.height + MIN_SPACING - rect2.y,
    rect2.y + rect2.height + MIN_SPACING - rect1.y
  )

  // 确定推开方向：基于重叠量更小的方向
  let direction
  let distance

  if (overlapX < overlapY) {
    // 水平推开
    direction = center1.x < center2.x ? 'right' : 'left'
    distance = overlapX
  } else {
    // 垂直推开
    direction = center1.y < center2.y ? 'down' : 'up'
    distance = overlapY
  }

  return {
    overlap: true,
    direction,
    distance,
    overlapX,
    overlapY
  }
}

/**
 * 根据方向计算新位置（并吸附到网格）
 * @param {Object} position - 当前位置 {x, y}
 * @param {string} direction - 推开方向
 * @param {number} distance - 推开距离
 * @returns {Object} - 新位置 {x, y}
 */
function calculateNewPosition(position, direction, distance) {
  let newPos = { ...position }

  switch (direction) {
    case 'right':
      newPos.x += distance
      break
    case 'left':
      newPos.x -= distance
      break
    case 'down':
      newPos.y += distance
      break
    case 'up':
      newPos.y -= distance
      break
  }

  // 吸附到网格点
  newPos.x = snapToGrid(newPos.x)
  newPos.y = snapToGrid(newPos.y)

  // 确保不会移出左上边界
  newPos.x = Math.max(0, newPos.x)
  newPos.y = Math.max(0, newPos.y)

  console.log(`[网格对齐] 推开后对齐到网格`, {
    oldPos: position,
    beforeSnap: { x: position.x + (direction === 'right' ? distance : direction === 'left' ? -distance : 0), y: position.y + (direction === 'down' ? distance : direction === 'up' ? -distance : 0) },
    afterSnap: newPos,
    direction,
    distance
  })

  return newPos
}

/**
 * 执行碰撞推开算法
 * @param {number} activeIndex - 正在调整的蜂巢索引
 * @param {Object} activePosition - 正在调整的蜂巢位置
 * @param {Object} activeSize - 正在调整的蜂巢尺寸
 * @param {Object} itemPositions - 所有蜂巢的位置映射
 * @param {Object} itemSizes - 所有蜂巢的尺寸映射
 * @param {number} totalItems - 蜂巢总数
 * @param {number} depth - 递归深度（内部使用）
 * @returns {Object} - 更新后的位置映射
 */
export function performCollisionPush(
  activeIndex,
  activePosition,
  activeSize,
  itemPositions,
  itemSizes,
  totalItems,
  depth = 0
) {
  console.log(`[碰撞推开] 开始处理 - 索引: ${activeIndex}, 深度: ${depth}`, {
    activePosition,
    activeSize,
    totalItems
  })

  // 防止无限递归
  if (depth > MAX_RECURSION_DEPTH) {
    console.warn('碰撞推开算法达到最大递归深度，停止处理')
    return itemPositions
  }

  // 复制位置映射，避免直接修改原数据
  const newPositions = { ...itemPositions }

  // 活动蜂巢的矩形
  const activeRect = {
    x: activePosition.x,
    y: activePosition.y,
    width: activeSize.width,
    height: activeSize.height
  }

  // 存储需要继续检查的蜂巢（被推动后可能推动其他蜂巢）
  const affectedIndices = []

  // 检查所有其他蜂巢
  for (let i = 0; i < totalItems; i++) {
    if (i === activeIndex) continue

    const pos = newPositions[i]
    const size = itemSizes[i]

    if (!pos || !size) continue

    const itemRect = {
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height
    }

    // 检测是否重叠
    const overlapInfo = calculateOverlap(activeRect, itemRect)

    if (overlapInfo.overlap) {
      console.log(`[碰撞推开] 检测到碰撞 - 蜂巢 ${activeIndex} 与蜂巢 ${i}`, {
        direction: overlapInfo.direction,
        distance: overlapInfo.distance,
        oldPos: pos,
        overlapX: overlapInfo.overlapX,
        overlapY: overlapInfo.overlapY
      })

      // 计算推开后的新位置（会自动吸附到网格）
      const newPos = calculateNewPosition(pos, overlapInfo.direction, overlapInfo.distance)

      console.log(`[碰撞推开] 推开蜂巢 ${i}（已对齐到网格）`, {
        oldPos: pos,
        newPos: newPos,
        direction: overlapInfo.direction,
        distance: overlapInfo.distance
      })

      // 更新位置
      newPositions[i] = newPos

      // 记录受影响的蜂巢，稍后递归处理
      affectedIndices.push(i)
    }
  }

  // 递归处理被推动的蜂巢，检查它们是否又推动了其他蜂巢
  console.log(`[碰撞推开] 受影响的蜂巢数量: ${affectedIndices.length}`, affectedIndices)

  for (const affectedIndex of affectedIndices) {
    const affectedPos = newPositions[affectedIndex]
    const affectedSize = itemSizes[affectedIndex]

    if (!affectedPos || !affectedSize) continue

    console.log(`[碰撞推开] 递归处理受影响的蜂巢 ${affectedIndex}`)

    // 递归调用，将被推动的蜂巢作为新的活动蜂巢
    const recursivePositions = performCollisionPush(
      affectedIndex,
      affectedPos,
      affectedSize,
      newPositions,
      itemSizes,
      totalItems,
      depth + 1
    )

    // 合并递归结果
    Object.assign(newPositions, recursivePositions)
  }

  console.log(`[碰撞推开] 完成处理 - 索引: ${activeIndex}, 深度: ${depth}`)

  return newPositions
}

/**
 * 优化版本：批量处理多个蜂巢的推开
 * 适用于同时调整多个蜂巢的场景
 * @param {Array} activeIndices - 正在调整的蜂巢索引数组
 * @param {Object} itemPositions - 所有蜂巢的位置映射
 * @param {Object} itemSizes - 所有蜂巢的尺寸映射
 * @param {number} totalItems - 蜂巢总数
 * @returns {Object} - 更新后的位置映射
 */
export function performBatchCollisionPush(
  activeIndices,
  itemPositions,
  itemSizes,
  totalItems
) {
  let currentPositions = { ...itemPositions }

  // 对每个活动蜂巢执行推开算法
  for (const activeIndex of activeIndices) {
    const activePos = currentPositions[activeIndex]
    const activeSize = itemSizes[activeIndex]

    if (!activePos || !activeSize) continue

    currentPositions = performCollisionPush(
      activeIndex,
      activePos,
      activeSize,
      currentPositions,
      itemSizes,
      totalItems,
      0
    )
  }

  return currentPositions
}

/**
 * 检测并返回所有碰撞的蜂巢对
 * @param {Object} itemPositions - 所有蜂巢的位置映射
 * @param {Object} itemSizes - 所有蜂巢的尺寸映射
 * @param {number} totalItems - 蜂巢总数
 * @returns {Array} - 碰撞对数组 [{index1, index2, overlap}, ...]
 */
export function detectAllCollisions(itemPositions, itemSizes, totalItems) {
  const collisions = []

  for (let i = 0; i < totalItems; i++) {
    for (let j = i + 1; j < totalItems; j++) {
      const pos1 = itemPositions[i]
      const size1 = itemSizes[i]
      const pos2 = itemPositions[j]
      const size2 = itemSizes[j]

      if (!pos1 || !size1 || !pos2 || !size2) continue

      const rect1 = { x: pos1.x, y: pos1.y, width: size1.width, height: size1.height }
      const rect2 = { x: pos2.x, y: pos2.y, width: size2.width, height: size2.height }

      const overlapInfo = calculateOverlap(rect1, rect2)

      if (overlapInfo.overlap) {
        collisions.push({
          index1: i,
          index2: j,
          ...overlapInfo
        })
      }
    }
  }

  return collisions
}

/**
 * 智能布局优化：尝试将所有蜂巢排列成无碰撞的布局
 * @param {Object} itemPositions - 所有蜂巢的位置映射
 * @param {Object} itemSizes - 所有蜂巢的尺寸映射
 * @param {number} totalItems - 蜂巢总数
 * @param {number} maxIterations - 最大迭代次数
 * @returns {Object} - 优化后的位置映射
 */
export function optimizeLayout(itemPositions, itemSizes, totalItems, maxIterations = 20) {
  let currentPositions = { ...itemPositions }
  let iteration = 0

  while (iteration < maxIterations) {
    const collisions = detectAllCollisions(currentPositions, itemSizes, totalItems)

    // 如果没有碰撞，布局已优化
    if (collisions.length === 0) {
      break
    }

    // 处理每个碰撞
    for (const collision of collisions) {
      const { index1, index2, direction, distance } = collision

      const pos2 = currentPositions[index2]
      if (!pos2) continue

      // 推开第二个蜂巢
      currentPositions[index2] = calculateNewPosition(pos2, direction, distance)
    }

    iteration++
  }

  if (iteration === maxIterations) {
    console.warn('布局优化达到最大迭代次数，可能仍存在碰撞')
  }

  return currentPositions
}

