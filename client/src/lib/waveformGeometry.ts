/**
 * 波浪形灯罩几何计算
 * 基于三圆相切的方法生成波浪边缘
 * 
 * 几何原理：
 * 1. 扇形分成 2*waveCount 等份
 * 2. 波谷圆位于偶数分割点（0, 2, 4...）
 * 3. 波峰圆位于奇数分割点（1, 3, 5...）
 * 4. 波峰圆满足三圆相切：与辅助圆内切，与左右波谷圆外切
 */

export interface WaveCircle {
  cx: number;  // 圆心x坐标
  cy: number;  // 圆心y坐标
  r: number;   // 半径
  angle: number; // 圆心角度（度）
  type: 'trough' | 'peak';  // 波谷或波峰
}

export interface WaveformGeometryResult {
  baselineR: number;          // 基准线半径
  auxiliaryR: number;         // 辅助圆半径（用于内切约束）
  troughCenterR: number;      // 波谷圆心半径
  peakR: number;              // 波峰圆半径
  circles: WaveCircle[];      // 所有波浪圆（按角度排序）
}

/**
 * 求解三圆相切问题 - 阿波罗尼斯问题的特殊情况
 * 
 * 给定：
 * - 辅助圆：圆心在原点，半径 auxiliaryR
 * - 波谷圆1：圆心 (x1, y1)，半径 troughR
 * - 波谷圆2：圆心 (x2, y2)，半径 troughR
 * - 波峰圆心角度 peakAngle
 * 
 * 求：波峰圆半径 peakR，使得：
 * 1. 波峰圆与辅助圆内切
 * 2. 波峰圆与波谷圆1外切
 * 3. 波峰圆与波谷圆2外切
 */
function solveThreeCircleTangency(
  auxiliaryR: number,
  troughR: number,
  trough1: { x: number; y: number },
  trough2: { x: number; y: number },
  peakAngle: number  // 波峰圆心的角度（度）
): number | null {
  // 将角度转换为弧度
  const peakAngleRad = (peakAngle * Math.PI) / 180;
  
  // 使用牛顿迭代法求解
  let peakR = 40; // 初始猜测值
  const maxIterations = 100;
  const tolerance = 1e-6;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // 根据内切条件计算波峰圆心位置
    // 内切：dist(peak_center, origin) = auxiliaryR - peakR
    const peakCenterR = auxiliaryR - peakR;
    const peakX = peakCenterR * Math.sin(peakAngleRad);
    const peakY = peakCenterR * Math.cos(peakAngleRad);
    
    // 计算到两个波谷圆的距离
    const dist1 = Math.sqrt((peakX - trough1.x) ** 2 + (peakY - trough1.y) ** 2);
    const dist2 = Math.sqrt((peakX - trough2.x) ** 2 + (peakY - trough2.y) ** 2);
    
    // 外切条件：dist = peakR + troughR
    const error1 = dist1 - (peakR + troughR);
    const error2 = dist2 - (peakR + troughR);
    
    // 检查收敛
    if (Math.abs(error1) < tolerance && Math.abs(error2) < tolerance) {
      return peakR;
    }
    
    // 使用平均误差作为目标函数
    const error = (error1 + error2) / 2;
    
    // 数值微分计算导数
    const delta = 0.01;
    const peakR2 = peakR + delta;
    const peakCenterR2 = auxiliaryR - peakR2;
    const peakX2 = peakCenterR2 * Math.sin(peakAngleRad);
    const peakY2 = peakCenterR2 * Math.cos(peakAngleRad);
    const dist1_2 = Math.sqrt((peakX2 - trough1.x) ** 2 + (peakY2 - trough1.y) ** 2);
    const dist2_2 = Math.sqrt((peakX2 - trough2.x) ** 2 + (peakY2 - trough2.y) ** 2);
    const error1_2 = dist1_2 - (peakR2 + troughR);
    const error2_2 = dist2_2 - (peakR2 + troughR);
    const error2_val = (error1_2 + error2_2) / 2;
    
    const derivative = (error2_val - error) / delta;
    
    // 牛顿迭代更新
    if (Math.abs(derivative) > 1e-10) {
      const newPeakR = peakR - error / derivative;
      
      // 确保在合理范围内
      if (newPeakR > 0 && newPeakR < auxiliaryR) {
        peakR = newPeakR;
      } else {
        // 如果超出范围，使用二分法
        peakR = peakR - error * 0.5;
      }
    } else {
      break;
    }
    
    // 边界检查
    if (peakR <= 0 || peakR >= auxiliaryR) {
      return null;
    }
  }
  
  return null; // 未收敛
}

