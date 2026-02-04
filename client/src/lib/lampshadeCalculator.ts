/**
 * Lampshade Calculator - Core Mathematical Functions
 * 
 * This module provides functions to calculate the unfolded (flat) pattern
 * of a conical lampshade given its top diameter, bottom diameter, and height.
 * 
 * Mathematical Principles:
 * - A conical lampshade can be unfolded into a sector of an annulus (ring)
 * - The unfolding preserves the arc lengths of the top and bottom circles
 */

export interface LampshadeParams {
  topDiameter: number;    // Top opening diameter (mm)
  bottomDiameter: number; // Bottom opening diameter (mm)
  height: number;         // Height of lampshade (mm)
}

export interface CalculationResult {
  // Input parameters
  topDiameter: number;
  bottomDiameter: number;
  height: number;
  
  // Derived measurements
  topRadius: number;
  bottomRadius: number;
  slantHeight: number;     // Slant length from top to bottom edge
  
  // Unfolding calculations
  topCircumference: number;
  bottomCircumference: number;
  
  // Cone parameters (if extended to apex)
  apexDistance: number;    // Distance from apex to top circle
  totalSlantHeight: number; // Total slant height from apex to bottom
  
  // Unfolded pattern
  innerRadius: number;     // Inner radius of the unfolded sector
  outerRadius: number;     // Outer radius of the unfolded sector
  sectorAngle: number;     // Central angle of the sector (in degrees)
  sectorAngleRad: number;  // Central angle in radians
  
  // Additional useful measurements
  unfoldedArcLength: number; // Arc length at the outer edge
  materialWidth: number;     // Recommended material width for cutting
  materialHeight: number;    // Recommended material height for cutting
  
  // Validation
  isValid: boolean;
  validationMessage: string;
}

/**
 * Validate lampshade parameters
 */
export function validateParams(params: LampshadeParams): { valid: boolean; message: string } {
  if (params.topDiameter <= 0) {
    return { valid: false, message: "Top diameter must be greater than 0" };
  }
  if (params.bottomDiameter <= 0) {
    return { valid: false, message: "Bottom diameter must be greater than 0" };
  }
  if (params.height <= 0) {
    return { valid: false, message: "Height must be greater than 0" };
  }
  
  // Check if the lampshade forms a valid cone
  const topRadius = params.topDiameter / 2;
  const bottomRadius = params.bottomDiameter / 2;
  const radiusDiff = Math.abs(bottomRadius - topRadius);
  
  if (radiusDiff > params.height * 2) {
    return { valid: false, message: "Lampshade proportions are invalid (radius difference too large)" };
  }
  
  return { valid: true, message: "" };
}

/**
 * Calculate all lampshade unfolding parameters
 */
