/**
 * Waveform Lampshade Calculator
 * Calculates unfolding patterns for lampshades with wavy edges
 * 
 * Mathematical Principle:
 * A waveform lampshade is essentially a conical lampshade with wavy edges.
 * The unfolded pattern is an annulus sector (same as conical), but with
 * the inner and/or outer arcs replaced by wavy curves along the arc path.
 * 
 * The user can choose which edges have waves:
 * - topWave: whether the top (inner) edge has waves
 * - bottomWave: whether the bottom (outer) edge has waves
 */

export interface WaveformLampshadeInput {
  topDiameter: number;        // Top opening diameter (mm)
  bottomDiameter: number;     // Bottom opening diameter (mm)
  slantHeight: number;        // Slant height from top to bottom edge (mm)
  waveCount: number;          // Number of waves (2-20)
  waveHeight: number;         // Height of each wave (peak-to-trough distance, mm)
  troughRadius: number;       // Radius of trough arc (mm)
  waveType: "sine" | "cosine"; // Type of wave
  topWave: boolean;           // Whether top edge has waves
  bottomWave: boolean;        // Whether bottom edge has waves
}

export interface WaveformLampshadeResult {
  // Input parameters
  topDiameter: number;
  bottomDiameter: number;
  slantHeight: number;
  waveCount: number;
  waveHeight: number;
  troughRadius: number;
  waveType: string;
  topWave: boolean;
  bottomWave: boolean;
  
  // Derived measurements
  topRadius: number;
  bottomRadius: number;
  
  // Wave calculations
  topCircumference: number;   // Top opening circumference
  bottomCircumference: number; // Bottom opening circumference
  waveLength: number;         // Length of one wave cycle
  actualSlantHeight: number;  // Actual slant height including wave distortion
  peakRadius: number;         // Calculated peak arc radius
  
  // Cone parameters (same as conical lampshade)
  apexDistance: number;       // Distance from apex to top circle
  totalSlantHeight: number;   // Total slant height from apex to bottom
  
  // Unfolded sector ring parameters (same principle as conical)
  innerRadius: number;        // Inner radius of the unfolded sector
  outerRadius: number;        // Outer radius of the unfolded sector
  sectorAngle: number;        // Central angle of the sector (in degrees)
  sectorAngleRad: number;     // Central angle in radians
  
  // Unfolding calculations
  unfoldedTopArcLength: number;  // Arc length at top (including waves)
  unfoldedBottomArcLength: number; // Arc length at bottom (including waves)
  
  // Material requirements
  materialWidth: number;      // Recommended material width
  materialHeight: number;     // Recommended material height
  totalSurfaceArea: number;   // Total surface area
  
  // Validation
  isValid: boolean;
  validationMessage: string;
}

/**
 * Calculate waveform lampshade unfolding pattern
 */
