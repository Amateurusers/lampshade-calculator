import { useRef, useEffect } from "react";
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

  // Calculate vertical height from slant height and radius difference
  const radiusDiff = result.bottomRadius - result.topRadius;
  const verticalHeight = Math.sqrt(
    Math.pow(result.slantHeight, 2) - Math.pow(radiusDiff, 2)
  );

  // Scale factor to fit the lampshade in the view
  const maxDim = Math.max(result.bottomDiameter, verticalHeight);
  const scale = Math.min(width, height) / (maxDim + 100);

  const topR = result.topRadius * scale;
  const bottomR = result.bottomRadius * scale;
  const h = verticalHeight * scale;

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
  // Draw slant height annotation along the left slant edge
  const slantLength = Math.sqrt(
    Math.pow(bottomLeftX - topLeftX, 2) + Math.pow(bottomY - topY, 2)
  );
  const midX = (topLeftX + bottomLeftX) / 2;
  const midY = (topY + bottomY) / 2;
  
  // Draw measurement line along the slant edge
  const measureLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  measureLine.setAttribute("x1", String(topLeftX - 40));
  measureLine.setAttribute("y1", String(topY));
  measureLine.setAttribute("x2", String(bottomLeftX - 40));
  measureLine.setAttribute("y2", String(bottomY));
  measureLine.setAttribute("stroke", "#ff6b35");
  measureLine.setAttribute("stroke-width", "1");
  measureLine.setAttribute("stroke-dasharray", "4,4");
  svg.appendChild(measureLine);

  // Add text label for slant height
  const angle = Math.atan2(bottomY - topY, bottomLeftX - topLeftX);
  const textX = midX - 50;
  const textY = midY;
  
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(textX));
  text.setAttribute("y", String(textY));
  text.setAttribute("font-size", "12");
  text.setAttribute("fill", "#ff6b35");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.textContent = `H: ${result.slantHeight.toFixed(0)}mm`;
  svg.appendChild(text);

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
 * Render unfolded pattern view - Sector Ring (Annulus Sector)
 */
function renderUnfoldedView(svg: SVGSVGElement, result: CalculationResult) {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  // Scale to fit the unfolded pattern
  const maxRadius = result.outerRadius;
  const scale = Math.min(width, height) / (maxRadius * 2.5);

  const innerR = result.innerRadius * scale;
  const outerR = result.outerRadius * scale;
  const angle = (result.sectorAngle * Math.PI) / 180;

  // Draw background grid
  drawGrid(svg, width, height);

  // Draw the unfolded sector ring
  const sectorGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  sectorGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

  // Draw outer arc
  const outerArcPath = describeArc(0, 0, outerR, 0, angle);
  const outerArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outerArc.setAttribute("d", outerArcPath);
  outerArc.setAttribute("stroke", "#0d47a1");
  outerArc.setAttribute("stroke-width", "2");
  outerArc.setAttribute("fill", "none");
  sectorGroup.appendChild(outerArc);

  // Draw inner arc
  const innerArcPath = describeArc(0, 0, innerR, 0, angle);
  const innerArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
  innerArc.setAttribute("d", innerArcPath);
  innerArc.setAttribute("stroke", "#0d47a1");
  innerArc.setAttribute("stroke-width", "2");
  innerArc.setAttribute("fill", "none");
  sectorGroup.appendChild(innerArc);

  // Draw left radial line
  const leftLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftLine.setAttribute("x1", "0");
  leftLine.setAttribute("y1", "0");
  leftLine.setAttribute("x2", String(outerR));
  leftLine.setAttribute("y2", "0");
  leftLine.setAttribute("stroke", "#0d47a1");
  leftLine.setAttribute("stroke-width", "2");
  sectorGroup.appendChild(leftLine);

  // Draw right radial line
  const rightX = outerR * Math.cos(angle);
  const rightY = outerR * Math.sin(angle);
  const rightLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightLine.setAttribute("x1", "0");
  rightLine.setAttribute("y1", "0");
  rightLine.setAttribute("x2", String(rightX));
  rightLine.setAttribute("y2", String(rightY));
  rightLine.setAttribute("stroke", "#0d47a1");
  rightLine.setAttribute("stroke-width", "2");
  sectorGroup.appendChild(rightLine);

  // Fill the sector
  const fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const pathData = `M ${outerR} 0 A ${outerR} ${outerR} 0 0 1 ${rightX} ${rightY} L ${rightX * innerR / outerR} ${rightY * innerR / outerR} A ${innerR} ${innerR} 0 0 0 ${innerR} 0 Z`;
  fillPath.setAttribute("d", pathData);
  fillPath.setAttribute("fill", "#e3f2fd");
  fillPath.setAttribute("opacity", "0.5");
  sectorGroup.appendChild(fillPath);

  svg.appendChild(sectorGroup);

  // Add dimension text
  const textOffset = 20;
  const text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text1.setAttribute("x", String(centerX - 80));
  text1.setAttribute("y", String(centerY - innerR - textOffset));
  text1.setAttribute("font-size", "12");
  text1.setAttribute("fill", "#0d47a1");
  text1.textContent = `R=${result.innerRadius.toFixed(1)}`;
  svg.appendChild(text1);

  const text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text2.setAttribute("x", String(centerX - 80));
  text2.setAttribute("y", String(centerY - outerR - textOffset));
  text2.setAttribute("font-size", "12");
  text2.setAttribute("fill", "#0d47a1");
  text2.textContent = `r=${result.outerRadius.toFixed(1)}`;
  svg.appendChild(text2);

  const text3 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text3.setAttribute("x", String(centerX + 20));
  text3.setAttribute("y", String(centerY + 30));
  text3.setAttribute("font-size", "12");
  text3.setAttribute("fill", "#0d47a1");
  text3.textContent = `θ=${result.sectorAngle.toFixed(1)}°`;
  svg.appendChild(text3);
}

/**
 * Draw grid background
 */
function drawGrid(svg: SVGSVGElement, width: number, height: number) {
  const gridSize = 20;
  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  for (let x = 0; x < width; x += gridSize) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", "0");
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(height));
    line.setAttribute("stroke", "#e0e0e0");
    line.setAttribute("stroke-width", "0.5");
    gridGroup.appendChild(line);
  }

  for (let y = 0; y < height; y += gridSize) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(width));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "#e0e0e0");
    line.setAttribute("stroke-width", "0.5");
    gridGroup.appendChild(line);
  }

  svg.appendChild(gridGroup);
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
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", "#ff6b35");
  line.setAttribute("stroke-width", "1");
  svg.appendChild(line);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  text.setAttribute("x", String(midX));
  text.setAttribute("y", String(midY));
  text.setAttribute("font-size", "12");
  text.setAttribute("fill", "#ff6b35");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");

  if (position === "top" || position === "bottom") {
    text.setAttribute("dy", position === "top" ? "-8" : "16");
  } else {
    text.setAttribute("dx", position === "left" ? "-8" : "8");
  }

  text.textContent = label;
  svg.appendChild(text);
}

/**
 * Describe SVG arc path
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArc = endAngle - startAngle <= Math.PI ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArc,
    0,
    end.x,
    end.y,
  ].join(" ");
}

/**
 * Convert polar to cartesian coordinates
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInRadians: number
) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}
