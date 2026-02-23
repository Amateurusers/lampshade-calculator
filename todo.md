# 波浪形灯罩重新设计任务清单

## 用户需求（重新理解）
用户要求的波浪形灯罩应该是：
1. **将下口圆弧均分**：按波浪数量N将下口圆周均分成N段
2. **每段用相切圆弧组成**：每段由一个波谷圆弧和一个波峰圆弧组成，两者必须相切
3. **波谷半径由用户指定**：用户输入波谷圆弧的半径
4. **波峰半径自动计算**：根据波高和波谷半径计算波峰圆弧半径，确保相切
5. **上口默认无波浪**：上口应该是平滑的圆弧，不带波浪
6. **左右边缘对称**：展开图左右边缘形状必须一致

## UI修改任务
- [ ] 启用波数输入框（移除disabled）
- [ ] 启用波高输入框（移除disabled）
- [ ] 添加"波谷半径 (mm)"输入字段
- [ ] 修改"上口有波浪"默认值为false（unchecked）
- [ ] 修改"下口有波浪"默认值为true（checked）
- [ ] 更新WavyLampshadeParams类型，添加troughRadius字段

## 算法设计任务
### 相切圆弧波浪原理
对于展开后的扇形环：
- 下口是半径为R_bottom的圆弧
- 将这个圆弧均分成N段（N=波浪数）
- 每段用两个圆弧组成：
  * 波谷圆弧：半径r_trough（用户指定），圆心在基准圆弧的内侧
  * 波峰圆弧：半径r_peak（计算得出），圆心在基准圆弧的外侧
  * 两个圆弧在切点处相切

### 需要计算的参数
- [ ] 每段的角度范围
- [ ] 波谷圆弧的圆心位置
- [ ] 波峰圆弧的圆心位置和半径
- [ ] 切点位置
- [ ] DXF ARC的起止角度

## 代码实现任务
- [ ] 修改 client/src/types/lampshade.ts：添加troughRadius字段
- [ ] 修改 client/src/components/WavyLampshadeForm.tsx：
  - 启用波数和波高输入
  - 添加波谷半径输入
  - 修改默认值
- [ ] 重写 client/src/lib/dxfExporter.ts 中的generateWavyLampshadeDXF函数
- [ ] 重写 client/src/components/LampshadeVisualization.tsx 中的波浪渲染逻辑
- [ ] 更新 client/src/utils/calculations.ts 中的calculateWavyLampshade函数

## 测试验证任务
- [ ] 导出DXF，在CAD中检查圆弧是否相切
- [ ] 验证左右边缘是否对称
- [ ] 检查波高是否符合输入值
- [ ] 确认上口无波浪时的正确性
- [ ] 测试不同波数和波谷半径的组合
