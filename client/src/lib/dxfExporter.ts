import type { CalculationResult } from "./lampshadeCalculator";
import { PolygonLampshadeResult } from "./polygonLampshadeCalculator";
import { WaveformLampshadeResult } from "./waveformLampshadeCalculator";
import { calculateWaveformGeometry } from "./waveformGeometry";

/**
 * DXF Exporter for Lampshade Unfolding Pattern
 * 
 * Generates a standard DXF file using ARC entities for proper arc rendering in AutoCAD.
 * All lampshade types unfold into annulus sectors (sector rings):
 * - Conical: smooth inner/outer arcs
 * - Polygonal: smooth arcs with dividing lines for each face
 * - Waveform: wavy inner/outer arcs along the arc path
 */

export function generateDXFContent(result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult): string {
  // Check if it's a polygon or waveform result
  if ('sides' in result) {
    return generatePolygonDXF(result as PolygonLampshadeResult);
  } else if ('waveCount' in result) {
    return generateWaveformDXF(result as WaveformLampshadeResult);
  }
  
  // Otherwise it's a cone result
  if (!result.isValid) {
    throw new Error("Cannot export invalid calculation result");
  }

  const lines: string[] = [];

  // SECTION: HEADER
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("HEADER");
  
  lines.push("9");
  lines.push("$ACADVER");
  lines.push("1");
  lines.push("AC1009");
  
  const maxExtent = Math.max(result.outerRadius, result.innerRadius) * 1.2;
  lines.push("9");
  lines.push("$EXTMIN");
  lines.push("10");
  lines.push(String(-maxExtent));
  lines.push("20");
  lines.push(String(-maxExtent));
  
  lines.push("9");
  lines.push("$EXTMAX");
  lines.push("10");
  lines.push(String(maxExtent));
  lines.push("20");
  lines.push(String(maxExtent));
  
  lines.push("0");
  lines.push("ENDSEC");

  // SECTION: TABLES
  addTablesSection(lines);

  // SECTION: BLOCKS
  addBlocksSection(lines);

  // SECTION: ENTITIES
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("ENTITIES");

  const centerX = 0;
  const centerY = 0;

  // Draw outer arc
  const outerStartAngle = 270 - result.sectorAngle / 2;
  const outerEndAngle = 270 + result.sectorAngle / 2;

  addArc(lines, centerX, centerY, result.outerRadius, outerStartAngle, outerEndAngle);
  addArc(lines, centerX, centerY, result.innerRadius, outerStartAngle, outerEndAngle);

  // Draw left radius line
  const leftOuterX = centerX + result.outerRadius * Math.cos((outerStartAngle * Math.PI) / 180);
  const leftOuterY = centerY + result.outerRadius * Math.sin((outerStartAngle * Math.PI) / 180);
  const leftInnerX = centerX + result.innerRadius * Math.cos((outerStartAngle * Math.PI) / 180);
  const leftInnerY = centerY + result.innerRadius * Math.sin((outerStartAngle * Math.PI) / 180);

  addLine(lines, leftOuterX, leftOuterY, leftInnerX, leftInnerY);

  // Draw right radius line
  const rightOuterX = centerX + result.outerRadius * Math.cos((outerEndAngle * Math.PI) / 180);
  const rightOuterY = centerY + result.outerRadius * Math.sin((outerEndAngle * Math.PI) / 180);
  const rightInnerX = centerX + result.innerRadius * Math.cos((outerEndAngle * Math.PI) / 180);
  const rightInnerY = centerY + result.innerRadius * Math.sin((outerEndAngle * Math.PI) / 180);

  addLine(lines, rightOuterX, rightOuterY, rightInnerX, rightInnerY);

  // Add dimension text
  addText(lines, 0, -(result.outerRadius + result.innerRadius) / 4, 15, `R=${result.outerRadius.toFixed(1)}`);
  addText(lines, 0, -(result.outerRadius + result.innerRadius) / 2, 15, `r=${result.innerRadius.toFixed(1)}`);
  addText(lines, result.outerRadius * 0.7, 0, 15, `θ=${result.sectorAngle.toFixed(1)}°`);

  lines.push("0");
  lines.push("ENDSEC");

  // EOF
  lines.push("0");
  lines.push("EOF");

  return lines.join("\n");
}

