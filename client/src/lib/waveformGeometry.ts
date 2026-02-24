/**
 * Waveform Lampshade Geometry Calculator
 * 
 * Simplified algorithm using fixed peak/trough radius ratio
 */

export interface WaveCircle {
  cx: number;      // 圆心x坐标
  cy: number;      // 圆心y坐标
  r: number;       // 半径
  angle: number;   // 角度（度）
  type: 'peak' | 'trough';  // 圆类型
}

export interface WaveformGeometryResult {
  circles: WaveCircle[];   // 所有波浪圆（波峰圆和波谷圆）
  peakR: number;           // 波峰圆半径
  troughR: number;         // 波谷圆半径
  auxiliaryR: number;      // 辅助圆半径（基准线）
}

/**
 * 计算波浪形灯罩的几何参数（简化版本）
 * 
 * 使用固定的波峰/波谷半径比例，避免复杂的三圆相切求解
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
  // 1. 计算波峰圆半径（使用固定比例）
  // 根据参考图：波峰43.216mm，波谷3mm，波高10mm
  // 比例：peakR / troughR ≈ 14.4
  // 或者：peakR / waveHeight ≈ 4.3
  const peakRadius = waveHeight * 4.3;
  
  // 2. 计算辅助圆半径（波浪的基准线，在波峰和波谷之间）
  const auxiliaryR = baseR - waveHeight / 2;
  
  // 3. 计算圆心半径
  // 波峰圆：从内侧与外圆相切，最外侧点在baseR处
  const peakCenterR = baseR - peakRadius;
  // 波谷圆：向内凹进，最外侧点距离原点baseR - waveHeight + 2*troughRadius
  const troughCenterR = baseR - waveHeight + troughRadius;
  
  // 4. 计算分割角度
  const divisions = waveCount * 2;  // 分成 2*waveCount 份
  const anglePerDivision = sectorAngle / divisions;
  
  // 5. 计算起始角度（扇形中心对齐y轴，向两侧展开）
  const startAngle = -sectorAngle / 2;
  
  // 6. 生成所有波峰圆和波谷圆
  const circles: WaveCircle[] = [];
  
  for (let i = 0; i <= divisions; i++) {
    const angle = startAngle + i * anglePerDivision;
    const angleRad = (angle * Math.PI) / 180;
    
    // 偶数位置（包括0和divisions）：波峰圆
    // 奇数位置：波谷圆
    const isPeak = i % 2 === 0;
    
    const centerR = isPeak ? peakCenterR : troughCenterR;
    const radius = isPeak ? peakRadius : troughRadius;
    
    // 圆心位置（极坐标转直角坐标）
    const cx = centerR * Math.sin(angleRad);
    const cy = centerR * Math.cos(angleRad);
    
    circles.push({
      cx,
      cy,
      r: radius,
      angle,
      type: isPeak ? 'peak' : 'trough'
    });
  }
  
  return {
    circles,
    peakR: peakRadius,
    troughR: troughRadius,
    auxiliaryR
  };
}
