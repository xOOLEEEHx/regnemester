import Phaser from 'phaser';
import { LOCATIONS, WORLD_SIZE } from '../../game/content/locations';

type Region = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  fill: number;
  shadow: number;
  decor: 'swamp' | 'stone' | 'ice' | 'lava' | 'storm' | 'crystal' | 'machine' | 'sea' | 'final';
};

const regions: Region[] = [
  { x: 285, y: 1170, radiusX: 260, radiusY: 170, fill: 0x4f9d44, shadow: 0x1d6846, decor: 'swamp' },
  { x: 520, y: 1035, radiusX: 250, radiusY: 160, fill: 0x8d7654, shadow: 0x4c392d, decor: 'stone' },
  { x: 815, y: 900, radiusX: 300, radiusY: 170, fill: 0x3d3b73, shadow: 0x1f244d, decor: 'stone' },
  { x: 1130, y: 700, radiusX: 290, radiusY: 175, fill: 0x83d8ef, shadow: 0x3e83a3, decor: 'ice' },
  { x: 1420, y: 835, radiusX: 285, radiusY: 180, fill: 0x7a3b2f, shadow: 0x431e22, decor: 'lava' },
  { x: 1660, y: 650, radiusX: 275, radiusY: 165, fill: 0x4b6fa5, shadow: 0x293c69, decor: 'storm' },
  { x: 1870, y: 455, radiusX: 255, radiusY: 160, fill: 0x72519a, shadow: 0x3a2a61, decor: 'crystal' },
  { x: 1585, y: 315, radiusX: 250, radiusY: 155, fill: 0x3d888b, shadow: 0x1e5659, decor: 'machine' },
  { x: 1885, y: 1035, radiusX: 270, radiusY: 190, fill: 0x235c9a, shadow: 0x123767, decor: 'sea' },
  { x: 2045, y: 190, radiusX: 280, radiusY: 170, fill: 0x7f3b9e, shadow: 0x3d1d65, decor: 'final' }
];

export function drawGeneratedOverworld(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.setDepth(0);

  drawOcean(g);
  drawFarIslands(g);
  drawRegions(g);
  drawTravelPath(g);
  drawMapDecor(g);
  drawPathLights(g);
}

function drawOcean(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x0a4761, 1);
  g.fillRect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);

  for (let y = 0; y < WORLD_SIZE.height; y += 42) {
    const alpha = 0.05 + (y / WORLD_SIZE.height) * 0.08;
    g.lineStyle(2, 0x55d2e6, alpha);
    g.beginPath();
    for (let x = -120; x <= WORLD_SIZE.width + 120; x += 90) {
      const waveY = y + Math.sin((x + y) * 0.009) * 13;
      if (x === -120) {
        g.moveTo(x, waveY);
      } else {
        g.lineTo(x, waveY);
      }
    }
    g.strokePath();
  }

  g.fillStyle(0x0fd5b7, 0.08);
  for (let i = 0; i < 120; i += 1) {
    const x = seeded(i, 17) * WORLD_SIZE.width;
    const y = seeded(i, 31) * WORLD_SIZE.height;
    g.fillCircle(x, y, 2 + seeded(i, 47) * 4);
  }
}

function drawFarIslands(g: Phaser.GameObjects.Graphics): void {
  const islands = [
    [270, 260, 180, 95],
    [700, 185, 240, 120],
    [1040, 1275, 265, 105],
    [1320, 130, 210, 100],
    [1995, 1285, 220, 120]
  ];

  for (const [x, y, rx, ry] of islands) {
    g.fillStyle(0x1f6f62, 0.28);
    g.fillEllipse(x, y, rx, ry);
    g.fillStyle(0x8ccf6a, 0.18);
    g.fillEllipse(x - 10, y - 8, rx * 0.74, ry * 0.55);
  }
}

function drawRegions(g: Phaser.GameObjects.Graphics): void {
  for (const region of regions) {
    g.fillStyle(region.shadow, 0.78);
    g.fillEllipse(region.x + 12, region.y + 18, region.radiusX * 2.04, region.radiusY * 2.02);
    g.fillStyle(region.fill, 0.96);
    g.fillEllipse(region.x, region.y, region.radiusX * 2, region.radiusY * 2);
    g.lineStyle(8, 0xf4dc8a, 0.32);
    g.strokeEllipse(region.x, region.y, region.radiusX * 1.9, region.radiusY * 1.86);
    g.lineStyle(2, 0xffffff, 0.16);
    g.strokeEllipse(region.x - 2, region.y - 6, region.radiusX * 1.62, region.radiusY * 1.42);
  }
}

