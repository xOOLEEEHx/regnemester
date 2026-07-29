import Phaser from 'phaser';

export const MAP_WIDTH = 3840;
export const MAP_HEIGHT = 2560;

export const REGIONS = {
  portal: new Phaser.Geom.Circle(365, 2075, 250),
  crystals: new Phaser.Geom.Ellipse(980, 1200, 900, 660),
  forest: new Phaser.Geom.Ellipse(420, 825, 760, 620),
  cave: new Phaser.Geom.Ellipse(2380, 285, 650, 470),
  swamp: new Phaser.Geom.Ellipse(3290, 485, 900, 720),
  fountain: new Phaser.Geom.Circle(2725, 1830, 260),
  castle: new Phaser.Geom.Ellipse(1760, 250, 900, 520),
  palace: new Phaser.Geom.Ellipse(2860, 1040, 720, 610),
  mine: new Phaser.Geom.Ellipse(1160, 520, 620, 520)
};

export const WATERFALL_POINTS = [
  { x: 2020, y: 535, width: 44, height: 190 },
  { x: 1370, y: 890, width: 38, height: 155 },
  { x: 2395, y: 1690, width: 48, height: 185 },
  { x: 1550, y: 1515, width: 28, height: 115 }
] as const;

export const LIGHT_POINTS = [
  { x: 365, y: 2075, radius: 360, color: 0x5b7dff, intensity: 0.68 },
  { x: 980, y: 1200, radius: 490, color: 0x7c5cff, intensity: 0.5 },
  { x: 2380, y: 285, radius: 430, color: 0x4169ff, intensity: 0.62 },
  { x: 3290, y: 485, radius: 390, color: 0x4ad9ae, intensity: 0.32 },
  { x: 2725, y: 1830, radius: 360, color: 0x55ddff, intensity: 0.62 },
  { x: 420, y: 825, radius: 380, color: 0x4d8cff, intensity: 0.34 }
] as const;

export function contains(region: Phaser.Geom.Circle | Phaser.Geom.Ellipse, x: number, y: number): boolean {
  return region instanceof Phaser.Geom.Circle
    ? Phaser.Geom.Circle.Contains(region, x, y)
    : Phaser.Geom.Ellipse.Contains(region, x, y);
}