export function calculateLampshade(params: LampshadeParams): CalculationResult {
  const validation = validateParams(params);
  
  const result: CalculationResult = {
    topDiameter: params.topDiameter,
    bottomDiameter: params.bottomDiameter,
    height: params.height,
    topRadius: params.topDiameter / 2,
    bottomRadius: params.bottomDiameter / 2,
    slantHeight: 0,
    topCircumference: 0,
    bottomCircumference: 0,
    apexDistance: 0,
    totalSlantHeight: 0,
    innerRadius: 0,
    outerRadius: 0,
    sectorAngle: 0,
    sectorAngleRad: 0,
    unfoldedArcLength: 0,
    materialWidth: 0,
    materialHeight: 0,
    isValid: validation.valid,
    validationMessage: validation.message,
  };
  
  if (!validation.valid) {
    return result;
  }
  
  // Calculate basic measurements
  result.topRadius = params.topDiameter / 2;
  result.bottomRadius = params.bottomDiameter / 2;
  result.slantHeight = Math.sqrt(
    Math.pow(params.height, 2) + 
    Math.pow(result.bottomRadius - result.topRadius, 2)
  );
  
  result.topCircumference = 2 * Math.PI * result.topRadius;
  result.bottomCircumference = 2 * Math.PI * result.bottomRadius;
  
  // Calculate the apex of the cone (if extended)
  // Using similar triangles: apexDistance / topRadius = (apexDistance + slantHeight) / bottomRadius
  const radiusDiff = result.bottomRadius - result.topRadius;
  if (Math.abs(radiusDiff) < 0.001) {
    // Cylinder case - treat as a very large cone
    result.apexDistance = 10000; // Large number
    result.totalSlantHeight = 10000 + result.slantHeight;
  } else {
    result.apexDistance = (result.topRadius * result.slantHeight) / radiusDiff;
    result.totalSlantHeight = result.apexDistance + result.slantHeight;
  }
  
  // Calculate unfolded pattern dimensions
  result.innerRadius = result.apexDistance;
  result.outerRadius = result.totalSlantHeight;
  
  // Calculate the sector angle
  // The unfolded arc length equals the original circumference
  // Arc length = radius * angle, so angle = arc length / radius
  result.sectorAngleRad = result.bottomCircumference / result.outerRadius;
  result.sectorAngle = (result.sectorAngleRad * 180) / Math.PI;
  
  // Calculate material dimensions needed
  result.unfoldedArcLength = result.bottomCircumference;
  
  // For a sector, the bounding box dimensions are:
  // Width: 2 * outerRadius * sin(sectorAngle/2)
  // Height: outerRadius * (1 + cos(sectorAngle/2))
  const halfAngle = result.sectorAngleRad / 2;
  result.materialWidth = 2 * result.outerRadius * Math.sin(halfAngle);
  result.materialHeight = result.outerRadius * (1 + Math.cos(halfAngle));
  
  return result;
}

/**
 * Generate SVG path for the unfolded lampshade pattern
 */
export function generateUnfoldedPatternPath(result: CalculationResult): string {
  if (!result.isValid) return "";
  
  const innerR = result.innerRadius;
  const outerR = result.outerRadius;
  const angle = result.sectorAngleRad;
  
  // Start from the inner arc
  const startX = innerR * Math.sin(0);
  const startY = -innerR * Math.cos(0);
  
  // End angle for the sector
  const endX = innerR * Math.sin(angle);
  const endY = -innerR * Math.cos(angle);
  
  // Outer arc end points
  const outerStartX = outerR * Math.sin(0);
  const outerStartY = -outerR * Math.cos(0);
  
  const outerEndX = outerR * Math.sin(angle);
  const outerEndY = -outerR * Math.cos(angle);
  
  // Determine if we need the large arc flag (angle > 180 degrees)
  const largeArc = angle > Math.PI ? 1 : 0;
  
  // Build SVG path
  const path = [
    `M ${startX} ${startY}`, // Move to start of inner arc
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${endX} ${endY}`, // Inner arc
    `L ${outerEndX} ${outerEndY}`, // Line to outer arc end
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerStartX} ${outerStartY}`, // Outer arc (reverse)
    `Z`, // Close path
  ].join(" ");
  
  return path;
}

/**
 * Generate SVG path for the 3D representation of the lampshade
 */
export function generate3DLampshadeVisualization(
  result: CalculationResult,
  width: number = 300,
  height: number = 300
): string {
  if (!result.isValid) return "";
  
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / (result.bottomDiameter + 100);
  
  // Draw the lampshade from the side (cross-section)
  const topR = result.topRadius * scale;
  const bottomR = result.bottomRadius * scale;
  const h = result.height * scale;
  
  const topLeft = centerX - topR;
  const topRight = centerX + topR;
  const bottomLeft = centerX - bottomR;
  const bottomRight = centerX + bottomR;
  const topY = centerY - h / 2;
  const bottomY = centerY + h / 2;
  
  // Create a simple outline
  const path = [
    `M ${topLeft} ${topY}`, // Top left
    `L ${topRight} ${topY}`, // Top right
    `L ${bottomRight} ${bottomY}`, // Bottom right
    `L ${bottomLeft} ${bottomY}`, // Bottom left
    `Z`, // Close
  ].join(" ");
  
  return path;
}

/**
 * Format number to specified decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
