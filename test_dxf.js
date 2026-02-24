// 简单测试：查看当前参数下的圆弧数量和位置
const params = {
  topDiameter: 100,
  bottomDiameter: 200,
  height: 150,
  slantHeight: 180.28,
  sectorAngle: 100.53,
  innerRadius: 100,
  outerRadius: 300,
  waveCount: 4,
  waveAmplitude: 20,
  waveTroughRadius: 2.5
};

console.log("Test parameters:");
console.log(`innerR: ${params.innerRadius}`);
console.log(`outerR: ${params.outerRadius}`);
console.log(`waveCount: ${params.waveCount}`);
console.log(`waveAmplitude: ${params.waveAmplitude}`);
console.log(`waveTroughRadius: ${params.waveTroughRadius}`);
