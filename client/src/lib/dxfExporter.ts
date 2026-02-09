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

  const centerX = 0;
  const centerY = 0;

  // Draw outer arc
  const outerStartAngle = 270 - result.sectorAngle / 2;
  const outerEndAngle = 270 + result.sectorAngle / 2;

  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(centerX));
  lines.push("20");
  lines.push(String(centerY));
  lines.push("40");
  lines.push(String(result.outerRadius));
  lines.push("50");
  lines.push(String(outerStartAngle));
  lines.push("51");
  lines.push(String(outerEndAngle));

  // Draw inner arc
  lines.push("0");
  lines.push("ARC");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(centerX));
  lines.push("20");
  lines.push(String(centerY));
  lines.push("40");
  lines.push(String(result.innerRadius));
  lines.push("50");
  lines.push(String(outerStartAngle));
  lines.push("51");
  lines.push(String(outerEndAngle));

  // Draw left radius line
  const leftOuterX = centerX + result.outerRadius * Math.cos((outerStartAngle * Math.PI) / 180);
  const leftOuterY = centerY + result.outerRadius * Math.sin((outerStartAngle * Math.PI) / 180);
  const leftInnerX = centerX + result.innerRadius * Math.cos((outerStartAngle * Math.PI) / 180);
  const leftInnerY = centerY + result.innerRadius * Math.sin((outerStartAngle * Math.PI) / 180);

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

  // Draw right radius line
  const rightOuterX = centerX + result.outerRadius * Math.cos((outerEndAngle * Math.PI) / 180);
  const rightOuterY = centerY + result.outerRadius * Math.sin((outerEndAngle * Math.PI) / 180);
  const rightInnerX = centerX + result.innerRadius * Math.cos((outerEndAngle * Math.PI) / 180);
  const rightInnerY = centerY + result.innerRadius * Math.sin((outerEndAngle * Math.PI) / 180);

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

  // Add dimension text
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push(String(-(result.outerRadius + result.innerRadius) / 4));
  lines.push("40");
  lines.push("15");
  lines.push("1");
  lines.push(`R=${result.outerRadius.toFixed(1)}`);

  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push(String(-(result.outerRadius + result.innerRadius) / 2));
  lines.push("40");
  lines.push("15");
  lines.push("1");
  lines.push(`r=${result.innerRadius.toFixed(1)}`);

  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push(String(result.outerRadius * 0.7));
  lines.push("20");
  lines.push("0");
  lines.push("40");
  lines.push("15");
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

  // Draw multiple trapezoids for each side of the polygon
  const sides = result.sides;
  const topRadius = result.topDiameter / 2;
  const bottomRadius = result.bottomDiameter / 2;
  const slantHeight = result.slantHeight;
  
  // Calculate the angle for each trapezoid
  const trapezoidAngle = 360 / sides;
  const trapezoidWidth = 2 * Math.PI * topRadius / sides;
  const bottomTrapezoidWidth = 2 * Math.PI * bottomRadius / sides;

  // Draw trapezoids arranged horizontally
  let xOffset = -trapezoidWidth * sides / 2;
  
  for (let i = 0; i < sides; i++) {
    const x1 = xOffset;
    const x2 = xOffset + trapezoidWidth;
    const x3 = xOffset + bottomTrapezoidWidth + (trapezoidWidth - bottomTrapezoidWidth) / 2;
    const x4 = xOffset + (trapezoidWidth - bottomTrapezoidWidth) / 2;
    
    const y1 = 0;
    const y2 = slantHeight;

    // Top edge
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
    lines.push(String(y1));

    // Right edge
    lines.push("0");
    lines.push("LINE");
    lines.push("8");
    lines.push("OUTLINE");
    lines.push("10");
    lines.push(String(x2));
    lines.push("20");
    lines.push(String(y1));
    lines.push("11");
    lines.push(String(x3));
    lines.push("21");
    lines.push(String(y2));

    // Bottom edge
    lines.push("0");
    lines.push("LINE");
    lines.push("8");
    lines.push("OUTLINE");
    lines.push("10");
    lines.push(String(x3));
    lines.push("20");
    lines.push(String(y2));
    lines.push("11");
    lines.push(String(x4));
    lines.push("21");
    lines.push(String(y2));

    // Left edge
    lines.push("0");
    lines.push("LINE");
    lines.push("8");
    lines.push("OUTLINE");
    lines.push("10");
    lines.push(String(x4));
    lines.push("20");
    lines.push(String(y2));
    lines.push("11");
    lines.push(String(x1));
    lines.push("21");
    lines.push(String(y1));

    xOffset += trapezoidWidth;
  }

  // Add text annotation
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push(String(-50));
  lines.push("40");
  lines.push("20");
  lines.push("1");
  lines.push(`${sides}边形灯罩展开图`);

  lines.push("0");
  lines.push("ENDSEC");

  // EOF
  lines.push("0");
  lines.push("EOF");

  return lines.join("\n");
}

