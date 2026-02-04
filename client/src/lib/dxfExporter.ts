import { CalculationResult } from "./lampshadeCalculator";

/**
 * DXF Exporter for Lampshade Unfolding Pattern
 * 
 * Generates a DXF file that can be imported into CAD software or laser cutters.
 * The DXF format is a text-based format used by AutoCAD and many other CAD programs.
 */

interface DXFEntity {
  type: string;
  layer: string;
  [key: string]: any;
}

interface DXFHeader {
  [key: string]: any;
}

/**
 * Generate DXF content as a string
 */
export function generateDXFContent(result: CalculationResult): string {
  if (!result.isValid) {
    throw new Error("Cannot export invalid calculation result");
  }

  const innerR = result.innerRadius;
  const outerR = result.outerRadius;
  const angle = result.sectorAngleRad;

  // DXF file structure
  const dxf: string[] = [];

  // SECTION: HEADER
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("HEADER");
  dxf.push("9");
  dxf.push("$ACADVER");
  dxf.push("1");
  dxf.push("AC1021"); // AutoCAD 2000
  dxf.push("9");
  dxf.push("$EXTMIN");
  dxf.push("10");
  dxf.push("-" + (outerR + 10).toString());
  dxf.push("20");
  dxf.push("-" + (outerR + 10).toString());
  dxf.push("9");
  dxf.push("$EXTMAX");
  dxf.push("10");
  dxf.push((outerR + 10).toString());
  dxf.push("20");
  dxf.push((outerR + 10).toString());
  dxf.push("0");
  dxf.push("ENDSEC");

  // SECTION: TABLES
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("TABLES");

  // Layer table
  dxf.push("0");
  dxf.push("TABLE");
  dxf.push("2");
  dxf.push("LAYER");
  dxf.push("70");
  dxf.push("2");

  // Layer 0 (default)
  dxf.push("0");
  dxf.push("LAYER");
  dxf.push("2");
  dxf.push("0");
  dxf.push("70");
  dxf.push("0");
  dxf.push("62");
  dxf.push("7");
  dxf.push("6");
  dxf.push("CONTINUOUS");

  // Outline layer
  dxf.push("0");
  dxf.push("LAYER");
  dxf.push("2");
  dxf.push("OUTLINE");
  dxf.push("70");
  dxf.push("0");
  dxf.push("62");
  dxf.push("1"); // Red
  dxf.push("6");
  dxf.push("CONTINUOUS");

  // Dimension layer
  dxf.push("0");
  dxf.push("LAYER");
  dxf.push("2");
  dxf.push("DIMENSIONS");
  dxf.push("70");
  dxf.push("0");
  dxf.push("62");
  dxf.push("3"); // Green
  dxf.push("6");
  dxf.push("CONTINUOUS");

  dxf.push("0");
  dxf.push("ENDTAB");
  dxf.push("0");
  dxf.push("ENDSEC");

  // SECTION: BLOCKS
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("BLOCKS");
  dxf.push("0");
  dxf.push("ENDSEC");

  // SECTION: ENTITIES
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("ENTITIES");

  // Determine if we need the large arc flag
  const largeArc = angle > Math.PI ? 1 : 0;

  // Draw outer arc
  dxf.push("0");
  dxf.push("ARC");
  dxf.push("8");
  dxf.push("OUTLINE");
  dxf.push("10");
  dxf.push("0"); // Center X
  dxf.push("20");
  dxf.push("0"); // Center Y
  dxf.push("40");
  dxf.push(outerR.toFixed(2)); // Radius
  dxf.push("50");
  dxf.push("270"); // Start angle (pointing up)
  dxf.push("51");
  dxf.push((270 + (angle * 180) / Math.PI).toFixed(2)); // End angle

  // Draw inner arc
  dxf.push("0");
  dxf.push("ARC");
  dxf.push("8");
  dxf.push("OUTLINE");
  dxf.push("10");
  dxf.push("0"); // Center X
  dxf.push("20");
  dxf.push("0"); // Center Y
  dxf.push("40");
  dxf.push(innerR.toFixed(2)); // Radius
  dxf.push("50");
  dxf.push((270 + (angle * 180) / Math.PI).toFixed(2)); // Start angle (reverse)
  dxf.push("51");
  dxf.push("270"); // End angle

  // Draw left radial line
  dxf.push("0");
  dxf.push("LINE");
  dxf.push("8");
  dxf.push("OUTLINE");
  dxf.push("10");
  dxf.push("0"); // Start X
  dxf.push("20");
  dxf.push("-" + outerR.toFixed(2)); // Start Y
  dxf.push("11");
  dxf.push("0"); // End X
  dxf.push("21");
  dxf.push("-" + innerR.toFixed(2)); // End Y

  // Draw right radial line
  const rightX = (outerR * Math.sin(angle)).toFixed(2);
  const rightY = (-outerR * Math.cos(angle)).toFixed(2);
  const rightInnerX = (innerR * Math.sin(angle)).toFixed(2);
  const rightInnerY = (-innerR * Math.cos(angle)).toFixed(2);

  dxf.push("0");
  dxf.push("LINE");
  dxf.push("8");
  dxf.push("OUTLINE");
  dxf.push("10");
  dxf.push(rightX); // Start X
  dxf.push("20");
  dxf.push(rightY); // Start Y
  dxf.push("11");
  dxf.push(rightInnerX); // End X
  dxf.push("21");
  dxf.push(rightInnerY); // End Y

  // Add dimension text
  addDimensionText(dxf, "Inner Radius", innerR.toFixed(2), -innerR - 20, 0);
  addDimensionText(dxf, "Outer Radius", outerR.toFixed(2), -outerR - 20, -30);
  addDimensionText(dxf, "Angle", result.sectorAngle.toFixed(1) + "°", 30, 30);

  dxf.push("0");
  dxf.push("ENDSEC");

  // SECTION: EOF
  dxf.push("0");
  dxf.push("EOF");

  return dxf.join("\n");
}

