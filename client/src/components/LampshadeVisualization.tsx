import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CalculationResult, generateUnfoldedPatternPath } from "@/lib/lampshadeCalculator";
import { PolygonLampshadeResult } from "@/lib/polygonLampshadeCalculator";
import { WaveformLampshadeResult } from "@/lib/waveformLampshadeCalculator";

interface LampshadeVisualizationProps {
  result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult;
  activeTab: "3d" | "unfolded";
}

/**
 * Helper to determine result type.
 * Must check waveCount first because WaveformLampshadeResult now also has outerRadius.
 */
function getResultType(result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult): 'waveform' | 'polygon' | 'conical' {
  if ('waveCount' in result) return 'waveform';
  if ('sides' in result) return 'polygon';
  return 'conical';
}

/**
 * LampshadeVisualization Component
 */
export function LampshadeVisualization({
  result,
  activeTab,
}: LampshadeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!result.isValid || !svgRef.current) return;

    // Clear previous content
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    if (activeTab === "3d") {
      render3DView(svgRef.current, result);
    } else {
      renderUnfoldedView(svgRef.current, result);
    }
  }, [result, activeTab]);

  return (
    <Card className="p-6 bg-card shadow-sm border-border">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          {activeTab === "3d" ? "灯罩立体图" : "展开图"}
        </h3>
        <div className="flex justify-center bg-white rounded-lg border border-border p-4 min-h-96">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 400 400"
            className="max-w-full max-h-96"
            style={{ background: "#fafafa" }}
          />
        </div>
      </div>
    </Card>
  );
}

function render3DView(svg: SVGSVGElement, result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult) {
  const type = getResultType(result);
  if (type === 'conical') render3DViewConical(svg, result as CalculationResult);
  else if (type === 'polygon') render3DViewPolygonal(svg, result as PolygonLampshadeResult);
  else render3DViewWaveform(svg, result as WaveformLampshadeResult);
}

function renderUnfoldedView(svg: SVGSVGElement, result: CalculationResult | PolygonLampshadeResult | WaveformLampshadeResult) {
  const type = getResultType(result);
  if (type === 'conical') renderUnfoldedViewConical(svg, result as CalculationResult);
  else if (type === 'polygon') renderUnfoldedViewPolygonal(svg, result as PolygonLampshadeResult);
  else renderUnfoldedViewWaveform(svg, result as WaveformLampshadeResult);
}

// ==================== 3D Views ====================

function render3DViewConical(svg: SVGSVGElement, result: CalculationResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const radiusDiff = result.bottomRadius - result.topRadius;
  const verticalHeight = Math.sqrt(
    Math.pow(result.slantHeight, 2) - Math.pow(radiusDiff, 2)
  );

  const maxDim = Math.max(result.bottomDiameter, verticalHeight);
  const scale = Math.min(width, height) / (maxDim + 100);

  const topR = result.topRadius * scale;
  const bottomR = result.bottomRadius * scale;
  const h = verticalHeight * scale;

  drawGrid(svg, width, height);

  const topLeftX = centerX - topR;
  const topRightX = centerX + topR;
  const bottomLeftX = centerX - bottomR;
  const bottomRightX = centerX + bottomR;
  const topY = centerY - h / 2;
  const bottomY = centerY + h / 2;

  const outlineGroup = createSvgElement("g");

  appendLine(outlineGroup, topLeftX, topY, bottomLeftX, bottomY, "#0d47a1", 2);
  appendLine(outlineGroup, topRightX, topY, bottomRightX, bottomY, "#0d47a1", 2);
  appendLine(outlineGroup, topLeftX, topY, topRightX, topY, "#0d47a1", 2);
  appendLine(outlineGroup, bottomLeftX, bottomY, bottomRightX, bottomY, "#0d47a1", 2);

  svg.appendChild(outlineGroup);

  const midX = (topLeftX + bottomLeftX) / 2;
  const midY = (topY + bottomY) / 2;

  appendLine(svg, topLeftX - 40, topY, bottomLeftX - 40, bottomY, "#ff6b35", 1, "4,4");

  appendText(svg, midX - 50, midY, `H: ${result.slantHeight.toFixed(0)}mm`, 12, "#ff6b35");

  addDimensionLine(svg, topLeftX, topY - 30, topRightX, topY - 30, `Ø${result.topDiameter.toFixed(0)}mm`, "top");
  addDimensionLine(svg, bottomLeftX, bottomY + 30, bottomRightX, bottomY + 30, `Ø${result.bottomDiameter.toFixed(0)}mm`, "bottom");
}

