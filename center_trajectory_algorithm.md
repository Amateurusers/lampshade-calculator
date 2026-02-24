# 圆心轨迹法波浪算法设计

## 算法原理

基于用户提供的CAD示例图，波浪形灯罩的下口边缘由多个相切的圆弧组成，所有圆弧的圆心在特定的圆弧轨迹上均匀分布。

## 输入参数

- `R_base`：基准圆半径（下口半径）= 300mm
- `waveCount`：波浪数量 = 4
- `h`：波高 = 10mm
- `r_trough`：波谷圆弧半径（用户指定）= 2.5mm
- `startAngle`：扇形起始角度
- `endAngle`：扇形结束角度

## 计算步骤

### 1. 计算波峰圆弧半径

根据几何关系，波谷和波峰圆弧必须相切，且波高为h。

设：
- 波谷最低点到原点的距离：`R_min = R_base - h/2`
- 波峰最高点到原点的距离：`R_max = R_base + h/2`

波谷圆心到原点的距离：
```
R_trough_center = R_min + r_trough = R_base - h/2 + r_trough
```

波峰圆心到原点的距离：
```
R_peak_center = R_max - r_peak = R_base + h/2 - r_peak
```

为了让波谷和波峰圆弧相切，需要满足：
```
相邻圆心距离 = r_trough + r_peak
```

### 2. 确定圆心分布

总共需要 `2 * waveCount` 个圆弧（波谷和波峰交替）。

将扇形角度均分成 `2 * waveCount` 段：
```
angleStep = (endAngle - startAngle) / (2 * waveCount)
```

第i个圆弧的圆心角度：
```
centerAngle[i] = startAngle + (i + 0.5) * angleStep
```

第i个圆弧的圆心位置：
- 如果i是偶数（波谷）：
  ```
  cx = R_trough_center * cos(centerAngle[i])
  cy = R_trough_center * sin(centerAngle[i])
  r = r_trough
  ```
- 如果i是奇数（波峰）：
  ```
  cx = R_peak_center * cos(centerAngle[i])
  cy = R_peak_center * sin(centerAngle[i])
  r = r_peak
  ```

### 3. 计算圆弧端点

对于第i个圆弧，需要计算它的起点和终点。

**起点：**
- 如果i=0：与左边缘径向线的交点
- 否则：与前一个圆弧的切点

**终点：**
- 如果i=最后一个：与右边缘径向线的交点
- 否则：与后一个圆弧的切点

**计算两圆切点：**
给定两个圆：
- 圆1：圆心(cx1, cy1)，半径r1
- 圆2：圆心(cx2, cy2)，半径r2

切点在两圆心连线上，距离圆1圆心的距离为r1：
```
d = sqrt((cx2-cx1)^2 + (cy2-cy1)^2)
t = r1 / d
切点x = cx1 + t * (cx2 - cx1)
切点y = cy1 + t * (cy2 - cy1)
```

**计算径向线与圆的交点：**
给定：
- 圆：圆心(cx, cy)，半径r
- 径向线：从原点出发，角度为angle

交点：
```
圆心到原点的距离：d_center = sqrt(cx^2 + cy^2)
圆心与径向线的夹角：angle_center = atan2(cy, cx)
角度差：delta = angle - angle_center

如果 |delta| < asin(r / d_center)，则有两个交点
选择离原点较远的交点：
  d = d_center + sqrt(r^2 - (d_center * sin(delta))^2)
  x = d * cos(angle)
  y = d * sin(angle)
```

### 4. 确保左右对称

为了确保左右边缘对称，第一个和最后一个圆弧应该是相同类型（都是波谷或都是波峰）。

方案：使用 `2 * waveCount + 1` 个圆弧，起止都是波谷。

## 实现要点

1. 先计算所有圆心位置
2. 再顺序计算每个圆弧的起止点
3. 第一个圆弧的起点 = 起始径向线与第一个圆的交点
4. 中间圆弧的起点 = 前一个圆弧的终点 = 两圆切点
5. 最后一个圆弧的终点 = 结束径向线与最后一个圆的交点
6. 生成DXF时，每个圆弧使用ARC实体