/**
 * Add dimension text to DXF
 */
function addDimensionText(
  dxf: string[],
  label: string,
  value: string,
  x: number,
  y: number
): void {
  dxf.push("0");
  dxf.push("TEXT");
  dxf.push("8");
  dxf.push("DIMENSIONS");
  dxf.push("10");
  dxf.push(x.toFixed(2)); // X coordinate
  dxf.push("20");
  dxf.push(y.toFixed(2)); // Y coordinate
  dxf.push("40");
  dxf.push("5"); // Text height
  dxf.push("1");
  dxf.push(label + ": " + value); // Text content
  dxf.push("7");
  dxf.push("STANDARD"); // Text style
}

/**
 * Export calculation result as DXF file
 */
export function exportAsDXF(result: CalculationResult): void {
  try {
    const dxfContent = generateDXFContent(result);
    const blob = new Blob([dxfContent], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lampshade-${Date.now()}.dxf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting DXF:", error);
    throw error;
  }
}

/**
 * Alternative: Generate DXF using polyline for smoother curves
 * This version creates a more accurate representation of the arcs
 */
export function generateDXFContentAdvanced(result: CalculationResult): string {
  if (!result.isValid) {
    throw new Error("Cannot export invalid calculation result");
  }

  const innerR = result.innerRadius;
  const outerR = result.outerRadius;
  const angle = result.sectorAngleRad;

  const dxf: string[] = [];

  // Header
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("HEADER");
  dxf.push("9");
  dxf.push("$ACADVER");
  dxf.push("1");
  dxf.push("AC1021");
  dxf.push("0");
  dxf.push("ENDSEC");

  // Tables
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("TABLES");
  dxf.push("0");
  dxf.push("TABLE");
  dxf.push("2");
  dxf.push("LAYER");
  dxf.push("70");
  dxf.push("1");
  dxf.push("0");
  dxf.push("LAYER");
  dxf.push("2");
  dxf.push("0");
  dxf.push("70");
  dxf.push("0");
  dxf.push("62");
  dxf.push("7");
  dxf.push("6");
  dxf.push("CONTINUOUS");
  dxf.push("0");
  dxf.push("ENDTAB");
  dxf.push("0");
  dxf.push("ENDSEC");

  // Blocks
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("BLOCKS");
  dxf.push("0");
  dxf.push("ENDSEC");

  // Entities - Using polylines to approximate arcs
  dxf.push("0");
  dxf.push("SECTION");
  dxf.push("2");
  dxf.push("ENTITIES");

  // Generate polyline points for outer arc
  const outerPoints = generateArcPoints(0, 0, outerR, 270, 270 + (angle * 180) / Math.PI, 36);
  dxf.push(...createPolyline("OUTER_ARC", outerPoints));

  // Generate polyline points for inner arc (reverse direction)
  const innerPoints = generateArcPoints(0, 0, innerR, 270 + (angle * 180) / Math.PI, 270, 36);
  dxf.push(...createPolyline("INNER_ARC", innerPoints));

  // Left radial line
  dxf.push("0");
  dxf.push("LINE");
  dxf.push("10");
  dxf.push("0");
  dxf.push("20");
  dxf.push("-" + outerR.toFixed(2));
  dxf.push("11");
  dxf.push("0");
  dxf.push("21");
  dxf.push("-" + innerR.toFixed(2));

  // Right radial line
  const rightX = (outerR * Math.sin(angle)).toFixed(2);
  const rightY = (-outerR * Math.cos(angle)).toFixed(2);
  const rightInnerX = (innerR * Math.sin(angle)).toFixed(2);
  const rightInnerY = (-innerR * Math.cos(angle)).toFixed(2);

  dxf.push("0");
  dxf.push("LINE");
  dxf.push("10");
  dxf.push(rightX);
  dxf.push("20");
  dxf.push(rightY);
  dxf.push("11");
  dxf.push(rightInnerX);
  dxf.push("21");
  dxf.push(rightInnerY);

  dxf.push("0");
  dxf.push("ENDSEC");

  // EOF
  dxf.push("0");
  dxf.push("EOF");

  return dxf.join("\n");
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
 * Create a polyline entity in DXF format
 */
function createPolyline(name: string, points: Array<[number, number]>): string[] {
  const dxf: string[] = [];

  dxf.push("0");
  dxf.push("LWPOLYLINE");
  dxf.push("8");
  dxf.push(name);
  dxf.push("90");
  dxf.push(points.length.toString());

  for (const [x, y] of points) {
    dxf.push("10");
    dxf.push(x.toFixed(2));
    dxf.push("20");
    dxf.push(y.toFixed(2));
  }

  return dxf;
}