function render3DViewPolygonal(svg: SVGSVGElement, result: PolygonLampshadeResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const radiusDiff = result.bottomRadius - result.topRadius;
  const verticalHeight = Math.sqrt(
    Math.pow(result.slantHeight, 2) - Math.pow(radiusDiff, 2)
  );

  const maxDim = Math.max(result.bottomDiameter, verticalHeight);
  const scale = Math.min(width, height) / (maxDim + 100);

  const topR = result.topRadius * scale;
  const bottomR = result.bottomRadius * scale;
  const h = verticalHeight * scale;

  drawGrid(svg, width, height);

  const topLeftX = centerX - topR;
  const topRightX = centerX + topR;
  const bottomLeftX = centerX - bottomR;
  const bottomRightX = centerX + bottomR;
  const topY = centerY - h / 2;
  const bottomY = centerY + h / 2;

  const outlineGroup = createSvgElement("g");

  appendLine(outlineGroup, topLeftX, topY, bottomLeftX, bottomY, "#0d47a1", 2);
  appendLine(outlineGroup, topRightX, topY, bottomRightX, bottomY, "#0d47a1", 2);
  appendLine(outlineGroup, topLeftX, topY, topRightX, topY, "#0d47a1", 2);
  appendLine(outlineGroup, bottomLeftX, bottomY, bottomRightX, bottomY, "#0d47a1", 2);

  svg.appendChild(outlineGroup);

  const midX = (topLeftX + bottomLeftX) / 2;
  const midY = (topY + bottomY) / 2;

  appendLine(svg, topLeftX - 40, topY, bottomLeftX - 40, bottomY, "#ff6b35", 1, "4,4");
  appendText(svg, midX - 50, midY, `H: ${result.slantHeight.toFixed(0)}mm`, 12, "#ff6b35");

  addDimensionLine(svg, topLeftX, topY - 30, topRightX, topY - 30, `Ø${result.topDiameter.toFixed(0)}mm (${result.sides}边)`, "top");
  addDimensionLine(svg, bottomLeftX, bottomY + 30, bottomRightX, bottomY + 30, `Ø${result.bottomDiameter.toFixed(0)}mm`, "bottom");
}

