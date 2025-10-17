/**
 * 碰撞检测相关的可组合函数
 * 用于检测网格项目之间的重叠和碰撞
 */
import { ref } from 'vue'

export function useCollisionDetection() {
  const isColliding = ref(false)
  
  // 碰撞检测边距（一个网格单位）
  const COLLISION_MARGIN = 20

  /**
   * 检测两个矩形是否重叠
   */
  const checkCollision = (rect1, rect2) => {
    return !(rect1.x + rect1.width <= rect2.x ||
             rect2.x + rect2.width <= rect1.x ||
             rect1.y + rect1.height <= rect2.y ||
             rect2.y + rect2.height <= rect1.y)
  }

  /**
   * 检测指定索引的元素是否与其他元素碰撞（包含边距）
   */
  const checkCollisionWithOthers = (index, newPos, newSize, itemPositions, itemSizes, totalItems) => {
    // 扩大检测区域，为rect1添加边距
    const rect1 = {
      x: newPos.x - COLLISION_MARGIN / 2,
      y: newPos.y - COLLISION_MARGIN / 2,
      width: newSize.width + COLLISION_MARGIN,
      height: newSize.height + COLLISION_MARGIN
    }

    // 检测与其他所有元素的碰撞
    for (let i = 0; i < totalItems; i++) {
      if (i === index) continue // 跳过自己

      const pos = itemPositions[i]
      const size = itemSizes[i]

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

  /**
   * 检测移动是否在远离碰撞（用于允许从重叠状态移出）
   */
  const isMovingAway = (index, oldPos, newPos, itemPositions, itemSizes, currentSize, totalItems) => {
    // 检测与所有其他元素的距离是否在增加
    for (let i = 0; i < totalItems; i++) {
      if (i === index) continue

      const otherPos = itemPositions[i]
      const otherSize = itemSizes[i]

      if (!otherPos || !otherSize) continue

      // 计算中心点
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

  return {
    isColliding,
    checkCollisionWithOthers,
    isMovingAway
  }
}

