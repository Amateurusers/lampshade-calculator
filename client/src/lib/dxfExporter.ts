import { CalculationResult } from "./lampshadeCalculator";

/**
 * DXF Exporter for Lampshade Unfolding Pattern
 * 
 * Generates a standard DXF file that can be imported into AutoCAD and other CAD software.
 * Uses proper DXF R12 format (AC1009) for maximum compatibility.
 */

/**
 * Generate DXF content using proper DXF R12 format
 */
export function generateDXFContent(result: CalculationResult): string {
  if (!result.isValid) {
    throw new Error("Cannot export invalid calculation result");
  }

  const innerR = result.innerRadius;
  const outerR = result.outerRadius;
  const angle = result.sectorAngleRad;

  // DXF file content
  const lines: string[] = [];

  // SECTION: HEADER
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("HEADER");
  
  // Version
  lines.push("9");
  lines.push("$ACADVER");
  lines.push("1");
  lines.push("AC1009"); // DXF R12 format
  
  // Limits
  lines.push("9");
  lines.push("$EXTMIN");
  lines.push("10");
  lines.push(String(-outerR - 50));
  lines.push("20");
  lines.push(String(-outerR - 50));
  lines.push("9");
  lines.push("$EXTMAX");
  lines.push("10");
  lines.push(String(outerR + 50));
  lines.push("20");
  lines.push(String(outerR + 50));
  
  lines.push("0");
  lines.push("ENDSEC");

  // SECTION: TABLES
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
  lines.push("1"); // Red
  lines.push("6");
  lines.push("CONTINUOUS");

  lines.push("0");
  lines.push("ENDTAB");
  lines.push("0");
  lines.push("ENDSEC");

  // SECTION: BLOCKS
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("BLOCKS");
  lines.push("0");
  lines.push("ENDSEC");

  // SECTION: ENTITIES
  lines.push("0");
  lines.push("SECTION");
  lines.push("2");
  lines.push("ENTITIES");

  // Generate arc points for polylines
  const outerArcPoints = generateArcPoints(0, 0, outerR, 270, 270 + (angle * 180) / Math.PI, 50);
  const innerArcPoints = generateArcPoints(0, 0, innerR, 270 + (angle * 180) / Math.PI, 270, 50);

  // Draw outer arc as polyline
  lines.push(...createLWPolyline("OUTER_ARC", outerArcPoints, 1));

  // Draw inner arc as polyline
  lines.push(...createLWPolyline("INNER_ARC", innerArcPoints, 1));

  // Left radial line
  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push(String(-outerR));
  lines.push("11");
  lines.push("0");
  lines.push("21");
  lines.push(String(-innerR));

  // Right radial line
  const rightX = outerR * Math.sin(angle);
  const rightY = -outerR * Math.cos(angle);
  const rightInnerX = innerR * Math.sin(angle);
  const rightInnerY = -innerR * Math.cos(angle);

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(rightX));
  lines.push("20");
  lines.push(String(rightY));
  lines.push("11");
  lines.push(String(rightInnerX));
  lines.push("21");
  lines.push(String(rightInnerY));

  // Add dimension lines and text
  // Inner radius dimension
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push(String(-outerR - 30));
  lines.push("20");
  lines.push(String(-innerR - 20));
  lines.push("40");
  lines.push("10");
  lines.push("1");
  lines.push(`R=${innerR.toFixed(1)}`);

  // Outer radius dimension
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push(String(-outerR - 30));
  lines.push("20");
  lines.push(String(-outerR - 20));
  lines.push("40");
  lines.push("10");
  lines.push("1");
  lines.push(`r=${outerR.toFixed(1)}`);

  // Angle dimension
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("20");
  lines.push("20");
  lines.push("30");
  lines.push("40");
  lines.push("10");
  lines.push("1");
  lines.push(`θ=${result.sectorAngle.toFixed(1)}°`);

  lines.push("0");
  lines.push("ENDSEC");

  // EOF
  lines.push("0");
  lines.push("EOF");

  return lines.join("\n");
}

/**
 * Generate points along an arc
 */
function generateArcPoints(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const angleStep = (endAngle - startAngle) / segments;

  for (let i = 0; i <= segments; i++) {
    const angle = (startAngle + i * angleStep) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push([x, y]);
  }

  return points;
}

/**
 * Create a lightweight polyline (LWPOLYLINE) entity in DXF format
 */
function createLWPolyline(
  layer: string,
  points: Array<[number, number]>,
  width: number = 0
): string[] {
  const dxf: string[] = [];

  dxf.push("0");
  dxf.push("LWPOLYLINE");
  dxf.push("8");
  dxf.push(layer);
  dxf.push("70");
  dxf.push("0"); // Not closed
  dxf.push("90");
  dxf.push(String(points.length));

  if (width > 0) {
    dxf.push("43");
    dxf.push(String(width));
  }

  for (const [x, y] of points) {
    dxf.push("10");
    dxf.push(String(x));
    dxf.push("20");
    dxf.push(String(y));
  }

  return dxf;
}

/**
 * Export calculation result as DXF file
 */
export function exportAsDXF(result: CalculationResult): void {
  try {
    const dxfContent = generateDXFContent(result);
    const blob = new Blob([dxfContent], { type: "application/dxf; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lampshade-unfolding-${Date.now()}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting DXF:", error);
    throw error;
  }
}