function render3DViewWaveform(svg: SVGSVGElement, result: WaveformLampshadeResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const radiusDiff = result.bottomRadius - result.topRadius;
  const verticalHeight = Math.sqrt(
    Math.pow(result.slantHeight, 2) - Math.pow(radiusDiff, 2)
  );

  const maxDim = Math.max(result.bottomDiameter, verticalHeight);
  const scale = Math.min(width, height) / (maxDim + 100);

  const topR = result.topRadius * scale;
  const bottomR = result.bottomRadius * scale;
  const h = verticalHeight * scale;

  drawGrid(svg, width, height);

  const topLeftX = centerX - topR;
  const topRightX = centerX + topR;
  const bottomLeftX = centerX - bottomR;
  const bottomRightX = centerX + bottomR;
  const topY = centerY - h / 2;
  const bottomY = centerY + h / 2;

  const outlineGroup = createSvgElement("g");

  appendLine(outlineGroup, topLeftX, topY, bottomLeftX, bottomY, "#0d47a1", 2);
  appendLine(outlineGroup, topRightX, topY, bottomRightX, bottomY, "#0d47a1", 2);

  // Top edge (wavy or straight based on topWave setting)
  if (result.topWave) {
    const topWavePath = generateSineWavePath(topLeftX, topY, topRightX, topY, result.waveCount || 3, 8);
    const topWaveEl = createSvgElement("path");
    topWaveEl.setAttribute("d", topWavePath);
    topWaveEl.setAttribute("stroke", "#0d47a1");
    topWaveEl.setAttribute("stroke-width", "2");
    topWaveEl.setAttribute("fill", "none");
    outlineGroup.appendChild(topWaveEl);
  } else {
    appendLine(outlineGroup, topLeftX, topY, topRightX, topY, "#0d47a1", 2);
  }

  // Bottom edge (wavy or straight based on bottomWave setting)
  if (result.bottomWave) {
    const bottomWavePath = generateSineWavePath(bottomLeftX, bottomY, bottomRightX, bottomY, result.waveCount || 3, 8);
    const bottomWaveEl = createSvgElement("path");
    bottomWaveEl.setAttribute("d", bottomWavePath);
    bottomWaveEl.setAttribute("stroke", "#0d47a1");
    bottomWaveEl.setAttribute("stroke-width", "2");
    bottomWaveEl.setAttribute("fill", "none");
    outlineGroup.appendChild(bottomWaveEl);
  } else {
    appendLine(outlineGroup, bottomLeftX, bottomY, bottomRightX, bottomY, "#0d47a1", 2);
  }

  svg.appendChild(outlineGroup);

  const midX = (topLeftX + bottomLeftX) / 2;
  const midY = (topY + bottomY) / 2;

  appendLine(svg, topLeftX - 40, topY, bottomLeftX - 40, bottomY, "#ff6b35", 1, "4,4");
  appendText(svg, midX - 50, midY, `H: ${result.slantHeight.toFixed(0)}mm`, 12, "#ff6b35");

  addDimensionLine(svg, topLeftX, topY - 30, topRightX, topY - 30, `Ø${result.topDiameter.toFixed(0)}mm`, "top");
  addDimensionLine(svg, bottomLeftX, bottomY + 30, bottomRightX, bottomY + 30, `Ø${result.bottomDiameter.toFixed(0)}mm`, "bottom");
}

// ==================== Unfolded Views ====================

function renderUnfoldedViewConical(svg: SVGSVGElement, result: CalculationResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const maxRadius = result.outerRadius;
  const scale = Math.min(width, height) / (maxRadius * 2.5);

  const innerR = result.innerRadius * scale;
  const outerR = result.outerRadius * scale;
  const angle = (result.sectorAngle * Math.PI) / 180;

  drawGrid(svg, width, height);

  const sectorGroup = createSvgElement("g");
  sectorGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Outer arc
  const outerArcPath = describeArc(0, 0, outerR, 0, angle);
  const outerArc = createSvgElement("path");
  outerArc.setAttribute("d", outerArcPath);
  outerArc.setAttribute("stroke", "#0d47a1");
  outerArc.setAttribute("stroke-width", "2");
  outerArc.setAttribute("fill", "none");
  sectorGroup.appendChild(outerArc);

  // Inner arc
  const innerArcPath = describeArc(0, 0, innerR, 0, angle);
  const innerArc = createSvgElement("path");
  innerArc.setAttribute("d", innerArcPath);
  innerArc.setAttribute("stroke", "#0d47a1");
  innerArc.setAttribute("stroke-width", "2");
  innerArc.setAttribute("fill", "none");
  sectorGroup.appendChild(innerArc);

  // Left radial line (from origin to outerR along 0 angle)
  appendLine(sectorGroup, innerR, 0, outerR, 0, "#0d47a1", 2);

  // Right radial line
  const rightOuterX = outerR * Math.cos(angle);
  const rightOuterY = outerR * Math.sin(angle);
  const rightInnerX = innerR * Math.cos(angle);
  const rightInnerY = innerR * Math.sin(angle);
  appendLine(sectorGroup, rightInnerX, rightInnerY, rightOuterX, rightOuterY, "#0d47a1", 2);

  // Fill
  const fillPath = createSvgElement("path");
  const pathData = `M ${outerR} 0 A ${outerR} ${outerR} 0 0 1 ${rightOuterX} ${rightOuterY} L ${rightInnerX} ${rightInnerY} A ${innerR} ${innerR} 0 0 0 ${innerR} 0 Z`;
  fillPath.setAttribute("d", pathData);
  fillPath.setAttribute("fill", "#e3f2fd");
  fillPath.setAttribute("opacity", "0.5");
  sectorGroup.appendChild(fillPath);

  svg.appendChild(sectorGroup);

  const textOffset = 20;
  appendText(svg, centerX - 80, centerY - innerR - textOffset, `R=${result.innerRadius.toFixed(1)}`, 12, "#0d47a1");
  appendText(svg, centerX - 80, centerY - outerR - textOffset, `r=${result.outerRadius.toFixed(1)}`, 12, "#0d47a1");
  appendText(svg, centerX + 20, centerY + 30, `θ=${result.sectorAngle.toFixed(1)}°`, 12, "#0d47a1");
}

