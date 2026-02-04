import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { CalculationResult, generateUnfoldedPatternPath } from "@/lib/lampshadeCalculator";

interface LampshadeVisualizationProps {
  result: CalculationResult;
  activeTab: "3d" | "unfolded";
}

/**
 * LampshadeVisualization Component
 * 
 * Design Philosophy: Modern Minimalist
 * - Clean SVG visualizations
 * - Responsive sizing
 * - Clear visual distinction between 3D and unfolded views
 * - Subtle styling with focus on clarity
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

/**
 * Render 3D side view of the lampshade
 */
function render3DView(svg: SVGSVGElement, result: CalculationResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  // Scale factor to fit the lampshade in the view
  const maxDim = Math.max(result.bottomDiameter, result.height);
  const scale = Math.min(width, height) / (maxDim + 100);

  const topR = result.topRadius * scale;
  const bottomR = result.bottomRadius * scale;
  const h = result.height * scale;

  // Draw background grid
  drawGrid(svg, width, height);

  // Draw the lampshade profile (side view)
  const topLeftX = centerX - topR;
  const topRightX = centerX + topR;
  const bottomLeftX = centerX - bottomR;
  const bottomRightX = centerX + bottomR;
  const topY = centerY - h / 2;
  const bottomY = centerY + h / 2;

  // Draw the outline
  const outlineGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );

  // Left edge
  const leftLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftLine.setAttribute("x1", String(topLeftX));
  leftLine.setAttribute("y1", String(topY));
  leftLine.setAttribute("x2", String(bottomLeftX));
  leftLine.setAttribute("y2", String(bottomY));
  leftLine.setAttribute("stroke", "#0d47a1");
  leftLine.setAttribute("stroke-width", "2");
  outlineGroup.appendChild(leftLine);

  // Right edge
  const rightLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightLine.setAttribute("x1", String(topRightX));
  rightLine.setAttribute("y1", String(topY));
  rightLine.setAttribute("x2", String(bottomRightX));
  rightLine.setAttribute("y2", String(bottomY));
  rightLine.setAttribute("stroke", "#0d47a1");
  rightLine.setAttribute("stroke-width", "2");
  outlineGroup.appendChild(rightLine);

  // Top ellipse (simplified as line)
  const topEllipse = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  topEllipse.setAttribute("x1", String(topLeftX));
  topEllipse.setAttribute("y1", String(topY));
  topEllipse.setAttribute("x2", String(topRightX));
  topEllipse.setAttribute("y2", String(topY));
  topEllipse.setAttribute("stroke", "#0d47a1");
  topEllipse.setAttribute("stroke-width", "2");
  outlineGroup.appendChild(topEllipse);

  // Bottom ellipse (simplified as line)
  const bottomEllipse = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  bottomEllipse.setAttribute("x1", String(bottomLeftX));
  bottomEllipse.setAttribute("y1", String(bottomY));
  bottomEllipse.setAttribute("x2", String(bottomRightX));
  bottomEllipse.setAttribute("y2", String(bottomY));
  bottomEllipse.setAttribute("stroke", "#0d47a1");
  bottomEllipse.setAttribute("stroke-width", "2");
  outlineGroup.appendChild(bottomEllipse);

  svg.appendChild(outlineGroup);

  // Add dimension annotations
  addDimensionLine(
    svg,
    topLeftX - 30,
    topY,
    topLeftX - 30,
    bottomY,
    `H: ${result.height.toFixed(0)}mm`,
    "left"
  );

  addDimensionLine(
    svg,
    topLeftX,
    topY - 30,
    topRightX,
    topY - 30,
    `Ø${result.topDiameter.toFixed(0)}mm`,
    "top"
  );

  addDimensionLine(
    svg,
    bottomLeftX,
    bottomY + 30,
    bottomRightX,
    bottomY + 30,
    `Ø${result.bottomDiameter.toFixed(0)}mm`,
    "bottom"
  );
}

/**
 * Render unfolded pattern view
 */
