# 三圆相切波浪算法

## 几何关系

给定：
- 基准圆半径：R_base（展开图的外圆半径）
- 波谷圆半径：r_trough（用户指定）
- 波高：h（用户指定）

求：
- 波峰圆半径：r_peak
- 波谷圆圆心位置
- 波峰圆圆心位置

## 约束条件

1. **波谷圆与基准圆内切**：
   - 波谷圆圆心到原点的距离 = R_base - r_trough
   - 波谷圆的最低点到原点的距离 = R_base - 2*r_trough

2. **波峰圆与基准圆外切**：
   - 波峰圆圆心到原点的距离 = R_base + r_peak
   - 波峰圆的最高点到原点的距离 = R_base + 2*r_peak

3. **波高约束**：
   - 波谷最低点到波峰最高点的径向距离 = h
   - (R_base + 2*r_peak) - (R_base - 2*r_trough) = h
   - 2*r_peak + 2*r_trough = h
   - **r_peak = h/2 - r_trough**

4. **波谷圆和波峰圆相切**：
   - 两圆心距离 = r_trough + r_peak
   - 设波谷圆心在角度 θ1，波峰圆心在角度 θ2
   - 距离 = sqrt[(R_base - r_trough)² + (R_base + r_peak)² - 2*(R_base - r_trough)*(R_base + r_peak)*cos(θ2 - θ1)]
   - 这个距离应该等于 r_trough + r_peak

## 简化模型：对称波浪

为了简化，我们假设每个波浪是对称的：
- 波谷圆心和波峰圆心在同一条径向线上
- 这条径向线是该波浪段的中心线

对于第i个波浪（i = 0, 1, ..., N-1）：
- 中心角度：θ_i = θ_start + (i + 0.5) * (θ_total / N)
- 波谷圆心：(R_base - r_trough) * (cos(θ_i), sin(θ_i))
- 波峰圆心：(R_base + r_peak) * (cos(θ_i), sin(θ_i))

## 圆弧角度范围

对于每个圆弧，需要计算它在DXF中的起止角度（相对于圆心）。

### 波谷圆弧
- 圆心：C_trough = (R_base - r_trough) * (cos(θ_i), sin(θ_i))
- 需要找到圆弧的两个端点，使得：
  1. 端点在波谷圆上
  2. 端点到原点的距离在合理范围内（接近R_base）

### 波峰圆弧
- 圆心：C_peak = (R_base + r_peak) * (cos(θ_i), sin(θ_i))
- 类似地找到两个端点

## 相切点计算

波谷圆和波峰圆的切点在两圆心连线上。

设波谷圆心为 C1，波峰圆心为 C2，则切点 P 满足：
- P 在 C1C2 连线上
- |P - C1| = r_trough
- |P - C2| = r_peak

由于 C1 和 C2 在同一条径向线上：
- P = C1 + r_trough * (C2 - C1) / |C2 - C1|
- |C2 - C1| = (R_base + r_peak) - (R_base - r_trough) = r_peak + r_trough

所以：
- P = C1 + r_trough * (C2 - C1) / (r_peak + r_trough)

## 实现步骤

1. 计算 r_peak = h/2 - r_trough
2. 验证 r_peak > 0（否则波高太小）
3. 对于每个波浪：
   a. 计算中心角度 θ_i
   b. 计算波谷圆心和波峰圆心
   c. 计算切点
   d. 计算波谷圆弧的起止点和角度
   e. 计算波峰圆弧的起止点和角度
4. 生成DXF ARC实体