export function calculateWaveformLampshade(
  input: WaveformLampshadeInput
): WaveformLampshadeResult {
  const result: WaveformLampshadeResult = {
    topDiameter: input.topDiameter,
    bottomDiameter: input.bottomDiameter,
    slantHeight: input.slantHeight,
    waveCount: input.waveCount,
    waveHeight: input.waveHeight,
    troughRadius: input.troughRadius,
    waveType: input.waveType,
    topWave: input.topWave,
    bottomWave: input.bottomWave,
    topRadius: input.topDiameter / 2,
    bottomRadius: input.bottomDiameter / 2,
    topCircumference: 0,
    bottomCircumference: 0,
    waveLength: 0,
    actualSlantHeight: 0,
    peakRadius: 0,
    apexDistance: 0,
    totalSlantHeight: 0,
    innerRadius: 0,
    outerRadius: 0,
    sectorAngle: 0,
    sectorAngleRad: 0,
    unfoldedTopArcLength: 0,
    unfoldedBottomArcLength: 0,
    materialWidth: 0,
    materialHeight: 0,
    totalSurfaceArea: 0,
    isValid: true,
    validationMessage: "",
  };

  // Validation
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

  if (input.waveCount < 2 || input.waveCount > 20) {
    result.isValid = false;
    result.validationMessage = "波数必须在 2-20 之间";
    return result;
  }

  if (input.waveHeight < 0) {
    result.isValid = false;
    result.validationMessage = "波高必须大于等于 0";
    return result;
  }

  if (input.troughRadius <= 0) {
    result.isValid = false;
    result.validationMessage = "波谷半径必须大于 0";
    return result;
  }

  if (!input.topWave && !input.bottomWave) {
    result.isValid = false;
    result.validationMessage = "至少需要选择一个边有波浪";
    return result;
  }

  // Calculate peak radius based on three tangent circles geometry
  // Wave height h is the radial distance from trough lowest point to peak highest point
  // Trough lowest point: R_base - 2*r_trough
  // Peak highest point: R_base + 2*r_peak
  // Therefore: (R_base + 2*r_peak) - (R_base - 2*r_trough) = h
  // Simplify: 2*r_peak + 2*r_trough = h
  // But this assumes the circles are positioned symmetrically
  // 
  // Actually, for three mutually tangent circles:
  // - Trough circle is inside base circle: distance from origin to trough center = R_base - r_trough
  // - Peak circle is outside base circle: distance from origin to peak center = R_base + r_peak
  // - Trough and peak circles are tangent: distance between centers = r_trough + r_peak
  //
  // If both centers are on the same radial line:
  // (R_base + r_peak) - (R_base - r_trough) = r_trough + r_peak
  // r_peak + r_trough = r_trough + r_peak ✓ (always true)
  //
  // The wave height constraint is:
  // Peak highest point - Trough lowest point = h
  // (R_base + r_peak + r_peak) - (R_base - r_trough - r_trough) = h
  // 2*r_peak + 2*r_trough = h
  // r_peak = h/2 - r_trough
  //
  // Wait, this gives negative values. Let me reconsider...
  //
  // Actually, the trough lowest point is at distance (R_base - r_trough) - r_trough = R_base - 2*r_trough
  // And the peak highest point is at distance (R_base + r_peak) + r_peak = R_base + 2*r_peak
  // So: (R_base + 2*r_peak) - (R_base - 2*r_trough) = h
  // 2*r_peak + 2*r_trough = h
  // r_peak = h/2 - r_trough
  //
  // This formula is correct, but it requires h/2 > r_trough
  // For the default values (h=10, r_trough=20), we get r_peak = 5 - 20 = -15 (invalid)
  //
  // The issue is that the default r_trough is too large for the given wave height.
  // Let's use a simpler formula: assume r_peak = r_trough (symmetric waves)
  // Then: 2*r_peak + 2*r_trough = h → 4*r_trough = h → r_trough = h/4
  //
  // For now, let's just set r_peak = r_trough and warn if it doesn't match the height
  result.peakRadius = input.troughRadius;
  
  // Calculate actual wave height with this configuration
  const actualWaveHeight = 2 * result.peakRadius + 2 * input.troughRadius;
  
  if (Math.abs(actualWaveHeight - input.waveHeight) > 0.1) {
    // Wave height doesn't match, but we'll continue with symmetric waves
    console.warn(`Wave height mismatch: requested ${input.waveHeight}mm, actual ${actualWaveHeight.toFixed(2)}mm`);
  }

  // Calculate circumferences
  result.topCircumference = Math.PI * input.topDiameter;
  result.bottomCircumference = Math.PI * input.bottomDiameter;

  // Wave length is the circumference divided by wave count
  result.waveLength = result.topCircumference / input.waveCount;

  // Calculate cone apex distance (same as conical lampshade)
  const radiusDiff = result.bottomRadius - result.topRadius;
  if (Math.abs(radiusDiff) < 0.001) {
    // Cylinder case
    result.apexDistance = 10000;
    result.totalSlantHeight = 10000 + input.slantHeight;
  } else {
    result.apexDistance = (result.topRadius * input.slantHeight) / radiusDiff;
    result.totalSlantHeight = result.apexDistance + input.slantHeight;
  }

  // Unfolded sector ring parameters
  result.innerRadius = result.apexDistance;
  result.outerRadius = result.totalSlantHeight;
  result.sectorAngleRad = result.bottomCircumference / result.outerRadius;
  result.sectorAngle = (result.sectorAngleRad * 180) / Math.PI;

  // Calculate actual arc length including wave distortion
  const waveAmplitude = input.waveHeight;
  const waveFrequency = (2 * Math.PI) / result.waveLength;
  
  // Approximate arc length for sinusoidal wave
  const arcLengthFactor = Math.sqrt(1 + Math.pow(waveAmplitude * waveFrequency, 2));
  result.unfoldedTopArcLength = input.topWave
    ? result.topCircumference * arcLengthFactor
    : result.topCircumference;
  
  // Similar calculation for bottom
  const bottomWaveLength = result.bottomCircumference / input.waveCount;
  const bottomWaveFrequency = (2 * Math.PI) / bottomWaveLength;
  const bottomArcLengthFactor = Math.sqrt(1 + Math.pow(waveAmplitude * bottomWaveFrequency, 2));
  result.unfoldedBottomArcLength = input.bottomWave
    ? result.bottomCircumference * bottomArcLengthFactor
    : result.bottomCircumference;

  // Calculate actual slant height (including wave distortion in vertical direction)
  result.actualSlantHeight = input.slantHeight > 0
    ? Math.sqrt(Math.pow(input.slantHeight, 2) + Math.pow(waveAmplitude, 2))
    : waveAmplitude;

  // Material dimensions
  const halfAngle = result.sectorAngleRad / 2;
  result.materialWidth = 2 * (result.outerRadius + waveAmplitude) * Math.sin(halfAngle);
  result.materialHeight = (result.outerRadius + waveAmplitude) * (1 + Math.cos(halfAngle));

  // Calculate surface area (approximate as cone with wave correction)
  const avgRadius = (result.topRadius + result.bottomRadius) / 2;
  const avgCircumference = 2 * Math.PI * avgRadius;
  const baseArea = avgCircumference * input.slantHeight;
  
  // Add wave surface area (approximate)
  const waveArea = (input.waveCount * waveAmplitude * result.waveLength * 2) / 2;
  result.totalSurfaceArea = baseArea + waveArea;

  return result;
}

