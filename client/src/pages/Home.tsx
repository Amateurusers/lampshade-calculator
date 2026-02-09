import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParameterInput } from "@/components/ParameterInput";
import { CalculationResults } from "@/components/CalculationResults";
import { LampshadeVisualization } from "@/components/LampshadeVisualization";
import {
  LampshadeParams,
  calculateLampshade,
  CalculationResult,
} from "@/lib/lampshadeCalculator";
import {
  PolygonLampshadeInput,
  calculatePolygonLampshade,
  PolygonLampshadeResult,
} from "@/lib/polygonLampshadeCalculator";
import {
  WaveformLampshadeInput,
  calculateWaveformLampshade,
  WaveformLampshadeResult,
} from "@/lib/waveformLampshadeCalculator";
import { Download, RotateCcw, FileJson } from "lucide-react";
import { exportAsDXF } from "@/lib/dxfExporter";

type LampshadeType = "cone" | "polygon" | "waveform";

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
  const [lampshadeType, setLampshadeType] = useState<LampshadeType>("cone");

  // Cone parameters
  const [coneParams, setConeParams] = useState<LampshadeParams>({
    topDiameter: 100,
    bottomDiameter: 200,
    height: 150,
  });

  // Polygon parameters
  const [polygonParams, setPolygonParams] = useState<PolygonLampshadeInput>({
    sides: 6,
    topDiameter: 100,
    bottomDiameter: 200,
    slantHeight: 150,
  });

  // Waveform parameters
  const [waveformParams, setWaveformParams] = useState<WaveformLampshadeInput>({
    topDiameter: 100,
    bottomDiameter: 200,
    slantHeight: 150,
    waveCount: 4,
    waveHeight: 10,
    waveType: "sine",
    topWave: true,
    bottomWave: true,
  });

  // Results
  const [coneResult, setConeResult] = useState<CalculationResult>(
    calculateLampshade(coneParams)
  );
  const [polygonResult, setPolygonResult] = useState<PolygonLampshadeResult>(
    calculatePolygonLampshade(polygonParams)
  );
  const [waveformResult, setWaveformResult] = useState<WaveformLampshadeResult>(
    calculateWaveformLampshade(waveformParams)
  );

  const [visualizationTab, setVisualizationTab] = useState<"3d" | "unfolded">(
    "3d"
  );

  // Update calculations when parameters change
  useEffect(() => {
    setConeResult(calculateLampshade(coneParams));
  }, [coneParams]);

  useEffect(() => {
    setPolygonResult(calculatePolygonLampshade(polygonParams));
  }, [polygonParams]);

  useEffect(() => {
    setWaveformResult(calculateWaveformLampshade(waveformParams));
  }, [waveformParams]);

  // Get current result based on lampshade type
  const getCurrentResult = () => {
    switch (lampshadeType) {
      case "cone":
        return coneResult;
      case "polygon":
        return polygonResult as any;
      case "waveform":
        return waveformResult as any;
      default:
        return coneResult;
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    switch (lampshadeType) {
      case "cone":
        setConeParams({
          topDiameter: 100,
          bottomDiameter: 200,
          height: 150,
        });
        break;
      case "polygon":
        setPolygonParams({
          sides: 6,
          topDiameter: 100,
          bottomDiameter: 200,
          slantHeight: 150,
        });
        break;
      case "waveform":
        setWaveformParams({
          topDiameter: 100,
          bottomDiameter: 200,
          slantHeight: 150,
          waveCount: 4,
          waveHeight: 10,
          waveType: "sine",
          topWave: true,
          bottomWave: true,
        });
        break;
    }
  };

  // Handle export as JSON
  const handleExportJSON = () => {
    const exportData = {
      lampshadeType,
      parameters:
        lampshadeType === "cone"
          ? coneParams
          : lampshadeType === "polygon"
            ? polygonParams
            : waveformParams,
      results: getCurrentResult(),
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
      if (lampshadeType === "cone") {
        exportAsDXF(coneResult);
      } else if (lampshadeType === "polygon") {
        exportAsDXF(polygonResult);
      } else if (lampshadeType === "waveform") {
        exportAsDXF(waveformResult);
      }
    } catch (error) {
      console.error("Failed to export DXF:", error);
    }
  };

  // Handle export as CSV
  const handleExportCSV = () => {
    const result = getCurrentResult();
    const rows: string[][] = [
      ["灯罩开料计算结果", ""],
      ["灯罩类型", lampshadeType],
      ["导出时间", new Date().toLocaleString()],
      ["", ""],
    ];

    if (lampshadeType === "cone") {
      rows.push(
        ["参数", ""],
        ["上口直径 (mm)", String(coneParams.topDiameter)],
        ["下口直径 (mm)", String(coneParams.bottomDiameter)],
        ["斜高 (mm)", String(coneParams.height)]
      );
    } else if (lampshadeType === "polygon") {
      rows.push(
        ["参数", ""],
        ["边数", String(polygonParams.sides)],
        ["上口直径 (mm)", String(polygonParams.topDiameter)],
        ["下口直径 (mm)", String(polygonParams.bottomDiameter)],
        ["斜高 (mm)", String(polygonParams.slantHeight)]
      );
    } else {
      rows.push(
        ["参数", ""],
        ["上口直径 (mm)", String(waveformParams.topDiameter)],
        ["下口直径 (mm)", String(waveformParams.bottomDiameter)],
        ["斜高 (mm)", String(waveformParams.slantHeight)],
        ["波数", String(waveformParams.waveCount)],
        ["波高 (mm)", String(waveformParams.waveHeight)],
        ["上口波浪", waveformParams.topWave ? "是" : "否"],
        ["下口波浪", waveformParams.bottomWave ? "是" : "否"]
      );
    }

    rows.push(
      ["", ""],
      ["计算结果", ""],
      ["上口直径 (mm)", String(result.topDiameter)],
      ["下口直径 (mm)", String(result.bottomDiameter)]
    );

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lampshade-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTypeLabel = (type: LampshadeType) => {
    switch (type) {
      case "cone":
        return "圆锥形";
      case "polygon":
        return "多边形";
      case "waveform":
        return "波浪形";
      default:
        return "";
    }
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
                支持圆锥形、多边形和波浪形灯罩的展开图计算
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
        {/* Lampshade Type Selector */}
        <div className="mb-8 bg-card shadow-sm border border-border rounded-lg p-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            灯罩类型
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["cone", "polygon", "waveform"] as LampshadeType[]).map((type) => (
              <button
                key={type}
                onClick={() => setLampshadeType(type)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  lampshadeType === type
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-foreground">{getTypeLabel(type)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {type === "cone" && "标准圆锥形灯罩"}
                  {type === "polygon" && "多边形灯罩"}
                  {type === "waveform" && "波浪形灯罩"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Parameters */}
          <div className="lg:col-span-1">
            {lampshadeType === "cone" && (
              <ParameterInput params={coneParams} onChange={setConeParams} />
            )}
            {lampshadeType === "polygon" && (
              <div className="bg-card shadow-sm border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">多边形灯罩参数</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    边数
                  </label>
                  <Select
                    value={String(polygonParams.sides)}
                    onValueChange={(val) =>
                      setPolygonParams({
                        ...polygonParams,
                        sides: parseInt(val),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 3).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} 边形
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    上口直径 (mm)
                  </label>
                  <input
                    type="number"
                    value={polygonParams.topDiameter}
                    onChange={(e) =>
                      setPolygonParams({
                        ...polygonParams,
                        topDiameter: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    下口直径 (mm)
                  </label>
                  <input
                    type="number"
                    value={polygonParams.bottomDiameter}
                    onChange={(e) =>
                      setPolygonParams({
                        ...polygonParams,
                        bottomDiameter: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    斜高 (mm)
                  </label>
                  <input
                    type="number"
                    value={polygonParams.slantHeight}
                    onChange={(e) =>
                      setPolygonParams({
                        ...polygonParams,
                        slantHeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
              </div>
            )}
            {lampshadeType === "waveform" && (
              <div className="bg-card shadow-sm border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">波浪形灯罩参数</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    上口直径 (mm)
                  </label>
                  <input
                    type="number"
                    value={waveformParams.topDiameter}
                    onChange={(e) =>
                      setWaveformParams({
                        ...waveformParams,
                        topDiameter: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    下口直径 (mm)
                  </label>
                  <input
                    type="number"
                    value={waveformParams.bottomDiameter}
                    onChange={(e) =>
                      setWaveformParams({
                        ...waveformParams,
                        bottomDiameter: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    斜高 (mm)
                  </label>
                  <input
                    type="number"
                    value={waveformParams.slantHeight}
                    onChange={(e) =>
                      setWaveformParams({
                        ...waveformParams,
                        slantHeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    波数
                  </label>
                  <input
                    type="number"
                    value={waveformParams.waveCount}
                    onChange={(e) =>
                      setWaveformParams({
                        ...waveformParams,
                        waveCount: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    波高 (mm)
                  </label>
                  <input
                    type="number"
                    value={waveformParams.waveHeight}
                    onChange={(e) =>
                      setWaveformParams({
                        ...waveformParams,
                        waveHeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    波形类型
                  </label>
                  <Select
                    value={waveformParams.waveType}
                    onValueChange={(val) =>
                      setWaveformParams({
                        ...waveformParams,
                        waveType: val as "sine" | "cosine",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sine">正弦波</SelectItem>
                      <SelectItem value="cosine">余弦波</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Wave edge toggles */}
                <div className="border-t border-border pt-4 mt-2">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    波浪边选择
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waveformParams.topWave}
                        onChange={(e) =>
                          setWaveformParams({
                            ...waveformParams,
                            topWave: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">上口有波浪</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waveformParams.bottomWave}
                        onChange={(e) =>
                          setWaveformParams({
                            ...waveformParams,
                            bottomWave: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">下口有波浪</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
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
                <LampshadeVisualization
                  result={getCurrentResult()}
                  activeTab="3d"
                />
              </TabsContent>
              <TabsContent value="unfolded" className="mt-4">
                <LampshadeVisualization
                  result={getCurrentResult()}
                  activeTab="unfolded"
                />
              </TabsContent>
            </Tabs>

            {/* Results */}
            <CalculationResults result={getCurrentResult()} />

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
                灯罩开料计算器是一个专业的灯罩展开图计算工具，支持圆锥形、多边形和波浪形灯罩，帮助制造商快速准确地计算开料尺寸。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">功能</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 支持多种灯罩形状</li>
                <li>• 实时参数计算</li>
                <li>• 3D 和展开图预览</li>
                <li>• 精确的数学计算</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">提示</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 所有尺寸单位为毫米 (mm)</li>
                <li>• 支持小数点输入</li>
                <li>• 结果可导出为 JSON 或 CSV</li>
                <li>• 圆锥形灯罩支持 DXF 导出</li>
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
