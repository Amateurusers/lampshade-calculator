/**
 * Polygon Lampshade Calculator
 * Calculates unfolding patterns for polygon-shaped lampshades (3-12 sides)
 */

export interface PolygonLampshadeInput {
  sides: number;              // Number of sides (3-12)
  topDiameter: number;        // Top opening diameter (mm)
  bottomDiameter: number;     // Bottom opening diameter (mm)
  slantHeight: number;        // Slant height from top to bottom edge (mm)
}

export interface PolygonLampshadeResult {
  // Input parameters
  sides: number;
  topDiameter: number;
  bottomDiameter: number;
  slantHeight: number;
  
  // Derived measurements
  topRadius: number;
  bottomRadius: number;
  
  // Polygon calculations
  topSideLength: number;      // Length of each side at top
  bottomSideLength: number;   // Length of each side at bottom
  topCentralAngle: number;    // Central angle for each side at top (degrees)
  bottomCentralAngle: number; // Central angle for each side at bottom (degrees)
  
  // Unfolding calculations for one side
  unfoldedTopLength: number;  // Unfolded length at top edge
  unfoldedBottomLength: number; // Unfolded length at bottom edge
  unfoldedSlantHeight: number; // Unfolded slant height (same as input slant height)
  
  // Material requirements
  materialWidth: number;      // Recommended material width
  materialHeight: number;     // Recommended material height
  totalSurfaceArea: number;   // Total surface area of all sides
  
  // Validation
  isValid: boolean;
  validationMessage: string;
}

/**
 * Calculate polygon lampshade unfolding pattern
 */
export function calculatePolygonLampshade(
  input: PolygonLampshadeInput
): PolygonLampshadeResult {
  const result: PolygonLampshadeResult = {
    sides: input.sides,
    topDiameter: input.topDiameter,
    bottomDiameter: input.bottomDiameter,
    slantHeight: input.slantHeight,
    topRadius: input.topDiameter / 2,
    bottomRadius: input.bottomDiameter / 2,
    topSideLength: 0,
    bottomSideLength: 0,
    topCentralAngle: 0,
    bottomCentralAngle: 0,
    unfoldedTopLength: 0,
    unfoldedBottomLength: 0,
    unfoldedSlantHeight: input.slantHeight,
    materialWidth: 0,
    materialHeight: 0,
    totalSurfaceArea: 0,
    isValid: true,
    validationMessage: "",
  };

  // Validation
  if (input.sides < 3 || input.sides > 12) {
    result.isValid = false;
    result.validationMessage = "边数必须在 3-12 之间";
    return result;
  }

  if (input.topDiameter <= 0 || input.bottomDiameter <= 0) {
    result.isValid = false;
    result.validationMessage = "直径必须大于 0";
    return result;
  }

  if (input.slantHeight <= 0) {
    result.isValid = false;
    result.validationMessage = "斜高必须大于 0";
    return result;
  }

  // Calculate central angle for each side
  const centralAngle = 360 / input.sides;
  result.topCentralAngle = centralAngle;
  result.bottomCentralAngle = centralAngle;

  // Calculate side lengths using law of cosines
  // For a regular polygon inscribed in a circle: side = 2 * radius * sin(angle/2)
  const topAngleRad = (centralAngle * Math.PI) / 180;
  const bottomAngleRad = (centralAngle * Math.PI) / 180;

  result.topSideLength = 2 * result.topRadius * Math.sin(topAngleRad / 2);
  result.bottomSideLength = 2 * result.bottomRadius * Math.sin(bottomAngleRad / 2);

  // For unfolding, we need to "unfold" the polygon into a flat pattern
  // Each side becomes a trapezoid in the unfolded pattern
  // The key is that the arc length at top and bottom must match the side lengths

  // Calculate the radius from the apex to the top and bottom edges
  // Using similar triangles: R_top / R_bottom = top_radius / bottom_radius
  const radiusDiff = result.bottomRadius - result.topRadius;
  const verticalHeight = Math.sqrt(
    Math.pow(input.slantHeight, 2) - Math.pow(radiusDiff, 2)
  );

  // Calculate apex distance (distance from apex to top circle)
  const apexDistance =
    (result.topRadius * input.slantHeight) / radiusDiff;

  // Total slant height from apex to bottom
  const totalSlantHeight = apexDistance + input.slantHeight;

  // For unfolding, the arc length becomes the chord length in the unfolded pattern
  // The unfolded pattern is a trapezoid with:
  // - Top edge = top side length
  // - Bottom edge = bottom side length
  // - Height = slant height
  result.unfoldedTopLength = result.topSideLength;
  result.unfoldedBottomLength = result.bottomSideLength;

  // Material dimensions
  result.materialWidth = Math.max(
    result.unfoldedTopLength,
    result.unfoldedBottomLength
  ) * 1.1; // Add 10% margin
  result.materialHeight = input.slantHeight * 1.1; // Add 10% margin

  // Calculate total surface area (sum of all trapezoid areas)
  const singleTrapezoidArea =
    ((result.topSideLength + result.bottomSideLength) / 2) * input.slantHeight;
  result.totalSurfaceArea = singleTrapezoidArea * input.sides;

  return result;
}

/**
 * Generate SVG path for one unfolded trapezoid side
 */
export function generatePolygonUnfoldedPath(
  result: PolygonLampshadeResult
): string {
  if (!result.isValid) return "";

  const width = result.unfoldedBottomLength;
  const height = result.slantHeight;
  const topWidth = result.unfoldedTopLength;

  // Calculate the offset for centering the trapezoid
  const offset = (width - topWidth) / 2;

  // Create trapezoid path
  const points = [
    [offset, 0], // Top-left
    [offset + topWidth, 0], // Top-right
    [width, height], // Bottom-right
    [0, height], // Bottom-left
  ];

  let pathData = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i][0]} ${points[i][1]}`;
  }
  pathData += " Z";

  return pathData;
}

/**
 * Generate 3D visualization data for polygon lampshade
 */
export function generatePolygon3DVisualization(
  result: PolygonLampshadeResult
): Array<{ x: number; y: number; z: number }> {
  const vertices: Array<{ x: number; y: number; z: number }> = [];

  const radiusDiff = result.bottomRadius - result.topRadius;
  const verticalHeight = Math.sqrt(
    Math.pow(result.slantHeight, 2) - Math.pow(radiusDiff, 2)
  );

  const centralAngle = (360 / result.sides) * (Math.PI / 180);

  // Top circle vertices
  for (let i = 0; i < result.sides; i++) {
    const angle = i * centralAngle;
    vertices.push({
      x: result.topRadius * Math.cos(angle),
      y: result.topRadius * Math.sin(angle),
      z: verticalHeight / 2,
    });
  }

  // Bottom circle vertices
  for (let i = 0; i < result.sides; i++) {
    const angle = i * centralAngle;
    vertices.push({
      x: result.bottomRadius * Math.cos(angle),
      y: result.bottomRadius * Math.sin(angle),
      z: -verticalHeight / 2,
    });
  }

  return vertices;
}
