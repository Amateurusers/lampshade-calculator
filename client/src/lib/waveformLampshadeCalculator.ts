/**
 * Waveform Lampshade Calculator
 * Calculates unfolding patterns for lampshades with wavy edges
 */

export interface WaveformLampshadeInput {
  topDiameter: number;        // Top opening diameter (mm)
  bottomDiameter: number;     // Bottom opening diameter (mm)
  slantHeight: number;        // Slant height from top to bottom edge (mm)
  waveCount: number;          // Number of waves (2-8)
  waveHeight: number;         // Height of each wave (mm)
  waveType: "sine" | "cosine"; // Type of wave
}

export interface WaveformLampshadeResult {
  // Input parameters
  topDiameter: number;
  bottomDiameter: number;
  slantHeight: number;
  waveCount: number;
  waveHeight: number;
  waveType: string;
  
  // Derived measurements
  topRadius: number;
  bottomRadius: number;
  
  // Wave calculations
  topCircumference: number;   // Top opening circumference
  bottomCircumference: number; // Bottom opening circumference
  waveLength: number;         // Length of one wave cycle
  actualSlantHeight: number;  // Actual slant height including wave distortion
  
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
    waveType: input.waveType,
    topRadius: input.topDiameter / 2,
    bottomRadius: input.bottomDiameter / 2,
    topCircumference: 0,
    bottomCircumference: 0,
    waveLength: 0,
    actualSlantHeight: 0,
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

  if (input.waveCount < 2 || input.waveCount > 8) {
    result.isValid = false;
    result.validationMessage = "波数必须在 2-8 之间";
    return result;
  }

  if (input.waveHeight < 0) {
    result.isValid = false;
    result.validationMessage = "波高必须大于等于 0";
    return result;
  }

  // Calculate circumferences
  result.topCircumference = Math.PI * input.topDiameter;
  result.bottomCircumference = Math.PI * input.bottomDiameter;

  // Wave length is the circumference divided by wave count
  result.waveLength = result.topCircumference / input.waveCount;

  // Calculate actual arc length including wave distortion
  // For a sine wave: arc length ≈ wavelength * sqrt(1 + (amplitude * 2π / wavelength)²)
  const waveAmplitude = input.waveHeight;
  const waveFrequency = (2 * Math.PI) / result.waveLength;
  
  // Approximate arc length for sinusoidal wave
  const arcLengthFactor = Math.sqrt(1 + Math.pow(waveAmplitude * waveFrequency, 2));
  result.unfoldedTopArcLength = result.topCircumference * arcLengthFactor;
  
  // Similar calculation for bottom
  const bottomWaveLength = result.bottomCircumference / input.waveCount;
  const bottomWaveFrequency = (2 * Math.PI) / bottomWaveLength;
  const bottomArcLengthFactor = Math.sqrt(1 + Math.pow(waveAmplitude * bottomWaveFrequency, 2));
  result.unfoldedBottomArcLength = result.bottomCircumference * bottomArcLengthFactor;

  // Calculate actual slant height (including wave distortion in vertical direction)
  // The wave adds some vertical component
  result.actualSlantHeight = input.slantHeight > 0
    ? Math.sqrt(Math.pow(input.slantHeight, 2) + Math.pow(waveAmplitude, 2))
    : waveAmplitude;

  // Material dimensions
  result.materialWidth = Math.max(
    result.unfoldedTopArcLength,
    result.unfoldedBottomArcLength
  ) * 1.15; // Add 15% margin for waves
  result.materialHeight = result.actualSlantHeight * 1.15; // Add 15% margin

  // Calculate surface area (approximate as cylinder with wave correction)
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

  // Top edge with waves
  const topSegments = waveCount * 4; // 4 points per wave for smooth curve
  for (let i = 1; i <= topSegments; i++) {
    const x = (i / topSegments) * width;
    let y = 0;

    if (waveType === "sine") {
      y = waveHeight * Math.sin((i / topSegments) * waveCount * Math.PI * 2);
    } else {
      y = waveHeight * Math.cos((i / topSegments) * waveCount * Math.PI * 2);
    }

    pathData += ` L ${x} ${y}`;
  }

  // Right edge
  pathData += ` L ${width} ${height}`;

  // Bottom edge with waves (reversed)
  for (let i = topSegments; i >= 1; i--) {
    const x = (i / topSegments) * width;
    let y = height;

    if (waveType === "sine") {
      y = height - waveHeight * Math.sin((i / topSegments) * waveCount * Math.PI * 2);
    } else {
      y = height - waveHeight * Math.cos((i / topSegments) * waveCount * Math.PI * 2);
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
