import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParameterInput } from "@/components/ParameterInput";
import { CalculationResults } from "@/components/CalculationResults";
import { LampshadeVisualization } from "@/components/LampshadeVisualization";
import {
  LampshadeParams,
  calculateLampshade,
  CalculationResult,
} from "@/lib/lampshadeCalculator";
import { Download, RotateCcw, FileJson } from "lucide-react";
import { exportAsDXF } from "@/lib/dxfExporter";

/**
 * Home Page - Lampshade Calculator
 * 
 * Design Philosophy: Modern Minimalist
 * - Clean, organized layout with clear visual hierarchy
 * - Responsive design that works on all screen sizes
 * - Smooth interactions and real-time feedback
 * - Professional appearance with ample whitespace
 */
export default function Home() {
  const [params, setParams] = useState<LampshadeParams>({
    topDiameter: 100,
    bottomDiameter: 200,
    height: 150,
  });

  const [result, setResult] = useState<CalculationResult>(
    calculateLampshade(params)
  );

  const [visualizationTab, setVisualizationTab] = useState<"3d" | "unfolded">(
    "3d"
  );

  // Update calculation when parameters change
  useEffect(() => {
    setResult(calculateLampshade(params));
  }, [params]);

  // Handle reset to defaults
  const handleReset = () => {
    setParams({
      topDiameter: 100,
      bottomDiameter: 200,
      height: 150,
    });
  };

  // Handle export as JSON
  const handleExportJSON = () => {
    const exportData = {
      parameters: params,
      results: result,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lampshade-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle export as DXF
  const handleExportDXF = () => {
    try {
      exportAsDXF(result);
    } catch (error) {
      console.error("Failed to export DXF:", error);
    }
  };

  // Handle export as CSV
  const handleExportCSV = () => {
    const rows = [
      ["灯罩开料计算结果", ""],
      ["导出时间", new Date().toLocaleString()],
      ["", ""],
      ["参数", ""],
      ["上口直径 (mm)", params.topDiameter],
      ["下口直径 (mm)", params.bottomDiameter],
      ["灯罩高度 (mm)", params.height],
      ["", ""],
      ["计算结果", ""],
      ["上口周长 (mm)", result.topCircumference.toFixed(2)],
      ["下口周长 (mm)", result.bottomCircumference.toFixed(2)],
      ["斜高 (mm)", result.slantHeight.toFixed(2)],
      ["", ""],
      ["展开图参数", ""],
      ["内半径 (mm)", result.innerRadius.toFixed(2)],
      ["外半径 (mm)", result.outerRadius.toFixed(2)],
      ["扇形角度 (°)", result.sectorAngle.toFixed(2)],
      ["", ""],
      ["开料尺寸", ""],
      ["推荐材料宽度 (mm)", result.materialWidth.toFixed(1)],
      ["推荐材料高度 (mm)", result.materialHeight.toFixed(1)],
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lampshade-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">灯罩开料计算器</h1>
              <p className="text-sm text-muted-foreground mt-1">
                快速计算圆锥形灯罩的展开图尺寸
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Parameters */}
          <div className="lg:col-span-1">
            <ParameterInput params={params} onChange={setParams} />
          </div>

          {/* Right Column - Results and Visualization */}
          <div className="lg:col-span-2 space-y-8">
            {/* Visualization Tabs */}
            <Tabs
              value={visualizationTab}
              onValueChange={(value) =>
                setVisualizationTab(value as "3d" | "unfolded")
              }
            >
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="3d">立体图</TabsTrigger>
                <TabsTrigger value="unfolded">展开图</TabsTrigger>
              </TabsList>
              <TabsContent value="3d" className="mt-4">
                <LampshadeVisualization result={result} activeTab="3d" />
              </TabsContent>
              <TabsContent value="unfolded" className="mt-4">
                <LampshadeVisualization result={result} activeTab="unfolded" />
              </TabsContent>
            </Tabs>

            {/* Results */}
            <CalculationResults result={result} />

            {/* Export Section */}
            <div className="bg-card shadow-sm border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                导出结果
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={handleExportJSON}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </Button>
                <Button
                  onClick={handleExportCSV}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  onClick={handleExportDXF}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4" />
                  DXF
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                JSON/CSV 包含计算参数和结果，DXF 可导入 CAD 或激光切割机
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border mt-16">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-2">关于</h4>
              <p className="text-sm text-muted-foreground">
                灯罩开料计算器是一个专业的灯罩展开图计算工具，帮助制造商快速准确地计算圆锥形灯罩的开料尺寸。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">功能</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 实时参数计算</li>
                <li>• 3D 和展开图预览</li>
                <li>• 精确的数学计算</li>
                <li>• 支持导出结果</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">提示</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 所有尺寸单位为毫米 (mm)</li>
                <li>• 支持小数点输入</li>
                <li>• 快速预设可快速切换</li>
                <li>• 结果可导出为 JSON 或 CSV</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 灯罩开料计算器 | 专业制造工具</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