/**
 * Generate DXF content for waveform lampshade
 */
function generateWaveformDXF(result: WaveformLampshadeResult): string {
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

  // Draw waveform pattern
  const topRadius = result.topDiameter / 2;
  const bottomRadius = result.bottomDiameter / 2;
  const slantHeight = result.slantHeight;
  const waveCount = result.waveCount;
  const waveHeight = result.waveHeight;
  
  const circumference = 2 * Math.PI * topRadius;
  const wavelength = circumference / waveCount;
  
  // Draw top wavy line
  let prevX = -circumference / 2;
  let prevY = 0;
  
  for (let i = 0; i <= waveCount * 10; i++) {
    const t = i / (waveCount * 10);
    const x = -circumference / 2 + t * circumference;
    const y = waveHeight * Math.sin(t * waveCount * 2 * Math.PI);
    
    if (i > 0) {
      lines.push("0");
      lines.push("LINE");
      lines.push("8");
      lines.push("OUTLINE");
      lines.push("10");
      lines.push(String(prevX));
      lines.push("20");
      lines.push(String(prevY));
      lines.push("11");
      lines.push(String(x));
      lines.push("21");
      lines.push(String(y));
    }
    
    prevX = x;
    prevY = y;
  }

  // Draw bottom wavy line
  prevX = -circumference / 2;
  prevY = slantHeight;
  
  for (let i = 0; i <= waveCount * 10; i++) {
    const t = i / (waveCount * 10);
    const x = -circumference / 2 + t * circumference;
    const bottomWaveHeight = waveHeight * (bottomRadius / topRadius);
    const y = slantHeight + bottomWaveHeight * Math.sin(t * waveCount * 2 * Math.PI);
    
    if (i > 0) {
      lines.push("0");
      lines.push("LINE");
      lines.push("8");
      lines.push("OUTLINE");
      lines.push("10");
      lines.push(String(prevX));
      lines.push("20");
      lines.push(String(prevY));
      lines.push("11");
      lines.push(String(x));
      lines.push("21");
      lines.push(String(y));
    }
    
    prevX = x;
    prevY = y;
  }

  // Draw side edges
  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(-circumference / 2));
  lines.push("20");
  lines.push("0");
  lines.push("11");
  lines.push(String(-circumference / 2));
  lines.push("21");
  lines.push(String(slantHeight));

  lines.push("0");
  lines.push("LINE");
  lines.push("8");
  lines.push("OUTLINE");
  lines.push("10");
  lines.push(String(circumference / 2));
  lines.push("20");
  lines.push("0");
  lines.push("11");
  lines.push(String(circumference / 2));
  lines.push("21");
  lines.push(String(slantHeight));

  // Add text annotation
  lines.push("0");
  lines.push("TEXT");
  lines.push("8");
  lines.push("0");
  lines.push("10");
  lines.push("0");
  lines.push("20");
  lines.push(String(-50));
  lines.push("40");
  lines.push("20");
  lines.push("1");
  lines.push(`波浪形灯罩展开图 (${waveCount}波)`);

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