/**
 * Generate DXF content for polygon lampshade
 */
function generatePolygonDXF(result: PolygonLampshadeResult): string {
  const lines: string[] = [];

  // SECTION: HEADER
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("HEADER");
  
  lines.push("9");
  lines.push("$ACADVER");
  lines.push("1");
  lines.push("AC1009");
  lines.push("0");
  lines.push("ENDSEC");

  // SECTION: TABLES
  addTablesSection(lines);

  // SECTION: BLOCKS
  addBlocksSection(lines);

  // SECTION: ENTITIES
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("ENTITIES");

  // Draw the complete unfolded pattern as a sector ring
  const outerR = result.singleFaceOuterRadius;
  const innerR = result.singleFaceInnerRadius;
  const singleAngle = (result.singleFaceSectorAngle * Math.PI) / 180;
  const totalAngle = (result.totalSectorAngle * Math.PI) / 180;

  // Draw outer arc
  addArc(lines, 0, 0, outerR, 0, result.totalSectorAngle);

  // Draw inner arc
  addArc(lines, 0, 0, innerR, 0, result.totalSectorAngle);

  // Draw left radial line
  addLine(lines, outerR, 0, innerR, 0);

  // Draw right radial line
  const outerArcEndX = outerR * Math.cos(totalAngle);
  const outerArcEndY = outerR * Math.sin(totalAngle);
  const innerArcEndX = innerR * Math.cos(totalAngle);
  const innerArcEndY = innerR * Math.sin(totalAngle);

  addLine(lines, outerArcEndX, outerArcEndY, innerArcEndX, innerArcEndY);

  // Draw dividing lines for each face
  for (let i = 1; i < result.sides; i++) {
    const angle = i * singleAngle;
    const outerX = outerR * Math.cos(angle);
    const outerY = outerR * Math.sin(angle);
    const innerX = innerR * Math.cos(angle);
    const innerY = innerR * Math.sin(angle);

    addLine(lines, outerX, outerY, innerX, innerY);
  }

  // Add text annotation
  addText(lines, 0, -50, 20, `Polygon Lampshade - ${result.sides} Sides`);

  lines.push("0");
  lines.push("ENDSEC");

  // EOF
  lines.push("0");
  lines.push("EOF");

  return lines.join("\n");
}

/**
 * Generate DXF content for waveform lampshade
 * 
 * The waveform lampshade unfolds into an annulus sector (same as conical),
 * but with wavy inner and/or outer arcs. The waves are evenly distributed
 * along the arc path (radial direction).
 * 
 * In the unfolded sector:
 * - inner arc = top edge of lampshade (smaller radius)
 * - outer arc = bottom edge of lampshade (larger radius)
 * 
 * Wave distribution: each wave occupies exactly (sectorAngle / waveCount) degrees,
 * ensuring uniform distribution across the entire arc.
 * 
 * Wave amplitude = waveHeight / 2, so peak-to-trough distance = waveHeight.
 * This matches the user's expectation that waveHeight is the total wave height.
 */