function renderUnfoldedViewPolygonal(svg: SVGSVGElement, result: PolygonLampshadeResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const maxRadius = result.singleFaceOuterRadius;
  const scale = Math.min(width, height) / (maxRadius * 2.5);

  const innerR = result.singleFaceInnerRadius * scale;
  const outerR = result.singleFaceOuterRadius * scale;
  const totalAngle = (result.totalSectorAngle * Math.PI) / 180;

  drawGrid(svg, width, height);

  const sectorGroup = createSvgElement("g");
  sectorGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Outer arc
  const outerArcPath = describeArc(0, 0, outerR, 0, totalAngle);
  const outerArc = createSvgElement("path");
  outerArc.setAttribute("d", outerArcPath);
  outerArc.setAttribute("stroke", "#0d47a1");
  outerArc.setAttribute("stroke-width", "2");
  outerArc.setAttribute("fill", "none");
  sectorGroup.appendChild(outerArc);

  // Inner arc
  const innerArcPath = describeArc(0, 0, innerR, 0, totalAngle);
  const innerArc = createSvgElement("path");
  innerArc.setAttribute("d", innerArcPath);
  innerArc.setAttribute("stroke", "#0d47a1");
  innerArc.setAttribute("stroke-width", "2");
  innerArc.setAttribute("fill", "none");
  sectorGroup.appendChild(innerArc);

  // Left radial line
  appendLine(sectorGroup, innerR, 0, outerR, 0, "#0d47a1", 2);

  // Right radial line
  const rightOuterX = outerR * Math.cos(totalAngle);
  const rightOuterY = outerR * Math.sin(totalAngle);
  const rightInnerX = innerR * Math.cos(totalAngle);
  const rightInnerY = innerR * Math.sin(totalAngle);
  appendLine(sectorGroup, rightInnerX, rightInnerY, rightOuterX, rightOuterY, "#0d47a1", 2);

  // Dividing lines for each face
  const singleAngle = (result.singleFaceSectorAngle * Math.PI) / 180;
  for (let i = 1; i < result.sides; i++) {
    const a = i * singleAngle;
    const ox = outerR * Math.cos(a);
    const oy = outerR * Math.sin(a);
    const ix = innerR * Math.cos(a);
    const iy = innerR * Math.sin(a);
    appendLine(sectorGroup, ix, iy, ox, oy, "#0d47a1", 1, "2,2");
  }

  // Fill
  const fillPath = createSvgElement("path");
  const pathData = `M ${outerR} 0 A ${outerR} ${outerR} 0 0 1 ${rightOuterX} ${rightOuterY} L ${rightInnerX} ${rightInnerY} A ${innerR} ${innerR} 0 0 0 ${innerR} 0 Z`;
  fillPath.setAttribute("d", pathData);
  fillPath.setAttribute("fill", "#e3f2fd");
  fillPath.setAttribute("opacity", "0.5");
  sectorGroup.appendChild(fillPath);

  svg.appendChild(sectorGroup);

  const textOffset = 20;
  appendText(svg, centerX - 80, centerY - innerR - textOffset, `R=${result.singleFaceInnerRadius.toFixed(1)}`, 12, "#0d47a1");
  appendText(svg, centerX - 80, centerY - outerR - textOffset, `r=${result.singleFaceOuterRadius.toFixed(1)}`, 12, "#0d47a1");
  appendText(svg, centerX + 20, centerY + 30, `θ=${result.totalSectorAngle.toFixed(1)}° (${result.sides}面)`, 12, "#0d47a1");
}

