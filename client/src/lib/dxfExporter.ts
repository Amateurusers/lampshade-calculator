import { CalculationResult } from "./lampshadeCalculator";
import { PolygonLampshadeResult } from "./polygonLampshadeCalculator";
import { WaveformLampshadeResult } from "./waveformLampshadeCalculator";

/**
 * DXF Exporter for Lampshade Unfolding Pattern
 * 
 * Generates a standard DXF file using ARC entities for proper arc rendering in AutoCAD.
 */

export function generateDXFContent(result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult): string {
  // Check if it's a polygon or waveform result
  if ('sides' in result || 'waveCount' in result) {
    return generatePolygonOrWaveformDXF(result as PolygonLampshadeResult | WaveformLampshadeResult);
  }
  
  // Otherwise it's a cone result
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
  // Same angle range as outer arc but with smaller radius
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
  lines.push(String(270 - angleDegrees));
  lines.push("51");
  lines.push("270");

  // Calculate the two radial line endpoints
  // Left radial line: at angle (270 - angleDegrees) degrees
  const leftAngleDeg = 270 - angleDegrees;
  const leftAngleRad = (leftAngleDeg * Math.PI) / 180;
  const leftOuterX = outerR * Math.cos(leftAngleRad);
  const leftOuterY = outerR * Math.sin(leftAngleRad);
  const leftInnerX = innerR * Math.cos(leftAngleRad);
  const leftInnerY = innerR * Math.sin(leftAngleRad);

  // Right radial line: at angle 270 degrees (pointing down)
  const rightOuterX = 0;
  const rightOuterY = -outerR;
  const rightInnerX = 0;
  const rightInnerY = -innerR;

  // Draw left radial line
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
  lines.push(String(rightOuterX));
  lines.push("20");
  lines.push(String(rightOuterY));
  lines.push("11");
  lines.push(String(rightInnerX));
  lines.push("21");
  lines.push(String(rightInnerY));

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
 * Generate DXF content for polygon or waveform lampshade
 */
function generatePolygonOrWaveformDXF(result: PolygonLampshadeResult | WaveformLampshadeResult): string {
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
  
  const maxExtent = 500;
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

  // For polygon and waveform, draw simplified representation
  // Draw a rectangle representing the unfolding pattern
  const width = 300;
  const height = 200;
  
  // Draw rectangle outline
  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(-width / 2));
  lines.push("20");
  lines.push(String(-height / 2));
  lines.push("11");
  lines.push(String(width / 2));
  lines.push("21");
  lines.push(String(-height / 2));

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(width / 2));
  lines.push("20");
  lines.push(String(-height / 2));
  lines.push("11");
  lines.push(String(width / 2));
  lines.push("21");
  lines.push(String(height / 2));

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(width / 2));
  lines.push("20");
  lines.push(String(height / 2));
  lines.push("11");
  lines.push(String(-width / 2));
  lines.push("21");
  lines.push(String(height / 2));

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(-width / 2));
  lines.push("20");
  lines.push(String(height / 2));
  lines.push("11");
  lines.push(String(-width / 2));
  lines.push("21");
  lines.push(String(-height / 2));

  // Add text annotation
  const typeLabel = 'sides' in result ? `${result.sides}边形灯罩` : "波浪形灯罩";
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push("0");
  lines.push("40");
  lines.push("20");
  lines.push("1");
  lines.push(typeLabel);

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
export function exportAsDXF(result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult): void {
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