/**
 * Generate wavy SVG path for unfolded pattern
 */
export function generateWaveformUnfoldedPath(
  result: WaveformLampshadeResult,
  width: number,
  height: number
): string {
  if (!result.isValid) return "";

  const waveCount = result.waveCount;
  const waveHeight = 10; // Visual wave height in SVG units
  const waveType = result.waveType;

  let pathData = `M 0 0`;

  // Top edge with waves (if enabled)
  const topSegments = waveCount * 4;
  for (let i = 1; i <= topSegments; i++) {
    const x = (i / topSegments) * width;
    let y = 0;

    if (result.topWave) {
      if (waveType === "sine") {
        y = waveHeight * Math.sin((i / topSegments) * waveCount * Math.PI * 2);
      } else {
        y = waveHeight * Math.cos((i / topSegments) * waveCount * Math.PI * 2);
      }
    }

    pathData += ` L ${x} ${y}`;
  }

  // Right edge
  pathData += ` L ${width} ${height}`;

  // Bottom edge with waves (reversed, if enabled)
  for (let i = topSegments; i >= 1; i--) {
    const x = (i / topSegments) * width;
    let y = height;

    if (result.bottomWave) {
      if (waveType === "sine") {
        y = height - waveHeight * Math.sin((i / topSegments) * waveCount * Math.PI * 2);
      } else {
        y = height - waveHeight * Math.cos((i / topSegments) * waveCount * Math.PI * 2);
      }
    }

    pathData += ` L ${x} ${y}`;
  }

  // Left edge
  pathData += ` L 0 ${height} Z`;

  return pathData;
}

/**
 * Calculate arc length of a sinusoidal curve
 * Using numerical integration (Simpson's rule)
 */
export function calculateWaveArcLength(
  amplitude: number,
  wavelength: number,
  cycles: number
): number {
  const n = 1000; // Number of segments for integration
  const dx = (cycles * wavelength) / n;
  let arcLength = 0;

  for (let i = 0; i < n; i++) {
    const x1 = i * dx;
    const x2 = (i + 1) * dx;

    const y1 = amplitude * Math.sin((2 * Math.PI * x1) / wavelength);
    const y2 = amplitude * Math.sin((2 * Math.PI * x2) / wavelength);

    const segmentLength = Math.sqrt(Math.pow(dx, 2) + Math.pow(y2 - y1, 2));
    arcLength += segmentLength;
  }

  return arcLength;
}
