import Phaser from 'phaser';
import { MAP_HEIGHT, MAP_WIDTH } from '../mapRegions';

type TapHandler = (x: number, y: number) => void;

type PointerTrack = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
};

export class ShowcaseCameraController {
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly keys: Record<'left' | 'right' | 'up' | 'down', Phaser.Input.Keyboard.Key>;
  private readonly pointers = new Map<number, PointerTrack>();
  private minZoom = 0.25;
  private maxZoom = 2.1;
  private pinchDistance = 0;
  private tourToken = 0;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onTap: TapHandler,
    private readonly renderScale: number
  ) {
    this.camera = scene.cameras.main;
    this.camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.scene.input.addPointer(2);

    const keyboard = this.scene.input.keyboard;
    if (!keyboard) throw new Error('Tastatur-pluginen er ikke tilgjengelig.');
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    };

    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
    scene.input.on('pointerupoutside', this.handlePointerUp, this);
    scene.input.on('wheel', this.handleWheel, this);
    this.fitOverview(false);
  }

  update(delta: number): void {
    const speed = (760 * delta) / 1000 / this.camera.zoom;
    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown) dx -= speed;
    if (this.keys.right.isDown) dx += speed;
    if (this.keys.up.isDown) dy -= speed;
    if (this.keys.down.isDown) dy += speed;
    if (dx || dy) {
      this.stopTour();
      this.camera.scrollX += dx;
      this.camera.scrollY += dy;
    }
    this.refreshBounds();
  }

  fitOverview(animated = true): void {
    const width = Math.max(1, this.camera.width);
    const height = Math.max(1, this.camera.height);
    this.minZoom = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 0.92 * this.renderScale;
    this.maxZoom = Math.max(1.8 * this.renderScale, this.minZoom * 5.5);
    const targetZoom = this.minZoom;
    if (animated) {
      this.camera.pan(MAP_WIDTH / 2, MAP_HEIGHT / 2, 850, 'Sine.easeInOut', true);
      this.camera.zoomTo(targetZoom, 850, 'Sine.easeInOut', true);
    } else {
      this.camera.setZoom(targetZoom);
      this.refreshBounds();
      this.camera.centerOn(MAP_WIDTH / 2, MAP_HEIGHT / 2);
    }
  }

  focusOn(x: number, y: number, zoom = 1, duration = 900): void {
    this.camera.pan(x, y, duration, 'Sine.easeInOut', true);
    this.camera.zoomTo(
      Phaser.Math.Clamp(zoom * this.renderScale, this.minZoom, this.maxZoom),
      duration,
      'Sine.easeInOut',
      true
    );
  }

  startTour(): void {
    const token = ++this.tourToken;
    const stops = [
      { x: 365, y: 2075, zoom: 1.05, hold: 2600 },
      { x: 980, y: 1200, zoom: 0.95, hold: 2500 },
      { x: 420, y: 825, zoom: 0.95, hold: 2300 },
      { x: 2380, y: 285, zoom: 1.05, hold: 2400 },
      { x: 3290, y: 485, zoom: 0.9, hold: 2400 },
      { x: 2725, y: 1830, zoom: 1.05, hold: 2600 }
    ];
    let index = 0;
    const next = () => {
      if (this.destroyed || token !== this.tourToken) return;
      if (index >= stops.length) {
        this.fitOverview(true);
        return;
      }
      const stop = stops[index++];
      this.focusOn(stop.x, stop.y, stop.zoom, 1500);
      this.scene.time.delayedCall(stop.hold, next);
    };
    next();
  }

  stopTour(): void {
    this.tourToken += 1;
    this.camera.stopFollow();
    this.camera.panEffect.reset();
    this.camera.zoomEffect.reset();
  }

  onResize(): void {
    const previousMin = this.minZoom;
    const fit = Math.min(this.camera.width / MAP_WIDTH, this.camera.height / MAP_HEIGHT) * 0.92 * this.renderScale;
    this.minZoom = fit;
    this.maxZoom = Math.max(1.8 * this.renderScale, fit * 5.5);
    if (this.camera.zoom <= previousMin * 1.04) this.fitOverview(false);
    else this.camera.setZoom(Phaser.Math.Clamp(this.camera.zoom, this.minZoom, this.maxZoom));
  }

  destroy(): void {
    this.destroyed = true;
    this.stopTour();
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointerupoutside', this.handlePointerUp, this);
    this.scene.input.off('wheel', this.handleWheel, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.stopTour();
    this.pointers.set(pointer.id, {
      x: pointer.x,
      y: pointer.y,
      startX: pointer.x,
      startY: pointer.y,
      moved: false
    });
    if (this.pointers.size === 2) {
      this.pointers.forEach((track) => {
        track.moved = true;
      });
      this.pinchDistance = this.getPinchDistance();
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const track = this.pointers.get(pointer.id);
    if (!track || !pointer.isDown) return;
    const dx = pointer.x - track.x;
    const dy = pointer.y - track.y;
    track.x = pointer.x;
    track.y = pointer.y;
    if (Math.hypot(pointer.x - track.startX, pointer.y - track.startY) > 8) track.moved = true;

    if (this.pointers.size >= 2) {
      this.pointers.forEach((pointerTrack) => {
        pointerTrack.moved = true;
      });
      const nextDistance = this.getPinchDistance();
      const center = this.getPinchCenter();
      if (this.pinchDistance > 0 && nextDistance > 0) {
        this.setZoomAt(this.camera.zoom * (nextDistance / this.pinchDistance), center.x, center.y);
      }
      this.pinchDistance = nextDistance;
      return;
    }

    // Ignore normal pointer jitter until the gesture is clearly a drag. This
    // keeps a water/fontene tap anchored to the same world coordinate.
    if (!track.moved) return;
    this.camera.scrollX -= dx / this.camera.zoom;
    this.camera.scrollY -= dy / this.camera.zoom;
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const track = this.pointers.get(pointer.id);
    this.pointers.delete(pointer.id);
    this.pinchDistance = this.pointers.size === 2 ? this.getPinchDistance() : 0;
    if (!track || track.moved || this.pointers.size > 0) return;
    const world = this.camera.getWorldPoint(pointer.x, pointer.y);
    this.onTap(world.x, world.y);
  }

  private handleWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    this.stopTour();
    const factor = Math.exp(-deltaY * 0.0012);
    this.setZoomAt(this.camera.zoom * factor, pointer.x, pointer.y);
  }

  private setZoomAt(value: number, screenX: number, screenY: number): void {
    const before = this.camera.getWorldPoint(screenX, screenY);
    this.camera.setZoom(Phaser.Math.Clamp(value, this.minZoom, this.maxZoom));
    this.refreshBounds();
    const after = this.camera.getWorldPoint(screenX, screenY);
    this.camera.scrollX += before.x - after.x;
    this.camera.scrollY += before.y - after.y;
  }

  private getPinchDistance(): number {
    const values = [...this.pointers.values()];
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  private refreshBounds(): void {
    const viewWidth = this.camera.width / Math.max(this.camera.zoom, 0.001);
    const viewHeight = this.camera.height / Math.max(this.camera.zoom, 0.001);
    const paddingX = Math.max(0, (viewWidth - MAP_WIDTH) / 2);
    const paddingY = Math.max(0, (viewHeight - MAP_HEIGHT) / 2);
    this.camera.setBounds(
      -paddingX,
      -paddingY,
      MAP_WIDTH + paddingX * 2,
      MAP_HEIGHT + paddingY * 2,
      false
    );
  }

  private getPinchCenter(): { x: number; y: number } {
    const values = [...this.pointers.values()];
    return {
      x: (values[0].x + values[1].x) / 2,
      y: (values[0].y + values[1].y) / 2
    };
  }
}
