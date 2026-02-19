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
  console.log('[DXF] generateDXFContent called with:', result);
  // Check if it's a polygon or waveform result
  if ('sides' in result) {
    console.log('[DXF] Detected polygon lampshade');
    return generatePolygonDXF(result as PolygonLampshadeResult);
  } else if ('waveCount' in result) {
    console.log('[DXF] Detected waveform lampshade');
    return generateWaveformDXF(result as WaveformLampshadeResult);
  }
  console.log('[DXF] Detected conical lampshade');
  
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
  console.log('[DXF] Generating waveform DXF:', result);
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

  // Helper: generate wave arcs for a given base radius
  // Returns the first and last arc endpoints for radial line connection
  const generateWaveArcs = (baseR: number): { firstPoint: {x: number, y: number}, lastPoint: {x: number, y: number} } => {
    const amplitude = waveHeight / 2;
    const halfWaveAngleRad = sectorAngleRad / (2 * waveCount);
    
    let firstPoint = { x: 0, y: 0 };
    let lastPoint = { x: 0, y: 0 };
    
    // Draw 2*waveCount arcs (8 arcs for 4 waves) with phase offset for left-right symmetry
    // Phase offset π/4 ensures both edges are at the same position on the wave (rising edge of peak)
    const phaseOffset = Math.PI / 4;
    
    for (let i = 0; i < 2 * waveCount; i++) {
      // Endpoints on the base circle with phase offset
      const t1 = i / (2 * waveCount);
      const t2 = (i + 1) / (2 * waveCount);
      const phase1 = t1 * 2 * waveCount * Math.PI + phaseOffset;
      const phase2 = t2 * 2 * waveCount * Math.PI + phaseOffset;
      
      // Calculate radial offset for each endpoint
      const offset1 = amplitude * Math.sin(phase1);
      const offset2 = amplitude * Math.sin(phase2);
      
      const a1 = startAngleRad + i * halfWaveAngleRad;
      const a2 = startAngleRad + (i + 1) * halfWaveAngleRad;
      
      const r1 = baseR + offset1;
      const r2 = baseR + offset2;
      
      const p1x = r1 * Math.cos(a1);
      const p1y = r1 * Math.sin(a1);
      const p2x = r2 * Math.cos(a2);
      const p2y = r2 * Math.sin(a2);
      
      // Store first and last points for radial lines
      if (i === 0) {
        firstPoint = { x: p1x, y: p1y };
      }
      if (i === 2 * waveCount - 1) {
        lastPoint = { x: p2x, y: p2y };
      }
      
      // Chord length and midpoint
      const chord = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2);
      const mx = (p1x + p2x) / 2;
      const my = (p1y + p2y) / 2;
      const midR = Math.sqrt(mx ** 2 + my ** 2);
      
      // Unit vector from origin through chord midpoint (radial outward)
      const nx = midR > 0 ? mx / midR : 0;
      const ny = midR > 0 ? my / midR : 1;
      
      // Arc radius from chord and sagitta: R = chord²/(8h) + h/2
      const arcRadius = (chord ** 2) / (8 * amplitude) + amplitude / 2;
      
      // Distance from chord midpoint to arc center
      const d = arcRadius - amplitude;
      
      // Determine direction based on actual radial offset at chord midpoint
      const tMid = (t1 + t2) / 2;
      const phaseMid = tMid * 2 * waveCount * Math.PI + phaseOffset;
      const offsetMid = amplitude * Math.sin(phaseMid);
      // If offsetMid > 0, the arc bulges outward (peak); if < 0, inward (trough)
      const isOutward = offsetMid > 0;
      
      let cx: number, cy: number;
      if (isOutward) {
        // Peak: arc bulges outward, center is on the inward side
        cx = mx - d * nx;
        cy = my - d * ny;
      } else {
        // Trough: arc bulges inward, center is on the outward side
        cx = mx + d * nx;
        cy = my + d * ny;
      }
      
      // Calculate DXF ARC angles (relative to arc center)
      let arcA1 = Math.atan2(p1y - cy, p1x - cx) * 180 / Math.PI;
      let arcA2 = Math.atan2(p2y - cy, p2x - cx) * 180 / Math.PI;
      
      // Normalize to 0-360
      if (arcA1 < 0) arcA1 += 360;
      if (arcA2 < 0) arcA2 += 360;
      
      // DXF ARC draws counterclockwise from startAngle to endAngle
      // For outward (peak) arcs: center is inward, arc goes CCW from p1 to p2
      //   → startAngle = arcA1, endAngle = arcA2
      // For inward (trough) arcs: center is outward, arc goes CW from p1 to p2
      //   → we need to swap: startAngle = arcA2, endAngle = arcA1
      if (isOutward) {
        addArc(lines, cx, cy, arcRadius, arcA1, arcA2);
      } else {
        addArc(lines, cx, cy, arcRadius, arcA2, arcA1);
      }
    }
    
    return { firstPoint, lastPoint };
  };

   // Draw outer arc (bottom edge of lampshade)
  let outerFirstPoint = { x: outerR * Math.cos(startAngleRad), y: outerR * Math.sin(startAngleRad) };
  let outerLastPoint = { x: outerR * Math.cos(startAngleRad + sectorAngleRad), y: outerR * Math.sin(startAngleRad + sectorAngleRad) };
  if (bottomWave) {
    const result = generateWaveArcs(outerR);
    outerFirstPoint = result.firstPoint;
    outerLastPoint = result.lastPoint;
  } else {
    addArc(lines, 0, 0, outerR, startAngleDeg, startAngleDeg + sectorAngleDeg);
  }

  // Draw inner arc (top edge of lampshade)
  let innerFirstPoint = { x: innerR * Math.cos(startAngleRad), y: innerR * Math.sin(startAngleRad) };
  let innerLastPoint = { x: innerR * Math.cos(startAngleRad + sectorAngleRad), y: innerR * Math.sin(startAngleRad + sectorAngleRad) };
  if (topWave) {
    const result = generateWaveArcs(innerR);
    innerFirstPoint = result.firstPoint;
    innerLastPoint = result.lastPoint;
  } else {
    addArc(lines, 0, 0, innerR, startAngleDeg, startAngleDeg + sectorAngleDeg);
  }

  // Draw left radial line (connecting first points of inner and outer arcs)
  addLine(lines, outerFirstPoint.x, outerFirstPoint.y, innerFirstPoint.x, innerFirstPoint.y);
  
  // Draw right radial line (connecting last points of inner and outer arcs)
  addLine(lines, outerLastPoint.x, outerLastPoint.y, innerLastPoint.x, innerLastPoint.y);

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
  console.log('[DXF] exportAsDXF called with result:', result);
  const dxfContent = generateDXFContent(result);
  console.log('[DXF] Generated DXF content length:', dxfContent.length);
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