/**
 * Render unfolded pattern view for waveform lampshade
 * Shows an annulus sector with wavy inner/outer arcs
 */
function renderUnfoldedViewWaveform(svg: SVGSVGElement, result: WaveformLampshadeResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const maxRadius = result.outerRadius + result.waveHeight;
  const scale = Math.min(width, height) / (maxRadius * 2.5);

  const innerR = result.innerRadius * scale;
  const outerR = result.outerRadius * scale;
  const sectorAngleRad = result.sectorAngleRad;
  const waveCount = result.waveCount;
  const waveHeightScaled = result.waveHeight * scale;

  drawGrid(svg, width, height);

  const sectorGroup = createSvgElement("g");
  sectorGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Fill the base sector (background)
  const rightOuterX = outerR * Math.cos(sectorAngleRad);
  const rightOuterY = outerR * Math.sin(sectorAngleRad);
  const rightInnerX = innerR * Math.cos(sectorAngleRad);
  const rightInnerY = innerR * Math.sin(sectorAngleRad);
  const largeArc = sectorAngleRad > Math.PI ? 1 : 0;
  const fillPathData = `M ${outerR} 0 A ${outerR} ${outerR} 0 ${largeArc} 1 ${rightOuterX} ${rightOuterY} L ${rightInnerX} ${rightInnerY} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerR} 0 Z`;
  const fillPath = createSvgElement("path");
  fillPath.setAttribute("d", fillPathData);
  fillPath.setAttribute("fill", "#e3f2fd");
  fillPath.setAttribute("opacity", "0.3");
  sectorGroup.appendChild(fillPath);

  const numSegments = Math.max(waveCount * 20, 80);

  // Outer arc (bottom edge of lampshade)
  if (result.bottomWave) {
    let outerWavePath = "";
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const angle = t * sectorAngleRad;
      const waveOffset = waveHeightScaled * Math.sin(t * waveCount * 2 * Math.PI);
      const r = outerR + waveOffset;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      outerWavePath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    const outerWave = createSvgElement("path");
    outerWave.setAttribute("d", outerWavePath);
    outerWave.setAttribute("stroke", "#0d47a1");
    outerWave.setAttribute("stroke-width", "2");
    outerWave.setAttribute("fill", "none");
    sectorGroup.appendChild(outerWave);
  } else {
    // Smooth outer arc
    const outerArcPath = describeArc(0, 0, outerR, 0, sectorAngleRad);
    const outerArc = createSvgElement("path");
    outerArc.setAttribute("d", outerArcPath);
    outerArc.setAttribute("stroke", "#0d47a1");
    outerArc.setAttribute("stroke-width", "2");
    outerArc.setAttribute("fill", "none");
    sectorGroup.appendChild(outerArc);
  }

  // Inner arc (top edge of lampshade)
  if (result.topWave) {
    let innerWavePath = "";
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const angle = t * sectorAngleRad;
      const waveOffset = waveHeightScaled * Math.sin(t * waveCount * 2 * Math.PI);
      const r = innerR + waveOffset;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      innerWavePath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    const innerWave = createSvgElement("path");
    innerWave.setAttribute("d", innerWavePath);
    innerWave.setAttribute("stroke", "#0d47a1");
    innerWave.setAttribute("stroke-width", "2");
    innerWave.setAttribute("fill", "none");
    sectorGroup.appendChild(innerWave);
  } else {
    // Smooth inner arc
    const innerArcPath = describeArc(0, 0, innerR, 0, sectorAngleRad);
    const innerArc = createSvgElement("path");
    innerArc.setAttribute("d", innerArcPath);
    innerArc.setAttribute("stroke", "#0d47a1");
    innerArc.setAttribute("stroke-width", "2");
    innerArc.setAttribute("fill", "none");
    sectorGroup.appendChild(innerArc);
  }

  // Left radial line
  appendLine(sectorGroup, innerR, 0, outerR, 0, "#0d47a1", 2);

  // Right radial line
  appendLine(sectorGroup, rightInnerX, rightInnerY, rightOuterX, rightOuterY, "#0d47a1", 2);

  svg.appendChild(sectorGroup);

  // Labels
  const waveInfo = [];
  if (result.topWave) waveInfo.push("上口");
  if (result.bottomWave) waveInfo.push("下口");
  const textOffset = 20;
  appendText(svg, centerX - 80, centerY - innerR - textOffset, `R=${result.innerRadius.toFixed(1)}`, 12, "#0d47a1");
  appendText(svg, centerX - 80, centerY - outerR - textOffset, `r=${result.outerRadius.toFixed(1)}`, 12, "#0d47a1");
  appendText(svg, centerX + 20, centerY + 30, `θ=${result.sectorAngle.toFixed(1)}° (${result.waveCount}波, ${waveInfo.join('+')})`, 12, "#0d47a1");
}

