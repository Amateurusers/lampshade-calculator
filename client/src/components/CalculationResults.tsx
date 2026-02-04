import { Card } from "@/components/ui/card";
import { CalculationResult, formatNumber } from "@/lib/lampshadeCalculator";
import { AlertCircle, CheckCircle } from "lucide-react";

interface CalculationResultsProps {
  result: CalculationResult;
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
    <div className="space-y-6">
      {/* Validation Status */}
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">参数有效，计算完成</span>
      </div>

      {/* Basic Measurements */}
      <Card className="p-6 bg-card shadow-sm border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">基本尺寸</h3>
        <div className="grid grid-cols-2 gap-6">
          <ResultItem
            label="上口半径"
            value={formatNumber(result.topRadius, 2)}
            unit="mm"
          />
          <ResultItem
            label="下口半径"
            value={formatNumber(result.bottomRadius, 2)}
            unit="mm"
          />
          <ResultItem
            label="灯罩高度"
            value={formatNumber(result.height, 2)}
            unit="mm"
          />
          <ResultItem
            label="斜高"
            value={formatNumber(result.slantHeight, 2)}
            unit="mm"
          />
        </div>
      </Card>

      {/* Circumferences */}
      <Card className="p-6 bg-card shadow-sm border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">周长计算</h3>
        <div className="grid grid-cols-2 gap-6">
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

      {/* Unfolding Pattern */}
      <Card className="p-6 bg-secondary shadow-sm border-border">
        <h3 className="text-lg font-semibold text-secondary-foreground mb-4">
          展开图参数
        </h3>
        <div className="grid grid-cols-2 gap-6">
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

      {/* Material Dimensions */}
      <Card className="p-6 bg-card shadow-sm border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          开料尺寸
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <span className="text-sm font-medium text-foreground">推荐材料宽度</span>
            <span className="text-xl font-bold text-primary">
              {formatNumber(result.materialWidth, 1)} mm
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <span className="text-sm font-medium text-foreground">推荐材料高度</span>
            <span className="text-xl font-bold text-primary">
              {formatNumber(result.materialHeight, 1)} mm
            </span>
          </div>
        </div>
      </Card>

      {/* Cone Apex Info */}
      <Card className="p-6 bg-card shadow-sm border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">圆锥顶点</h3>
        <div className="grid grid-cols-2 gap-6">
          <ResultItem
            label="顶点距离"
            value={
              result.apexDistance > 1000
                ? "∞ (圆柱)"
                : formatNumber(result.apexDistance, 2)
            }
            unit="mm"
          />
          <ResultItem
            label="总斜高"
            value={
              result.totalSlantHeight > 1000
                ? "∞ (圆柱)"
                : formatNumber(result.totalSlantHeight, 2)
            }
            unit="mm"
          />
        </div>
      </Card>
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
    <div className={highlight ? "p-3 bg-primary/5 rounded-lg" : ""}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-primary">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
