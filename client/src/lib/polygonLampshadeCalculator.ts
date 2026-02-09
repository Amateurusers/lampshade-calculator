/**
 * Polygon Lampshade Calculator
 * Calculates unfolding patterns for polygon-shaped lampshades (3-12 sides)
 * 
 * Key insight: A polygon lampshade is essentially multiple cone frustums arranged in a circle.
 * Each face unfolds as a curved trapezoid (sector of an annulus).
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
  
  // Unfolding calculations - for the ENTIRE unfolded pattern
  totalUnfoldedRadius: number;    // Outer radius of the unfolded pattern
  totalUnfoldedInnerRadius: number; // Inner radius of the unfolded pattern
  totalSectorAngle: number;       // Total sector angle of the unfolded pattern (degrees)
  
  // Single face unfolding
  singleFaceOuterRadius: number;  // Outer radius for one face
  singleFaceInnerRadius: number;  // Inner radius for one face
  singleFaceSectorAngle: number;  // Sector angle for one face (degrees)
  
  // Material requirements
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
    totalUnfoldedRadius: 0,
    totalUnfoldedInnerRadius: 0,
    totalSectorAngle: 0,
    singleFaceOuterRadius: 0,
    singleFaceInnerRadius: 0,
    singleFaceSectorAngle: 0,
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

  // Calculate central angle for each side (in the 3D shape)
  const centralAngle = 360 / input.sides;
  result.topCentralAngle = centralAngle;
  result.bottomCentralAngle = centralAngle;

  // Calculate side lengths using law of cosines
  // For a regular polygon inscribed in a circle: side = 2 * radius * sin(angle/2)
  const topAngleRad = (centralAngle * Math.PI) / 180;
  const bottomAngleRad = (centralAngle * Math.PI) / 180;

  result.topSideLength = 2 * result.topRadius * Math.sin(topAngleRad / 2);
  result.bottomSideLength = 2 * result.bottomRadius * Math.sin(bottomAngleRad / 2);

  // Calculate the apex distance using similar triangles
  // For a cone frustum: R_top / R_bottom = (apex_dist) / (apex_dist + slant_height)
  const radiusDiff = result.bottomRadius - result.topRadius;
  
  let apexDistance = 0;
  if (Math.abs(radiusDiff) > 0.001) {
    apexDistance = (result.topRadius * input.slantHeight) / radiusDiff;
  }

  // Total radius from apex to bottom edge
  const totalOuterRadius = apexDistance + input.slantHeight;
  const totalInnerRadius = apexDistance;

  // For the unfolded pattern, we need to calculate the sector angle
  // The arc length at the top circle must match the chord length
  // Arc length = topRadius * centralAngle (in radians)
  // In the unfolded pattern, this becomes: innerRadius * sectorAngle
  // Therefore: sectorAngle = (topRadius * centralAngle) / innerRadius
  
  const centralAngleRad = (centralAngle * Math.PI) / 180;
  const topArcLength = result.topRadius * centralAngleRad;
  
  let singleFaceSectorAngleRad = 0;
  if (totalInnerRadius > 0.001) {
    singleFaceSectorAngleRad = topArcLength / totalInnerRadius;
  } else {
    // If apex is at the same location as top, use the central angle directly
    singleFaceSectorAngleRad = centralAngleRad;
  }

  result.singleFaceOuterRadius = totalOuterRadius;
  result.singleFaceInnerRadius = totalInnerRadius;
  result.singleFaceSectorAngle = (singleFaceSectorAngleRad * 180) / Math.PI;
  
  // Total unfolded pattern
  result.totalUnfoldedRadius = totalOuterRadius;
  result.totalUnfoldedInnerRadius = totalInnerRadius;
  result.totalSectorAngle = result.singleFaceSectorAngle * input.sides;

  // Calculate total surface area
  // Each face is a trapezoid with curved edges
  // Area ≈ average of top and bottom arc lengths * slant height
  const topArcLengthFull = result.topSideLength;
  const bottomArcLengthFull = result.bottomSideLength;
  const singleFaceArea = ((topArcLengthFull + bottomArcLengthFull) / 2) * input.slantHeight;
  result.totalSurfaceArea = singleFaceArea * input.sides;

  return result;
}

/**
 * Generate SVG path for one unfolded curved trapezoid (sector)
 */
export function generatePolygonUnfoldedPath(
  result: PolygonLampshadeResult
): string {
  if (!result.isValid) return "";

  const outerR = result.singleFaceOuterRadius;
  const innerR = result.singleFaceInnerRadius;
  const angle = (result.singleFaceSectorAngle * Math.PI) / 180;

  // Create sector path (similar to cone unfolding)
  const points = [
    // Outer arc start
    [outerR, 0],
    // Outer arc end
    [outerR * Math.cos(angle), outerR * Math.sin(angle)],
    // Inner arc end
    [innerR * Math.cos(angle), innerR * Math.sin(angle)],
    // Inner arc start
    [innerR, 0],
  ];

  // Create path with arcs
  let pathData = `M ${points[0][0]} ${points[0][1]}`;
  
  // Outer arc
  const outerLargeArc = angle > Math.PI ? 1 : 0;
  pathData += ` A ${outerR} ${outerR} 0 ${outerLargeArc} 1 ${points[1][0]} ${points[1][1]}`;
  
  // Line to inner arc end
  pathData += ` L ${points[2][0]} ${points[2][1]}`;
  
  // Inner arc (reverse direction)
  const innerLargeArc = angle > Math.PI ? 1 : 0;
  pathData += ` A ${innerR} ${innerR} 0 ${innerLargeArc} 0 ${points[3][0]} ${points[3][1]}`;
  
  // Close path
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