// ==================== SVG Helpers ====================

function createSvgElement(tag: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function appendLine(parent: SVGElement | SVGSVGElement, x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth: number, dashArray?: string) {
  const line = createSvgElement("line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", stroke);
  line.setAttribute("stroke-width", String(strokeWidth));
  if (dashArray) line.setAttribute("stroke-dasharray", dashArray);
  parent.appendChild(line);
}

function appendText(parent: SVGElement | SVGSVGElement, x: number, y: number, content: string, fontSize: number, fill: string) {
  const text = createSvgElement("text");
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y));
  text.setAttribute("font-size", String(fontSize));
  text.setAttribute("fill", fill);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.textContent = content;
  parent.appendChild(text);
}

function drawGrid(svg: SVGSVGElement, width: number, height: number) {
  const gridSize = 20;
  const gridGroup = createSvgElement("g");
  gridGroup.setAttribute("stroke", "#e0e0e0");
  gridGroup.setAttribute("stroke-width", "0.5");

  for (let i = 0; i <= width; i += gridSize) {
    appendLine(gridGroup as any, i, 0, i, height, "#e0e0e0", 0.5);
  }

  for (let i = 0; i <= height; i += gridSize) {
    appendLine(gridGroup as any, 0, i, width, i, "#e0e0e0", 0.5);
  }

  svg.appendChild(gridGroup);
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArc = endAngle - startAngle <= Math.PI ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArc, 0, end.x, end.y,
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function generateSineWavePath(x1: number, y1: number, x2: number, y2: number, waveCount: number, waveHeight: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segments = waveCount * 20;
  
  let path = "";
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    
    // Perpendicular offset for wave
    const angle = Math.atan2(dy, dx);
    const waveOffset = waveHeight * Math.sin(t * waveCount * 2 * Math.PI);
    const px = baseX - Math.sin(angle) * waveOffset;
    const py = baseY + Math.cos(angle) * waveOffset;
    
    path += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }
  
  return path;
}

function addDimensionLine(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, label: string, position: "top" | "bottom") {
  appendLine(svg, x1, y1, x2, y2, "#ff6b35", 1);

  const capSize = 5;
  appendLine(svg, x1, y1 - capSize, x1, y1 + capSize, "#ff6b35", 1);
  appendLine(svg, x2, y2 - capSize, x2, y2 + capSize, "#ff6b35", 1);

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const offsetY = position === "top" ? -15 : 15;

  appendText(svg, midX, midY + offsetY, label, 12, "#ff6b35");
}
