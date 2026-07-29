import Phaser from 'phaser';

type TexturePainter = (context: CanvasRenderingContext2D, size: number) => void;

function createCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  painter: TexturePainter
): void {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`Kunne ikke opprette runtime-tekstur: ${key}`);
  const context = texture.context;
  context.clearRect(0, 0, width, height);
  painter(context, Math.max(width, height));
  texture.refresh();
}

export function createShowcaseTextures(scene: Phaser.Scene): void {
  createCanvasTexture(scene, 'fx-pixel', 8, 8, (context) => {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 8, 8);
  });

  createCanvasTexture(scene, 'fx-spark', 48, 48, (context, size) => {
    const center = size / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.22, 'rgba(130,220,255,0.95)');
    gradient.addColorStop(0.55, 'rgba(95,120,255,0.45)');
    gradient.addColorStop(1, 'rgba(70,80,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });

  createCanvasTexture(scene, 'fx-bubble', 48, 48, (context) => {
    const gradient = context.createRadialGradient(24, 24, 7, 24, 24, 21);
    gradient.addColorStop(0, 'rgba(108,235,193,0.06)');
    gradient.addColorStop(0.62, 'rgba(104,226,202,0.12)');
    gradient.addColorStop(0.78, 'rgba(177,255,225,0.82)');
    gradient.addColorStop(0.9, 'rgba(88,205,178,0.38)');
    gradient.addColorStop(1, 'rgba(70,180,160,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 48, 48);
    context.strokeStyle = 'rgba(220,255,238,0.72)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(18, 17, 6, Math.PI * 1.08, Math.PI * 1.58);
    context.stroke();
  });

  createCanvasTexture(scene, 'fx-glow', 256, 256, (context, size) => {
    const center = size / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(210,245,255,0.9)');
    gradient.addColorStop(0.3, 'rgba(75,150,255,0.48)');
    gradient.addColorStop(0.72, 'rgba(65,70,255,0.13)');
    gradient.addColorStop(1, 'rgba(40,50,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });

  createCanvasTexture(scene, 'fx-ring', 256, 256, (context, size) => {
    const center = size / 2;
    context.strokeStyle = 'rgba(135,225,255,0.95)';
    context.lineWidth = 9;
    context.shadowColor = 'rgba(85,120,255,0.9)';
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(center, center, center - 24, 0, Math.PI * 2);
    context.stroke();
  });

  createCanvasTexture(scene, 'fx-mist', 320, 180, (context) => {
    const gradient = context.createRadialGradient(160, 90, 6, 160, 90, 155);
    gradient.addColorStop(0, 'rgba(215,245,255,0.58)');
    gradient.addColorStop(0.45, 'rgba(160,220,220,0.28)');
    gradient.addColorStop(1, 'rgba(135,190,205,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 320, 180);
  });

  createCanvasTexture(scene, 'fx-beam', 128, 512, (context) => {
    const horizontal = context.createLinearGradient(0, 0, 128, 0);
    horizontal.addColorStop(0, 'rgba(70,170,255,0)');
    horizontal.addColorStop(0.28, 'rgba(85,205,255,0.18)');
    horizontal.addColorStop(0.5, 'rgba(218,250,255,0.72)');
    horizontal.addColorStop(0.72, 'rgba(85,205,255,0.18)');
    horizontal.addColorStop(1, 'rgba(70,170,255,0)');
    context.fillStyle = horizontal;
    context.fillRect(0, 0, 128, 512);
    const vertical = context.createLinearGradient(0, 0, 0, 512);
    vertical.addColorStop(0, 'rgba(0,0,0,0)');
    vertical.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    vertical.addColorStop(1, 'rgba(255,255,255,0)');
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = vertical;
    context.fillRect(0, 0, 128, 512);
    context.globalCompositeOperation = 'source-over';
  });

  createCanvasTexture(scene, 'fx-waterfall', 96, 384, (context) => {
    const gradient = context.createLinearGradient(0, 0, 96, 0);
    gradient.addColorStop(0, 'rgba(180,235,255,0)');
    gradient.addColorStop(0.25, 'rgba(170,230,255,0.32)');
    gradient.addColorStop(0.5, 'rgba(235,252,255,0.7)');
    gradient.addColorStop(0.75, 'rgba(120,205,255,0.3)');
    gradient.addColorStop(1, 'rgba(110,195,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 96, 384);
    context.globalAlpha = 0.5;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    for (let x = 20; x < 82; x += 15) {
      context.beginPath();
      context.moveTo(x, 10);
      context.bezierCurveTo(x - 6, 115, x + 7, 250, x - 2, 374);
      context.stroke();
    }
    context.globalAlpha = 1;
  });

  createCanvasTexture(scene, 'fx-waterfall-streak', 16, 64, (context) => {
    const vertical = context.createLinearGradient(0, 0, 0, 64);
    vertical.addColorStop(0, 'rgba(205,246,255,0)');
    vertical.addColorStop(0.14, 'rgba(218,250,255,0.94)');
    vertical.addColorStop(0.68, 'rgba(105,213,255,0.78)');
    vertical.addColorStop(1, 'rgba(80,185,255,0)');
    context.fillStyle = vertical;
    context.fillRect(0, 0, 16, 64);

    const horizontal = context.createLinearGradient(0, 0, 16, 0);
    horizontal.addColorStop(0, 'rgba(255,255,255,0)');
    horizontal.addColorStop(0.32, 'rgba(255,255,255,0.72)');
    horizontal.addColorStop(0.5, 'rgba(255,255,255,1)');
    horizontal.addColorStop(0.68, 'rgba(255,255,255,0.72)');
    horizontal.addColorStop(1, 'rgba(255,255,255,0)');
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = horizontal;
    context.fillRect(0, 0, 16, 64);
    context.globalCompositeOperation = 'source-over';
  });

  createCanvasTexture(scene, 'fx-smoke', 192, 256, (context) => {
    for (let i = 0; i < 7; i += 1) {
      const x = 96 + Math.sin(i * 1.9) * 28;
      const y = 220 - i * 30;
      const radius = 30 + i * 5;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(215,228,235,0.25)');
      gradient.addColorStop(1, 'rgba(175,195,210,0)');
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  });

  createCanvasTexture(scene, 'fx-leaf', 28, 18, (context) => {
    context.fillStyle = 'rgba(172,219,112,0.9)';
    context.beginPath();
    context.ellipse(14, 9, 12, 5, -0.35, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(75,115,48,0.75)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(4, 13);
    context.lineTo(23, 5);
    context.stroke();
  });

  createCanvasTexture(scene, 'fx-banner', 256, 128, (context) => {
    const gradient = context.createLinearGradient(0, 0, 256, 128);
    gradient.addColorStop(0, 'rgba(34,73,170,0)');
    gradient.addColorStop(0.16, 'rgba(43,93,215,0.9)');
    gradient.addColorStop(0.55, 'rgba(85,174,255,0.94)');
    gradient.addColorStop(0.86, 'rgba(74,81,220,0.82)');
    gradient.addColorStop(1, 'rgba(50,40,170,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 128);
    context.strokeStyle = 'rgba(205,238,255,0.72)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(20, 18);
    context.quadraticCurveTo(128, 56, 236, 18);
    context.stroke();
  });
}
