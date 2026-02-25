import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

interface CalculationResultsProps {
  result: any; // Support any result type
}

/**
 * CalculationResults Component
 * 
 * Design Philosophy: Modern Minimalist
 * - Organized data presentation with clear hierarchy
 * - Color-coded sections for different measurement types
 * - Easy-to-scan layout with consistent spacing
 * - Validation feedback with icons
 */
export function CalculationResults({ result }: CalculationResultsProps) {
  if (!result.isValid) {
    return (
      <Card className="p-8 bg-card shadow-sm border-border">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">
              参数错误
            </h3>
            <p className="text-sm text-foreground">{result.validationMessage}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">参数有效，计算完成</span>
      </div>


      {/* Circumferences */}
      {result.topCircumference !== undefined && (
        <Card className="p-4 bg-card shadow-sm border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">周长计算</h3>
          <div className="grid grid-cols-2 gap-3">
            <ResultItem
              label="上口周长"
              value={formatNumber(result.topCircumference, 2)}
              unit="mm"
            />
            <ResultItem
              label="下口周长"
              value={formatNumber(result.bottomCircumference, 2)}
              unit="mm"
            />
          </div>
        </Card>
      )}

      {/* Polygon-specific results */}
      {result.sides !== undefined && (
        <Card className="p-4 bg-card shadow-sm border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">多边形参数</h3>
          <div className="grid grid-cols-2 gap-3">
            <ResultItem
              label="边数"
              value={String(result.sides)}
              unit=""
            />
            <ResultItem
              label="中心角"
              value={formatNumber(result.topCentralAngle, 2)}
              unit="°"
            />
            <ResultItem
              label="上边长"
              value={formatNumber(result.topSideLength, 2)}
              unit="mm"
            />
            <ResultItem
              label="下边长"
              value={formatNumber(result.bottomSideLength, 2)}
              unit="mm"
            />
          </div>
        </Card>
      )}

      {/* Waveform-specific results */}
      {result.waveCount !== undefined && (
        <Card className="p-4 bg-card shadow-sm border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">波浪形参数</h3>
          <div className="grid grid-cols-2 gap-3">
            <ResultItem
              label="波数"
              value={String(result.waveCount)}
              unit=""
            />
            <ResultItem
              label="波高"
              value={formatNumber(result.waveHeight, 2)}
              unit="mm"
            />
            <ResultItem
              label="波形类型"
              value={result.waveType === "sine" ? "正弦波" : "余弦波"}
              unit=""
            />
            <ResultItem
              label="波长"
              value={formatNumber(result.waveLength, 2)}
              unit="mm"
            />
          </div>
        </Card>
      )}

      {/* Unfolding Pattern (Cone only) */}
      {result.innerRadius !== undefined && (
        <Card className="p-4 bg-secondary shadow-sm border-border">
          <h3 className="text-sm font-semibold text-secondary-foreground mb-3">
            展开图参数
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <ResultItem
              label="内半径"
              value={formatNumber(result.innerRadius, 2)}
              unit="mm"
              highlight
            />
            <ResultItem
              label="外半径"
              value={formatNumber(result.outerRadius, 2)}
              unit="mm"
              highlight
            />
            <ResultItem
              label="扇形角度"
              value={formatNumber(result.sectorAngle, 2)}
              unit="°"
              highlight
            />
            <ResultItem
              label="弧长"
              value={formatNumber(result.unfoldedArcLength, 2)}
              unit="mm"
              highlight
            />
          </div>
        </Card>
      )}

      {/* Material Dimensions */}
      {result.materialWidth !== undefined && (
        <Card className="p-4 bg-card shadow-sm border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            开料尺寸
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-xs font-medium text-foreground">推荐材料宽度</span>
              <span className="text-base font-bold text-primary">
                {formatNumber(result.materialWidth, 1)} mm
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-xs font-medium text-foreground">推荐材料高度</span>
              <span className="text-base font-bold text-primary">
                {formatNumber(result.materialHeight, 1)} mm
              </span>
            </div>
          </div>
        </Card>
      )}


      {/* Surface Area */}
      {result.totalSurfaceArea !== undefined && (
        <Card className="p-4 bg-card shadow-sm border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">表面积</h3>
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <span className="text-xs font-medium text-foreground">总表面积</span>
            <span className="text-base font-bold text-primary">
              {formatNumber(result.totalSurfaceArea, 2)} mm²
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual result item component
 */
function ResultItem({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "p-2 bg-primary/5 rounded-lg" : ""}>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold text-primary">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

/**
 * Format number to specified decimal places
 */
function formatNumber(num: number, decimals: number): string {
  if (typeof num !== "number" || isNaN(num)) return "0";
  return num.toFixed(decimals);
}
