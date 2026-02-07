import { CalculationResult } from "./lampshadeCalculator";

/**
 * DXF Exporter for Lampshade Unfolding Pattern
 * 
 * Generates a standard DXF file using ARC entities for proper arc rendering in AutoCAD.
 */

export function generateDXFContent(result: CalculationResult): string {
  if (!result.isValid) {
    throw new Error("Cannot export invalid calculation result");
  }

  const innerR = result.innerRadius;
  const outerR = result.outerRadius;
  const angle = result.sectorAngleRad;
  const angleDegrees = result.sectorAngle;

  // DXF file content
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
  
  lines.push("9");
  lines.push("$EXTMIN");
  lines.push("10");
  lines.push(String(-outerR - 100));
  lines.push("20");
  lines.push(String(-outerR - 100));
  
  lines.push("9");
  lines.push("$EXTMAX");
  lines.push("10");
  lines.push(String(outerR + 100));
  lines.push("20");
  lines.push(String(outerR + 100));
  
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
  lines.push("1");
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

  // Draw outer arc using ARC entity
  // Start angle: 270 - angleDegrees (left side)
  // End angle: 270 (right side, pointing down)
  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push("0");
  lines.push("40");
  lines.push(String(outerR));
  lines.push("50");
  lines.push(String(270 - angleDegrees));
  lines.push("51");
  lines.push("270");

  // Draw inner arc using ARC entity
  // Reverse direction: start at 270, end at 270 - angleDegrees
  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push("0");
  lines.push("40");
  lines.push(String(innerR));
  lines.push("50");
  lines.push("270");
  lines.push("51");
  lines.push(String(270 - angleDegrees));

  // Draw left radial line
  const leftOuterX = outerR * Math.sin(-angle);
  const leftOuterY = -outerR * Math.cos(-angle);
  const leftInnerX = innerR * Math.sin(-angle);
  const leftInnerY = -innerR * Math.cos(-angle);

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(leftOuterX));
  lines.push("20");
  lines.push(String(leftOuterY));
  lines.push("11");
  lines.push(String(leftInnerX));
  lines.push("21");
  lines.push(String(leftInnerY));

  // Draw right radial line
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

  // Add dimension text annotations
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push(String(-outerR - 50));
  lines.push("20");
  lines.push(String(-innerR));
  lines.push("40");
  lines.push("8");
  lines.push("1");
  lines.push(`R=${innerR.toFixed(1)}`);

  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push(String(-outerR - 50));
  lines.push("20");
  lines.push(String(-outerR));
  lines.push("40");
  lines.push("8");
  lines.push("1");
  lines.push(`r=${outerR.toFixed(1)}`);

  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("20");
  lines.push("20");
  lines.push("40");
  lines.push("40");
  lines.push("8");
  lines.push("1");
  lines.push(`Angle=${angleDegrees.toFixed(1)}deg`);

  lines.push("0");
  lines.push("ENDSEC");

  // EOF
  lines.push("0");
  lines.push("EOF");

  return lines.join("\n");
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