function renderUnfoldedView(svg: SVGSVGElement, result: CalculationResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  // Draw background grid
  drawGrid(svg, width, height);

  const innerR = result.innerRadius;
  const outerR = result.outerRadius;
  const angle = result.sectorAngleRad;

  // Scale to fit in view
  const scale = Math.min(width, height) / (outerR * 2.2);
  const scaledInnerR = innerR * scale;
  const scaledOuterR = outerR * scale;

  // Create group for the pattern
  const patternGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  patternGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Draw inner arc
  const innerArcPath = createArcPath(0, scaledInnerR, angle, false);
  const innerArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
  innerArc.setAttribute("d", innerArcPath);
  innerArc.setAttribute("stroke", "#0d47a1");
  innerArc.setAttribute("stroke-width", "1.5");
  innerArc.setAttribute("fill", "none");
  patternGroup.appendChild(innerArc);

  // Draw outer arc
  const outerArcPath = createArcPath(0, scaledOuterR, angle, false);
  const outerArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outerArc.setAttribute("d", outerArcPath);
  outerArc.setAttribute("stroke", "#0d47a1");
  outerArc.setAttribute("stroke-width", "2");
  outerArc.setAttribute("fill", "none");
  patternGroup.appendChild(outerArc);

  // Draw radial lines
  const startX1 = 0;
  const startY1 = -scaledInnerR;
  const endX1 = 0;
  const endY1 = -scaledOuterR;

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", String(startX1));
  line1.setAttribute("y1", String(startY1));
  line1.setAttribute("x2", String(endX1));
  line1.setAttribute("y2", String(endY1));
  line1.setAttribute("stroke", "#0d47a1");
  line1.setAttribute("stroke-width", "1.5");
  patternGroup.appendChild(line1);

  const endX2 = scaledOuterR * Math.sin(angle);
  const endY2 = -scaledOuterR * Math.cos(angle);
  const startX2 = scaledInnerR * Math.sin(angle);
  const startY2 = -scaledInnerR * Math.cos(angle);

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", String(startX2));
  line2.setAttribute("y1", String(startY2));
  line2.setAttribute("x2", String(endX2));
  line2.setAttribute("y2", String(endY2));
  line2.setAttribute("stroke", "#0d47a1");
  line2.setAttribute("stroke-width", "1.5");
  patternGroup.appendChild(line2);

  // Fill the sector with light color
  const sectorPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const largeArc = angle > Math.PI ? 1 : 0;
  const pathData = [
    `M 0 -${scaledInnerR}`,
    `A ${scaledInnerR} ${scaledInnerR} 0 ${largeArc} 1 ${scaledInnerR * Math.sin(angle)} -${scaledInnerR * Math.cos(angle)}`,
    `L ${scaledOuterR * Math.sin(angle)} -${scaledOuterR * Math.cos(angle)}`,
    `A ${scaledOuterR} ${scaledOuterR} 0 ${largeArc} 0 0 -${scaledOuterR}`,
    `Z`,
  ].join(" ");

  sectorPath.setAttribute("d", pathData);
  sectorPath.setAttribute("fill", "#e3f2fd");
  sectorPath.setAttribute("opacity", "0.5");
  patternGroup.appendChild(sectorPath);

  svg.appendChild(patternGroup);

  // Add annotations
  const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  textGroup.setAttribute("font-size", "12");
  textGroup.setAttribute("fill", "#616161");
  textGroup.setAttribute("font-family", "Inter, sans-serif");

  const angleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  angleText.setAttribute("x", String(centerX + 20));
  angleText.setAttribute("y", String(centerY - 20));
  angleText.textContent = `θ: ${result.sectorAngle.toFixed(1)}°`;
  textGroup.appendChild(angleText);

  svg.appendChild(textGroup);
}

/**
 * Draw background grid
 */
function drawGrid(svg: SVGSVGElement, width: number, height: number) {
  const gridSize = 40;
  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gridGroup.setAttribute("stroke", "#e0e0e0");
  gridGroup.setAttribute("stroke-width", "0.5");

  for (let x = 0; x < width; x += gridSize) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", "0");
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(height));
    gridGroup.appendChild(line);
  }

  for (let y = 0; y < height; y += gridSize) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(width));
    line.setAttribute("y2", String(y));
    gridGroup.appendChild(line);
  }

  svg.appendChild(gridGroup);
}

/**
 * Create SVG arc path
 */
function createArcPath(
  startAngle: number,
  radius: number,
  endAngle: number,
  clockwise: boolean
): string {
  const startX = radius * Math.sin(startAngle);
  const startY = -radius * Math.cos(startAngle);
  const endX = radius * Math.sin(endAngle);
  const endY = -radius * Math.cos(endAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const sweep = clockwise ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
}

/**
 * Add dimension line with label
 */
function addDimensionLine(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  position: "top" | "bottom" | "left" | "right"
) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Draw line
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", "#ff6b35");
  line.setAttribute("stroke-width", "1");
  group.appendChild(line);

  // Draw text
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("font-size", "11");
  text.setAttribute("fill", "#ff6b35");
  text.setAttribute("font-family", "Inter, sans-serif");
  text.setAttribute("font-weight", "500");

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  if (position === "top") {
    text.setAttribute("x", String(midX));
    text.setAttribute("y", String(midY - 8));
    text.setAttribute("text-anchor", "middle");
  } else if (position === "bottom") {
    text.setAttribute("x", String(midX));
    text.setAttribute("y", String(midY + 15));
    text.setAttribute("text-anchor", "middle");
  } else if (position === "left") {
    text.setAttribute("x", String(midX - 8));
    text.setAttribute("y", String(midY));
    text.setAttribute("text-anchor", "end");
    text.setAttribute("dominant-baseline", "middle");
  } else {
    text.setAttribute("x", String(midX + 8));
    text.setAttribute("y", String(midY));
    text.setAttribute("text-anchor", "start");
    text.setAttribute("dominant-baseline", "middle");
  }

  text.textContent = label;
  group.appendChild(text);

  svg.appendChild(group);
}
