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
  // Arc center at origin (0, 0)
  // Start angle: 270 degrees (pointing up)
  // End angle: 270 + angleDegrees
  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push("0"); // Center X
  lines.push("20");
  lines.push("0"); // Center Y
  lines.push("40");
  lines.push(String(outerR)); // Radius
  lines.push("50");
  lines.push("270"); // Start angle
  lines.push("51");
  lines.push(String(270 + angleDegrees)); // End angle

  // Draw inner arc using ARC entity
  // Same center and angles as outer arc
  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push("0"); // Center X
  lines.push("20");
  lines.push("0"); // Center Y
  lines.push("40");
  lines.push(String(innerR)); // Radius
  lines.push("50");
  lines.push(String(270 + angleDegrees)); // Start angle (reversed)
  lines.push("51");
  lines.push("270"); // End angle

  // Draw left radial line (from outer to inner at angle 270)
  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push("0"); // Start X
  lines.push("20");
  lines.push(String(-outerR)); // Start Y
  lines.push("11");
  lines.push("0"); // End X
  lines.push("21");
  lines.push(String(-innerR)); // End Y

  // Draw right radial line (from outer to inner at angle 270 + angleDegrees)
  const angleRad = angle;
  const rightOuterX = outerR * Math.sin(angleRad);
  const rightOuterY = -outerR * Math.cos(angleRad);
  const rightInnerX = innerR * Math.sin(angleRad);
  const rightInnerY = -innerR * Math.cos(angleRad);

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(rightOuterX)); // Start X
  lines.push("20");
  lines.push(String(rightOuterY)); // Start Y
  lines.push("11");
  lines.push(String(rightInnerX)); // End X
  lines.push("21");
  lines.push(String(rightInnerY)); // End Y

  // Add dimension text annotations
  // Inner radius label
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

  // Outer radius label
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

  // Angle label
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