function generateWaveformDXF(result: WaveformLampshadeResult): string {
  const lines: string[] = [];

  const outerR = result.outerRadius;
  const innerR = result.innerRadius;
  const sectorAngleDeg = result.sectorAngle;
  const sectorAngleRad = result.sectorAngleRad;
  const waveCount = result.waveCount;
  const waveHeight = result.waveHeight;
  const topWave = result.topWave;     // top edge = inner arc
  const bottomWave = result.bottomWave; // bottom edge = outer arc

  // SECTION: HEADER
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("HEADER");
  
  lines.push("9");
  lines.push("$ACADVER");
  lines.push("1");
  lines.push("AC1009");
  
  const maxExtent = (outerR + waveHeight) * 1.5;
  lines.push("9");
  lines.push("$EXTMIN");
  lines.push("10");
  lines.push(String(-maxExtent));
  lines.push("20");
  lines.push(String(-maxExtent));
  
  lines.push("9");
  lines.push("$EXTMAX");
  lines.push("10");
  lines.push(String(maxExtent));
  lines.push("20");
  lines.push(String(maxExtent));
  
  lines.push("0");
  lines.push("ENDSEC");

  // SECTION: TABLES
  addTablesSection(lines);

  // SECTION: BLOCKS
  addBlocksSection(lines);

  // SECTION: ENTITIES
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("ENTITIES");

  // Center the sector at angle 90 (pointing up) to match geometry coordinate system
  const startAngleDeg = 90 - sectorAngleDeg / 2;
  const startAngleRad = (startAngleDeg * Math.PI) / 180;
  const endAngleRad = startAngleRad + sectorAngleRad;

  // Helper: calculate intersection of two circles
  const circleIntersection = (cx1: number, cy1: number, r1: number, cx2: number, cy2: number, r2: number, chooseOuter: boolean) => {
    const d = Math.sqrt((cx2 - cx1) ** 2 + (cy2 - cy1) ** 2);
    const a = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 ** 2 - a ** 2));
    
    const px = cx1 + a * (cx2 - cx1) / d;
    const py = cy1 + a * (cy2 - cy1) / d;
    
    const x1 = px + h * (cy2 - cy1) / d;
    const y1 = py - h * (cx2 - cx1) / d;
    const x2 = px - h * (cy2 - cy1) / d;
    const y2 = py + h * (cx2 - cx1) / d;
    
    // Choose the intersection point farther from or closer to origin
    const r1_sq = x1 ** 2 + y1 ** 2;
    const r2_sq = x2 ** 2 + y2 ** 2;
    
    return chooseOuter ? (r1_sq > r2_sq ? {x: x1, y: y1} : {x: x2, y: y2}) : (r1_sq < r2_sq ? {x: x1, y: y1} : {x: x2, y: y2});
  };

  // Helper: generate continuous tangent arc waves using three-circle tangency
  const generateWaveArcs = (baseR: number) => {
    const troughR = result.troughRadius;
    
    // Calculate wave geometry using three-circle tangency
    const geometry = calculateWaveformGeometry(
      baseR,
      troughR,
      waveHeight,
      waveCount,
      sectorAngleDeg
    );
    
    if (!geometry) {
      console.error('Failed to calculate waveform geometry');
      return [];
    }
    
    // Use geometry coordinates directly (no rotation needed)
    // Geometry already has correct circle centers in Cartesian coordinates
    const allCircles: Array<{cx: number, cy: number, r: number, angle: number, type: 'trough' | 'peak'}> = [];
    
    for (const circle of geometry.circles) {
      allCircles.push({
        cx: circle.cx,
        cy: circle.cy,
        r: circle.r,
        angle: circle.angle,
        type: circle.type
      });
    }
    
    // Calculate arc endpoints using tangent conditions
    const arcs: Array<{cx: number, cy: number, r: number, p1x: number, p1y: number, p2x: number, p2y: number, type: 'trough' | 'peak'}> = [];
    
    for (let i = 0; i < allCircles.length; i++) {
      const circle = allCircles[i];
      
      // Calculate start point
      let p1;
      if (i === 0) {
        // First arc: intersect with left boundary line (at higher angle)
        // Use DXF coordinate system angle directly
        const lineX = Math.cos(endAngleRad);
        const lineY = Math.sin(endAngleRad);
        
        // Calculate intersection of circle with boundary line
        // Circle center distance from origin
        const centerDist = Math.sqrt(circle.cx ** 2 + circle.cy ** 2);
        const centerAngle = Math.atan2(circle.cy, circle.cx);
        const angleDiff = endAngleRad - centerAngle;
        const perpDist = centerDist * Math.sin(angleDiff);
        
        // Distance along the line to the intersection
        const proj = centerDist * Math.cos(angleDiff);
        const offset = Math.sqrt(Math.max(0, circle.r ** 2 - perpDist ** 2));
        const dist = proj - offset;  // Choose the nearer intersection (inner side of the wave)
        
        p1 = {
          x: dist * lineX,
          y: dist * lineY
        };
      } else {
        // Tangent point with previous arc (external tangency)
        const prev = allCircles[i - 1];
        const dx = circle.cx - prev.cx;
        const dy = circle.cy - prev.cy;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);
        
        if (dist > 0) {
          const t = prev.r / dist;
          p1 = {
            x: prev.cx + t * dx,
            y: prev.cy + t * dy
          };
        } else {
          console.error('Circles have same center');
          continue;
        }
      }
      
      // Calculate end point
      let p2;
      if (i === allCircles.length - 1) {
        // Last arc: intersect with right boundary line (at lower angle)
        // Use DXF coordinate system angle directly
        const lineX = Math.cos(startAngleRad);
        const lineY = Math.sin(startAngleRad);
        
        // Calculate intersection of circle with boundary line
        // Circle center distance from origin
        const centerDist = Math.sqrt(circle.cx ** 2 + circle.cy ** 2);
        const centerAngle = Math.atan2(circle.cy, circle.cx);
        const angleDiff = startAngleRad - centerAngle;
        const perpDist = centerDist * Math.sin(angleDiff);
        
        // Distance along the line to the intersection
        const proj = centerDist * Math.cos(angleDiff);
        const offset = Math.sqrt(Math.max(0, circle.r ** 2 - perpDist ** 2));
        const dist = proj - offset;  // Choose the nearer intersection (inner side of the wave)
        
        p2 = {
          x: dist * lineX,
          y: dist * lineY
        };
      } else {
        // Tangent point with next arc (external tangency)
        const next = allCircles[i + 1];
        const dx = next.cx - circle.cx;
        const dy = next.cy - circle.cy;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);
        
        if (dist > 0) {
          const t = circle.r / dist;
          p2 = {
            x: circle.cx + t * dx,
            y: circle.cy + t * dy
          };
        } else {
          console.error('Circles have same center');
          continue;
        }
      }
      
      arcs.push({
        cx: circle.cx,
        cy: circle.cy,
        r: circle.r,
        p1x: p1.x,
        p1y: p1.y,
        p2x: p2.x,
        p2y: p2.y,
        type: circle.type
      });
    }
    
    return arcs;
  };
  
  // Helper: draw wave arcs to DXF
  const drawWaveArcs = (arcs: Array<{cx: number, cy: number, r: number, p1x: number, p1y: number, p2x: number, p2y: number, type: 'trough' | 'peak'}>, clipInnerR?: number) => {
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      console.log(`Arc ${i+1}: center=(${arc.cx.toFixed(2)}, ${arc.cy.toFixed(2)}), r=${arc.r.toFixed(2)}, p1=(${arc.p1x.toFixed(2)}, ${arc.p1y.toFixed(2)}), p2=(${arc.p2x.toFixed(2)}, ${arc.p2y.toFixed(2)})`);
      
      // 边界波峰圆（第一个和最后一个）绘制为被裁剪的圆弧
      if (i === 0 || i === arcs.length - 1) {
        console.log(`  Drawing as trimmed arc (boundary peak)`);
        
        // 计算圆与左右边界线的交点
        // 左边界线：角度 = endAngleRad（较大角度）
        // 右边界线：角度 = startAngleRad（较小角度）
        
        const centerDist = Math.sqrt(arc.cx ** 2 + arc.cy ** 2);
        const centerAngle = Math.atan2(arc.cy, arc.cx);
        
        // 计算与左边界线的交点角度（相对于圆心）
        const angleDiffLeft = endAngleRad - centerAngle;
        const perpDistLeft = centerDist * Math.sin(angleDiffLeft);
        const projLeft = centerDist * Math.cos(angleDiffLeft);
        const offsetLeft = Math.sqrt(Math.max(0, arc.r ** 2 - perpDistLeft ** 2));
        
        // 两个交点：一个靠近原点，一个远离原点
        const distLeft1 = projLeft - offsetLeft;
        const distLeft2 = projLeft + offsetLeft;
        const leftX1 = distLeft1 * Math.cos(endAngleRad);
        const leftY1 = distLeft1 * Math.sin(endAngleRad);
        const leftX2 = distLeft2 * Math.cos(endAngleRad);
        const leftY2 = distLeft2 * Math.sin(endAngleRad);
        
        // 计算与右边界线的交点角度（相对于圆心）
        const angleDiffRight = startAngleRad - centerAngle;
        const perpDistRight = centerDist * Math.sin(angleDiffRight);
        const projRight = centerDist * Math.cos(angleDiffRight);
        const offsetRight = Math.sqrt(Math.max(0, arc.r ** 2 - perpDistRight ** 2));
        
        const distRight1 = projRight - offsetRight;
        const distRight2 = projRight + offsetRight;
        const rightX1 = distRight1 * Math.cos(startAngleRad);
        const rightY1 = distRight1 * Math.sin(startAngleRad);
        const rightX2 = distRight2 * Math.cos(startAngleRad);
        const rightY2 = distRight2 * Math.sin(startAngleRad);
        
        // 选择在扇形内的交点（远离原点的那个）
        let leftAngle = Math.atan2(leftY2 - arc.cy, leftX2 - arc.cx) * 180 / Math.PI;
        let rightAngle = Math.atan2(rightY2 - arc.cy, rightX2 - arc.cx) * 180 / Math.PI;
        
        // 内圆裁剪：检查边界波峰圆是否与内圆相交
        if (clipInnerR) {
          const minDist = Math.abs(centerDist - arc.r);
          const maxDist = centerDist + arc.r;
          
          if (minDist < clipInnerR && clipInnerR < maxDist) {
            console.log(`  Boundary peak intersects inner circle, clipping...`);
            
            // 计算圆与内圆的交点
            const d = centerDist;
            const R = arc.r;
            const r = clipInnerR;
            
            // 使用余弦定理计算交点角度
            const cosAlpha = (d * d + R * R - r * r) / (2 * d * R);
            const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
            
            // 两个交点相对于圆心的角度
            const intersect1Angle = (centerAngle + alpha) * 180 / Math.PI;
            const intersect2Angle = (centerAngle - alpha) * 180 / Math.PI;
            
            console.log(`  Inner circle intersection angles: ${intersect1Angle.toFixed(2)}°, ${intersect2Angle.toFixed(2)}°`);
            
            // 检查哪些端点需要被裁剪
            // 判断点是否在内圆以内
            const rightDist = Math.sqrt(rightX2 ** 2 + rightY2 ** 2);
            const leftDist = Math.sqrt(leftX2 ** 2 + leftY2 ** 2);
            
            if (rightDist < clipInnerR) {
              // 右端点在内圆以内，替换为交点
              rightAngle = i === 0 ? intersect2Angle : intersect1Angle;
              console.log(`  Right endpoint clipped to ${rightAngle.toFixed(2)}°`);
            }
            
            if (leftDist < clipInnerR) {
              // 左端点在内圆以内，替换为交点
              leftAngle = i === 0 ? intersect1Angle : intersect2Angle;
              console.log(`  Left endpoint clipped to ${leftAngle.toFixed(2)}°`);
            }
          }
        }
        
        // 规范化角度到 [0, 360)
        let a1 = rightAngle < 0 ? rightAngle + 360 : rightAngle;
        let a2 = leftAngle < 0 ? leftAngle + 360 : leftAngle;
        
        // 确保 a2 > a1 以便逆时针绘制
        if (a2 < a1) a2 += 360;
        
        console.log(`  Final arc angles: a1=${a1.toFixed(2)}°, a2=${a2.toFixed(2)}°`);
        
        addArc(lines, arc.cx, arc.cy, arc.r, a1, a2);
        continue;
      }
      
      // 检查是否需要内圆裁剪（仅对波峰圆）
      let p1x = arc.p1x, p1y = arc.p1y, p2x = arc.p2x, p2y = arc.p2y;
      
      if (clipInnerR && arc.type === 'peak' && i !== 0 && i !== arcs.length - 1) {
        // 这是波峰圆，检查是否超出内圆
        const centerDist = Math.sqrt(arc.cx ** 2 + arc.cy ** 2);
        
        // 计算圆弧与内圆的交点
        // 使用正确的两圆相交公式
        const r1 = clipInnerR;  // 内圆半径
        const r2 = arc.r;       // 波峰圆半径
        
        // 如果波峰圆完全在内圆以内（圆心到原点的距离 + 圆半径 < 内圆半径），跳过这个圆弧
        if (centerDist + r2 < r1) {
          console.log(`  Skipping arc ${i+1}: completely inside inner circle`);
          continue;
        }
        
        // 检查两圆是否相交
        if (centerDist < r1 + r2 && centerDist > Math.abs(r1 - r2)) {
          // 计算两圆心连线上的投影距离
          const a = (r1 * r1 - r2 * r2 + centerDist * centerDist) / (2 * centerDist);
          
          // 计算垂直于连线方向的距离
          const h = Math.sqrt(r1 * r1 - a * a);
          
          // 两圆心连线的单位向量
          const ux = arc.cx / centerDist;
          const uy = arc.cy / centerDist;
          
          // 投影点坐标（在两圆心连线上）
          const px = a * ux;
          const py = a * uy;
          
          // 垂直方向的单位向量
          const vx = -uy;
          const vy = ux;
          
          // 两个交点坐标
          const intersect1X = px + h * vx;
          const intersect1Y = py + h * vy;
          const intersect2X = px - h * vx;
          const intersect2Y = py - h * vy;
          
          // 检查p1和p2是否超出内圆
          const p1Dist = Math.sqrt(p1x ** 2 + p1y ** 2);
          const p2Dist = Math.sqrt(p2x ** 2 + p2y ** 2);
          
          // 如果p1超出内圆（距离小于innerR），用交点替换
          if (p1Dist < clipInnerR) {
            // 选择距离p1更近的交点
            const dist1 = Math.sqrt((p1x - intersect1X) ** 2 + (p1y - intersect1Y) ** 2);
            const dist2 = Math.sqrt((p1x - intersect2X) ** 2 + (p1y - intersect2Y) ** 2);
            if (dist1 < dist2) {
              p1x = intersect1X;
              p1y = intersect1Y;
            } else {
              p1x = intersect2X;
              p1y = intersect2Y;
            }
            console.log(`  Clipped p1 to inner circle: (${p1x.toFixed(2)}, ${p1y.toFixed(2)})`);
          }
          
          // 如果p2超出内圆，用交点替换
          if (p2Dist < clipInnerR) {
            const dist1 = Math.sqrt((p2x - intersect1X) ** 2 + (p2y - intersect1Y) ** 2);
            const dist2 = Math.sqrt((p2x - intersect2X) ** 2 + (p2y - intersect2Y) ** 2);
            if (dist1 < dist2) {
              p2x = intersect1X;
              p2y = intersect1Y;
            } else {
              p2x = intersect2X;
              p2y = intersect2Y;
            }
            console.log(`  Clipped p2 to inner circle: (${p2x.toFixed(2)}, ${p2y.toFixed(2)})`);
          }
        }
      }
      
      // Calculate DXF ARC angles (relative to arc center)
      let a1 = Math.atan2(p1y - arc.cy, p1x - arc.cx) * 180 / Math.PI;
      let a2 = Math.atan2(p2y - arc.cy, p2x - arc.cx) * 180 / Math.PI;
      console.log(`  Raw angles: a1=${a1.toFixed(2)}°, a2=${a2.toFixed(2)}°`);
      
      // Normalize angles to [0, 360)
      if (a1 < 0) a1 += 360;
      if (a2 < 0) a2 += 360;
      
      // Calculate the angle span in both directions
      let spanCCW = a2 - a1;
      if (spanCCW < 0) spanCCW += 360;
      
      console.log(`  Normalized: a1=${a1.toFixed(2)}°, a2=${a2.toFixed(2)}°, spanCCW=${spanCCW.toFixed(2)}°`);
      
      // DXF draws arcs counter-clockwise. If the CCW span > 180°, 
      // it means the short arc is in the clockwise direction.
      // In that case, we need to reverse the direction by swapping angles
      if (spanCCW > 180) {
        // Swap start and end to draw the short arc
        const temp = a1;
        a1 = a2;
        a2 = temp;
        // Now recalculate span
        spanCCW = 360 - spanCCW;
      }
      
      // Ensure a2 > a1 for CCW drawing (add 360 if needed)
      while (a2 <= a1) {
        a2 += 360;
      }
      
      console.log(`  Final: a1=${a1.toFixed(2)}°, a2=${a2.toFixed(2)}°, span=${(a2-a1).toFixed(2)}°`);
      
      addArc(lines, arc.cx, arc.cy, arc.r, a1, a2);
    }
  };

  // Physical lampshade structure:
  // - 下口 (bottom/large opening) = outerR (large radius in unfolding)
  // - 上口 (top/small opening) = innerR (small radius in unfolding)
  
  // Draw outer arc (large radius = bottom opening of lampshade)
  if (bottomWave) {
    const arcs = generateWaveArcs(outerR);
    drawWaveArcs(arcs, innerR);
  } else {
    addArc(lines, 0, 0, outerR, startAngleDeg, startAngleDeg + sectorAngleDeg);
  }

  // Draw inner arc (small radius = top opening of lampshade)
  if (topWave) {
    const arcs = generateWaveArcs(innerR);
    console.log(`Generated ${arcs.length} arcs for inner circle`);
    drawWaveArcs(arcs);
  }
  // Note: When topWave is false, we don't draw the inner arc at all
  // because it would create unwanted lines in the DXF

  // Draw left radial line (from inner to outer at start angle)
  const leftOuterX = outerR * Math.cos(startAngleRad);
  const leftOuterY = outerR * Math.sin(startAngleRad);
  const leftInnerX = innerR * Math.cos(startAngleRad);
  const leftInnerY = innerR * Math.sin(startAngleRad);
  addLine(lines, leftOuterX, leftOuterY, leftInnerX, leftInnerY);

  // Draw right radial line (from inner to outer at end angle)
  const rightOuterX = outerR * Math.cos(endAngleRad);
  const rightOuterY = outerR * Math.sin(endAngleRad);
  const rightInnerX = innerR * Math.cos(endAngleRad);
  const rightInnerY = innerR * Math.sin(endAngleRad);
  addLine(lines, rightOuterX, rightOuterY, rightInnerX, rightInnerY);

  // Add text annotation
  const waveInfo = [];
  if (topWave) waveInfo.push('top');
  if (bottomWave) waveInfo.push('bottom');
  addText(lines, 0, -(outerR + 50), 20, `Waveform Lampshade - ${waveCount} Waves (${waveInfo.join('+')})`);
  addText(lines, 0, -(outerR + 80), 15, `R=${outerR.toFixed(1)} r=${innerR.toFixed(1)} θ=${sectorAngleDeg.toFixed(1)}°`);

  lines.push("0");
  lines.push("ENDSEC");

  // EOF
  lines.push("0");
  lines.push("EOF");

  return lines.join("\n");
}