function drawTravelPath(g: Phaser.GameObjects.Graphics): void {
  const points = LOCATIONS.map((location) => new Phaser.Math.Vector2(location.x, location.y));
  const spline = new Phaser.Curves.Spline(points);
  const sampled = spline.getPoints(260);

  g.lineStyle(104, 0x1f5c41, 0.42);
  g.strokePoints(sampled, false);
  g.lineStyle(74, 0xd2a959, 0.9);
  g.strokePoints(sampled, false);
  g.lineStyle(50, 0xf7dc92, 1);
  g.strokePoints(sampled, false);
  g.lineStyle(6, 0xfff7ba, 0.88);
  g.strokePoints(sampled, false);
}

function drawMapDecor(g: Phaser.GameObjects.Graphics): void {
  regions.forEach((region, regionIndex) => {
    for (let i = 0; i < 18; i += 1) {
      const angle = seeded(i + regionIndex * 20, 13) * Math.PI * 2;
      const distance = 0.28 + seeded(i + regionIndex * 20, 29) * 0.56;
      const x = region.x + Math.cos(angle) * region.radiusX * distance;
      const y = region.y + Math.sin(angle) * region.radiusY * distance;
      drawDecorItem(g, region.decor, x, y, 0.65 + seeded(i, 7) * 0.55);
    }
  });
}

function drawDecorItem(g: Phaser.GameObjects.Graphics, decor: Region['decor'], x: number, y: number, scale: number): void {
  if (decor === 'swamp') {
    g.fillStyle(0x9be65f, 0.85);
    g.fillCircle(x, y, 10 * scale);
    g.fillStyle(0x3d812d, 0.85);
    g.fillCircle(x + 8 * scale, y - 2 * scale, 7 * scale);
    return;
  }

  if (decor === 'stone') {
    g.fillStyle(0x2b2847, 0.55);
    g.fillRoundedRect(x - 10 * scale, y - 18 * scale, 20 * scale, 34 * scale, 6 * scale);
    g.lineStyle(2, 0xf5c37c, 0.24);
    g.strokeRoundedRect(x - 10 * scale, y - 18 * scale, 20 * scale, 34 * scale, 6 * scale);
    return;
  }

  if (decor === 'ice') {
    g.fillStyle(0xd8fbff, 0.8);
    g.fillTriangle(x, y - 20 * scale, x - 13 * scale, y + 16 * scale, x + 13 * scale, y + 16 * scale);
    g.lineStyle(2, 0x77c5ff, 0.55);
    g.strokeTriangle(x, y - 20 * scale, x - 13 * scale, y + 16 * scale, x + 13 * scale, y + 16 * scale);
    return;
  }

  if (decor === 'lava') {
    g.fillStyle(0xffd05f, 0.85);
    g.fillCircle(x, y, 12 * scale);
    g.fillStyle(0xff4a2d, 0.65);
    g.fillCircle(x, y, 7 * scale);
    return;
  }

  if (decor === 'storm') {
    g.lineStyle(4 * scale, 0xcfeaff, 0.75);
    g.beginPath();
    g.moveTo(x - 8 * scale, y - 18 * scale);
    g.lineTo(x + 3 * scale, y - 2 * scale);
    g.lineTo(x - 4 * scale, y + 1 * scale);
    g.lineTo(x + 11 * scale, y + 20 * scale);
    g.strokePath();
    return;
  }

  if (decor === 'crystal' || decor === 'final') {
    const color = decor === 'final' ? 0xff80f6 : 0xcda5ff;
    g.fillStyle(color, 0.78);
    g.fillTriangle(x, y - 22 * scale, x - 12 * scale, y + 16 * scale, x + 12 * scale, y + 16 * scale);
    g.fillStyle(0xffffff, 0.28);
    g.fillCircle(x - 3 * scale, y - 5 * scale, 3 * scale);
    return;
  }

  if (decor === 'machine') {
    g.lineStyle(4 * scale, 0x9dfaff, 0.68);
    g.strokeCircle(x, y, 13 * scale);
    g.lineBetween(x - 18 * scale, y, x + 18 * scale, y);
    g.lineBetween(x, y - 18 * scale, x, y + 18 * scale);
    return;
  }

  g.fillStyle(0x65d7ff, 0.42);
  g.fillCircle(x, y, 13 * scale);
  g.lineStyle(2, 0xb4f3ff, 0.36);
  g.strokeCircle(x, y, 18 * scale);
}

function drawPathLights(g: Phaser.GameObjects.Graphics): void {
  for (const location of LOCATIONS) {
    g.fillStyle(location.color, 0.2);
    g.fillCircle(location.x, location.y, 74);
    g.lineStyle(5, location.color, 0.65);
    g.strokeCircle(location.x, location.y, 46);
    g.fillStyle(0xfff2a9, 1);
    g.fillCircle(location.x, location.y, 18);
  }
}

function seeded(a: number, b: number): number {
  const x = Math.sin(a * 999 + b * 77) * 10000;
  return x - Math.floor(x);
}
