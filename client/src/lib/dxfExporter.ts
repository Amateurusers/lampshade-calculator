import { CalculationResult } from "./lampshadeCalculator";
import { PolygonLampshadeResult } from "./polygonLampshadeCalculator";
import { WaveformLampshadeResult } from "./waveformLampshadeCalculator";

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

  // Helper: generate tangent arc waves using three-circle tangency model
  // Trough circle, peak circle, and base circle are mutually tangent
  const generateWaveArcs = (baseR: number) => {
    const troughR = result.troughRadius;
    const peakR = result.peakRadius;
    
    // Divide sector into N segments (one per wave)
    const segmentAngle = sectorAngleRad / waveCount;
    
    for (let i = 0; i < waveCount; i++) {
      // Center angle of this wave segment
      const centerAngle = startAngleRad + (i + 0.5) * segmentAngle;
      
      // Trough circle center: inside the base circle, tangent to it
      const troughCenterR = baseR - troughR;
      const troughCx = troughCenterR * Math.cos(centerAngle);
      const troughCy = troughCenterR * Math.sin(centerAngle);
      
      // Peak circle center: outside the base circle, tangent to it
      const peakCenterR = baseR + peakR;
      const peakCx = peakCenterR * Math.cos(centerAngle);
      const peakCy = peakCenterR * Math.sin(centerAngle);
      
      // Calculate the tangent point between trough and peak circles
      // The tangent point lies on the line connecting the two centers
      // Distance from trough center to tangent point = troughR
      const totalDist = peakCenterR - troughCenterR; // = peakR + troughR
      const tangentX = troughCx + (troughR / totalDist) * (peakCx - troughCx);
      const tangentY = troughCy + (troughR / totalDist) * (peakCy - troughCy);
      
      // Calculate angle of tangent point relative to each circle center
      const tangentAngleTrough = Math.atan2(tangentY - troughCy, tangentX - troughCx) * 180 / Math.PI;
      const tangentAnglePeak = Math.atan2(tangentY - peakCy, tangentX - peakCx) * 180 / Math.PI;
      
      // Calculate the angular span for each arc
      // The trough arc should span from the previous wave's peak-trough tangent point
      // to the current wave's trough-peak tangent point
      
      // For simplicity, we use a symmetric model:
      // Each wave spans segmentAngle, divided equally between trough and peak
      const halfSegment = segmentAngle / 2;
      
      // Trough arc: from (centerAngle - halfSegment) to centerAngle
      const troughStartAngle = centerAngle - halfSegment;
      const troughEndAngle = centerAngle;
      
      // Calculate trough arc endpoints on the base circle
      const troughP1x = baseR * Math.cos(troughStartAngle);
      const troughP1y = baseR * Math.sin(troughStartAngle);
      const troughP2x = baseR * Math.cos(troughEndAngle);
      const troughP2y = baseR * Math.sin(troughEndAngle);
      
      // Calculate DXF ARC angles for trough (relative to trough center)
      let troughA1 = Math.atan2(troughP1y - troughCy, troughP1x - troughCx) * 180 / Math.PI;
      let troughA2 = Math.atan2(troughP2y - troughCy, troughP2x - troughCx) * 180 / Math.PI;
      if (troughA1 < 0) troughA1 += 360;
      if (troughA2 < 0) troughA2 += 360;
      
      // Ensure CCW direction
      if (troughA2 < troughA1) troughA2 += 360;
      
      addArc(lines, troughCx, troughCy, troughR, troughA1, troughA2);
      
      // Peak arc: from centerAngle to (centerAngle + halfSegment)
      const peakStartAngle = centerAngle;
      const peakEndAngle = centerAngle + halfSegment;
      
      // Calculate peak arc endpoints on the base circle
      const peakP1x = baseR * Math.cos(peakStartAngle);
      const peakP1y = baseR * Math.sin(peakStartAngle);
      const peakP2x = baseR * Math.cos(peakEndAngle);
      const peakP2y = baseR * Math.sin(peakEndAngle);
      
      // Calculate DXF ARC angles for peak (relative to peak center)
      let peakA1 = Math.atan2(peakP1y - peakCy, peakP1x - peakCx) * 180 / Math.PI;
      let peakA2 = Math.atan2(peakP2y - peakCy, peakP2x - peakCx) * 180 / Math.PI;
      if (peakA1 < 0) peakA1 += 360;
      if (peakA2 < 0) peakA2 += 360;
      
      // Ensure CCW direction
      if (peakA2 < peakA1) peakA2 += 360;
      
      addArc(lines, peakCx, peakCy, peakR, peakA1, peakA2);
    }
  };

  // Draw outer arc (bottom edge of lampshade)
  if (bottomWave) {
    generateWaveArcs(outerR);
  } else {
    addArc(lines, 0, 0, outerR, startAngleDeg, startAngleDeg + sectorAngleDeg);
  }

  // Draw inner arc (top edge of lampshade)
  if (topWave) {
    generateWaveArcs(innerR);
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
  const endAngleRad = startAngleRad + sectorAngleRad;
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