// ========== Helper functions ==========

function addTablesSection(lines: string[]) {
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("TABLES");

  // LAYER table
  lines.push("0");
  lines.push("TABLE");
  lines.push("2");
  lines.push("LAYER");
  lines.push("70");
  lines.push("2");

  // Layer 0
  lines.push("0");
  lines.push("LAYER");
  lines.push("2");
  lines.push("0");
  lines.push("70");
  lines.push("0");
  lines.push("62");
  lines.push("7");
  lines.push("6");
  lines.push("CONTINUOUS");

  // Outline layer
  lines.push("0");
  lines.push("LAYER");
  lines.push("2");
  lines.push("OUTLINE");
  lines.push("70");
  lines.push("0");
  lines.push("62");
  lines.push("1");
  lines.push("6");
  lines.push("CONTINUOUS");

  lines.push("0");
  lines.push("ENDTAB");
  lines.push("0");
  lines.push("ENDSEC");
}

function addBlocksSection(lines: string[]) {
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("BLOCKS");
  lines.push("0");
  lines.push("ENDSEC");
}

function addCircle(lines: string[], cx: number, cy: number, radius: number) {
  lines.push("0");
  lines.push("CIRCLE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(cx));
  lines.push("20");
  lines.push(String(cy));
  lines.push("40");
  lines.push(String(radius));
}

function addArc(lines: string[], cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(cx));
  lines.push("20");
  lines.push(String(cy));
  lines.push("40");
  lines.push(String(radius));
  lines.push("50");
  lines.push(String(startAngle));
  lines.push("51");
  lines.push(String(endAngle));
}

function addLine(lines: string[], x1: number, y1: number, x2: number, y2: number) {
  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(x1));
  lines.push("20");
  lines.push(String(y1));
  lines.push("11");
  lines.push(String(x2));
  lines.push("21");
  lines.push(String(y2));
}

function addText(lines: string[], x: number, y: number, height: number, text: string) {
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push(String(x));
  lines.push("20");
  lines.push(String(y));
  lines.push("40");
  lines.push(String(height));
  lines.push("1");
  lines.push(text);
}

/**
 * Export calculation result as DXF file
 */
export function exportAsDXF(result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult): void {
  const dxfContent = generateDXFContent(result);
  const blob = new Blob([dxfContent], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lampshade-unfolding.dxf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
