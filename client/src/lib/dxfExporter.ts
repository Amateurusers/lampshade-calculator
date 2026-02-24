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

  // Center the sector at angle 270 (pointing down) for better visual
  const startAngleDeg = 270 - sectorAngleDeg / 2;
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
    const allCircles: Array<{cx: number, cy: number, r: number, angle: number}> = [];
    
    for (const circle of geometry.circles) {
      allCircles.push({
        cx: circle.cx,
        cy: circle.cy,
        r: circle.r,
        angle: circle.angle
      });
    }
    
    // Calculate arc endpoints using tangent conditions
    const arcs: Array<{cx: number, cy: number, r: number, p1x: number, p1y: number, p2x: number, p2y: number}> = [];
    
    for (let i = 0; i < allCircles.length; i++) {
      const circle = allCircles[i];
      
      // Calculate start point
      let p1;
      if (i === 0) {
        // First arc: intersect with left boundary line
        // The left boundary line is at angle (-sectorAngleDeg / 2) in geometry coordinates
        const leftBoundaryAngle = -sectorAngleDeg / 2;  // e.g., -60° for 120° sector
        const boundaryAngleRad = (leftBoundaryAngle * Math.PI) / 180;
        const lineX = Math.sin(boundaryAngleRad);
        const lineY = Math.cos(boundaryAngleRad);
        
        // Calculate intersection of circle with boundary line
        // Circle center distance from origin
        const centerDist = Math.sqrt(circle.cx ** 2 + circle.cy ** 2);
        const centerAngle = Math.atan2(circle.cx, circle.cy);
        const angleDiff = boundaryAngleRad - centerAngle;
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
        // Last arc: intersect with right boundary line
        // The right boundary line is at angle (sectorAngleDeg / 2) in geometry coordinates
        const rightBoundaryAngle = sectorAngleDeg / 2;  // e.g., 60° for 120° sector
        const boundaryAngleRad = (rightBoundaryAngle * Math.PI) / 180;
        const lineX = Math.sin(boundaryAngleRad);
        const lineY = Math.cos(boundaryAngleRad);
        
        // Calculate intersection of circle with boundary line
        // Circle center distance from origin
        const centerDist = Math.sqrt(circle.cx ** 2 + circle.cy ** 2);
        const centerAngle = Math.atan2(circle.cx, circle.cy);
        const angleDiff = boundaryAngleRad - centerAngle;
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
        p2y: p2.y
      });
    }
    
    return arcs;
  };
  
  // Helper: draw wave arcs to DXF
  const drawWaveArcs = (arcs: Array<{cx: number, cy: number, r: number, p1x: number, p1y: number, p2x: number, p2y: number}>) => {
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      console.log(`Arc ${i+1}: center=(${arc.cx.toFixed(2)}, ${arc.cy.toFixed(2)}), r=${arc.r.toFixed(2)}, p1=(${arc.p1x.toFixed(2)}, ${arc.p1y.toFixed(2)}), p2=(${arc.p2x.toFixed(2)}, ${arc.p2y.toFixed(2)})`);
      
      // Calculate DXF ARC angles (relative to arc center)
      let a1 = Math.atan2(arc.p1y - arc.cy, arc.p1x - arc.cx) * 180 / Math.PI;
      let a2 = Math.atan2(arc.p2y - arc.cy, arc.p2x - arc.cx) * 180 / Math.PI;
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

  // Draw outer arc (top edge in DXF view, corresponds to larger radius)
  // In DXF coordinate system, larger radius appears at the top
  if (topWave) {
    const arcs = generateWaveArcs(outerR);
    drawWaveArcs(arcs);
  } else {
    addArc(lines, 0, 0, outerR, startAngleDeg, startAngleDeg + sectorAngleDeg);
  }

  // Draw inner arc (bottom edge in DXF view, corresponds to smaller radius)
  // In DXF coordinate system, smaller radius appears at the bottom
  if (bottomWave) {
    const arcs = generateWaveArcs(innerR);
    drawWaveArcs(arcs);
  } else {
    addArc(lines, 0, 0, innerR, startAngleDeg, startAngleDeg + sectorAngleDeg);
  }

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