/**
 * 计算波浪形灯罩的几何参数
 * 
 * @param baseR - 基准半径（外圆半径或内圆半径）
 * @param troughRadius - 波谷圆半径
 * @param waveHeight - 波高（从基准线到波峰最高点的径向距离）
 * @param waveCount - 波数
 * @param sectorAngle - 扇形角度（度）
 * @returns 几何计算结果，如果无法求解则返回null
 */
export function calculateWaveformGeometry(
  baseR: number,
  troughRadius: number,
  waveHeight: number,
  waveCount: number,
  sectorAngle: number  // 度
): WaveformGeometryResult | null {
  // 1. 计算辅助圆半径（用于内切约束）
  const auxiliaryR = baseR;
  
  // 2. 计算基准线半径（波浪的"中线"）
  const baselineR = baseR - waveHeight;
  
  // 3. 计算波谷圆心半径
  // 波谷圆与基准线外切，所以圆心在基准线上方 troughRadius 的距离
  const troughCenterR = baselineR + troughRadius;
  
  // 4. 计算分割角度
  const divisions = waveCount * 2;  // 分成 2*waveCount 份
  const anglePerDivision = sectorAngle / divisions;
  
  // 5. 计算起始角度（扇形中心对齐y轴，向两侧展开）
  const startAngle = -sectorAngle / 2;
  
  // 6. 生成所有波谷圆
  const troughCircles: Array<{ x: number; y: number; angle: number; index: number }> = [];
  const circles: WaveCircle[] = [];
  
  for (let i = 0; i <= divisions; i += 2) {
    const angle = startAngle + i * anglePerDivision;
    const angleRad = (angle * Math.PI) / 180;
    
    // 圆心位置（极坐标转直角坐标）
    const cx = troughCenterR * Math.sin(angleRad);
    const cy = troughCenterR * Math.cos(angleRad);
    
    troughCircles.push({ x: cx, y: cy, angle, index: i });
    circles.push({
      cx,
      cy,
      r: troughRadius,
      angle,
      type: 'trough'
    });
  }
  
  // 7. 求解波峰圆
  let peakR: number | null = null;
  const peakCircles: WaveCircle[] = [];
  
  for (let i = 1; i < divisions; i += 2) {
    const angle = startAngle + i * anglePerDivision;
    
    // 找到左右两个波谷圆
    const leftTroughIndex = Math.floor(i / 2);
    const rightTroughIndex = leftTroughIndex + 1;
    
    if (rightTroughIndex >= troughCircles.length) {
      console.error(`波峰圆索引 ${i} 超出范围`);
      continue;
    }
    
    const leftTrough = troughCircles[leftTroughIndex];
    const rightTrough = troughCircles[rightTroughIndex];
    
    // 求解波峰圆半径
    const solvedPeakR = solveThreeCircleTangency(
      auxiliaryR,
      troughRadius,
      leftTrough,
      rightTrough,
      angle
    );
    
    if (solvedPeakR === null) {
      console.error(`无法求解波峰圆 at angle ${angle}°`);
      return null;
    }
    
    // 所有波峰圆应该有相同的半径（由于对称性）
    if (peakR === null) {
      peakR = solvedPeakR;
    }
    
    // 计算波峰圆心位置（内切条件）
    const peakCenterR = auxiliaryR - solvedPeakR;
    const angleRad = (angle * Math.PI) / 180;
    const cx = peakCenterR * Math.sin(angleRad);
    const cy = peakCenterR * Math.cos(angleRad);
    
    peakCircles.push({
      cx,
      cy,
      r: solvedPeakR,
      angle,
      type: 'peak'
    });
  }
  
  if (peakR === null) {
    console.error('无法求解任何波峰圆');
    return null;
  }
  
  // 8. 合并并按角度排序所有圆
  const allCircles = [...circles, ...peakCircles].sort((a, b) => a.angle - b.angle);
  
  return {
    baselineR,
    auxiliaryR,
    troughCenterR,
    peakR,
    circles: allCircles
  };
}
