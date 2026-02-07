import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LampshadeParams } from "@/lib/lampshadeCalculator";

interface ParameterInputProps {
  params: LampshadeParams;
  onChange: (params: LampshadeParams) => void;
}

/**
 * ParameterInput Component
 * 
 * Design Philosophy: Modern Minimalist
 * - Clean input fields with clear labels
 * - Real-time validation feedback
 * - Organized into logical sections
 * - Ample spacing for visual breathing room
 */
export function ParameterInput({ params, onChange }: ParameterInputProps) {
  const handleChange = (field: keyof LampshadeParams, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...params,
      [field]: numValue,
    });
  };

  const inputClasses =
    "w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

  return (
    <Card className="p-8 bg-card shadow-sm border-border">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">灯罩参数</h2>
          <p className="text-sm text-muted-foreground">
            输入灯罩的尺寸信息，系统将自动计算展开图
          </p>
        </div>

        {/* Top Diameter */}
        <div className="space-y-2">
          <Label htmlFor="topDiameter" className="text-sm font-medium text-foreground">
            上口直径 (mm)
          </Label>
          <Input
            id="topDiameter"
            type="number"
            min="1"
            step="0.1"
            value={params.topDiameter || ""}
            onChange={(e) => handleChange("topDiameter", e.target.value)}
            placeholder="例如: 100"
            className={inputClasses}
          />
          <p className="text-xs text-muted-foreground mt-1">
            灯罩上端开口的直径
          </p>
        </div>

        {/* Bottom Diameter */}
        <div className="space-y-2">
          <Label htmlFor="bottomDiameter" className="text-sm font-medium text-foreground">
            下口直径 (mm)
          </Label>
          <Input
            id="bottomDiameter"
            type="number"
            min="1"
            step="0.1"
            value={params.bottomDiameter || ""}
            onChange={(e) => handleChange("bottomDiameter", e.target.value)}
            placeholder="例如: 200"
            className={inputClasses}
          />
          <p className="text-xs text-muted-foreground mt-1">
            灯罩下端开口的直径
          </p>
        </div>

        {/* Slant Height */}
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium text-foreground">
            斜高 (mm)
          </Label>
          <Input
            id="height"
            type="number"
            min="1"
            step="0.1"
            value={params.height || ""}
            onChange={(e) => handleChange("height", e.target.value)}
            placeholder="例如: 150"
            className={inputClasses}
          />
          <p className="text-xs text-muted-foreground mt-1">
            从上口到下口的斜边长度
          </p>
        </div>

        {/* Quick Presets */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3">快速预设</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onChange({ topDiameter: 100, bottomDiameter: 200, height: 150 })
              }
              className="px-3 py-2 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              标准灯罩
            </button>
            <button
              onClick={() =>
                onChange({ topDiameter: 80, bottomDiameter: 160, height: 120 })
              }
              className="px-3 py-2 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              小型灯罩
            </button>
            <button
              onClick={() =>
                onChange({ topDiameter: 150, bottomDiameter: 300, height: 200 })
              }
              className="px-3 py-2 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              大型灯罩
            </button>
            <button
              onClick={() =>
                onChange({ topDiameter: 120, bottomDiameter: 180, height: 100 })
              }
              className="px-3 py-2 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              浅型灯罩
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
