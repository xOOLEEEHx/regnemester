import Phaser from 'phaser';
import type { ShowcaseState } from '../types';
import { isNearCamera, type ShowcaseSystem, type WorldInteraction } from './ShowcaseSystem';

const ARENA_CENTER = { x: 3435, y: 1360 } as const;
const ARENA_RADIUS_X = 185;
const ARENA_RADIUS_Y = 105;

const FRAME_KEYS = {
  chameleon: [
    'arena-chameleon-01',
    'arena-chameleon-02',
    'arena-chameleon-03',
    'arena-chameleon-04'
  ],
  panther: [
    'arena-panther-01',
    'arena-panther-02',
    'arena-panther-03',
    'arena-panther-04'
  ],
  bird: [
    'arena-bird-01',
    'arena-bird-02',
    'arena-bird-03',
    'arena-bird-04'
  ]
} as const;

export const ARENA_ANIMAL_FRAME_ASSETS = Object.entries(FRAME_KEYS).flatMap(([animal, keys]) =>
  keys.map((key, index) => ({
    key,
    path: `/regnemester/animals/${animal}/${String(index + 1).padStart(2, '0')}.png`
  }))
);

type AnimalKind = keyof typeof FRAME_KEYS;

type ArenaAnimal = {
  kind: AnimalKind;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  position: Phaser.Math.Vector2;
  target: Phaser.Math.Vector2;
  speed: number;
  pauseUntil: number;
  phase: number;
};

const ANIMAL_CONFIGS: ReadonlyArray<{
  kind: AnimalKind;
  x: number;
  y: number;
  speed: number;
  size: number;
  frameRate: number;
}> = [
  { kind: 'chameleon', x: 3365, y: 1338, speed: 20, size: 72, frameRate: 6 },
  { kind: 'panther', x: 3475, y: 1395, speed: 29, size: 78, frameRate: 8 },
  { kind: 'bird', x: 3505, y: 1328, speed: 23, size: 70, frameRate: 7 }
];

export class ArenaAnimalsSystem implements ShowcaseSystem {
  private readonly animals: ArenaAnimal[];
  private state: ShowcaseState;
  private nearCamera = true;

  constructor(private readonly scene: Phaser.Scene, initialState: ShowcaseState) {
    this.state = initialState;

    ANIMAL_CONFIGS.forEach((config) => {
      const animationKey = this.getAnimationKey(config.kind);
      if (!scene.anims.exists(animationKey)) {
        scene.anims.create({
          key: animationKey,
          frames: FRAME_KEYS[config.kind].map((key) => ({ key })),
          frameRate: config.frameRate,
          repeat: -1
        });
      }
    });

    this.animals = ANIMAL_CONFIGS.map((config, index) => {
      const position = new Phaser.Math.Vector2(config.x, config.y);
      const shadow = scene.add
        .ellipse(position.x, position.y + 2, config.size * 0.72, config.size * 0.2, 0x172016, 0.28)
        .setDepth(5);
      const sprite = scene.add
        .sprite(position.x, position.y, FRAME_KEYS[config.kind][0])
        .setOrigin(0.5, 1)
        .setDisplaySize(config.size, config.size)
        .setDepth(6)
        .play(this.getAnimationKey(config.kind));

      return {
        kind: config.kind,
        sprite,
        shadow,
        position,
        target: this.pickTarget(index * 1.9 + 0.7),
        speed: config.speed,
        pauseUntil: 0,
        phase: index * 2.1
      };
    });

    this.applyState(initialState);
  }

  applyState(state: ShowcaseState): void {
    this.state = state;
    const visibleCount = state.quality === 'low' ? 1 : state.quality === 'standard' ? 2 : this.animals.length;
    this.animals.forEach((animal, index) => {
      const visible = state.effects.atmosphere && index < visibleCount;
      animal.sprite.setVisible(visible).setActive(visible);
      animal.shadow.setVisible(visible).setActive(visible);
      if (!visible) animal.sprite.anims.pause();
    });
  }

  update(time: number, delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.state.effects.atmosphere) return;
    this.nearCamera = isNearCamera(camera, ARENA_CENTER.x, ARENA_CENTER.y, 360);
    const step = Math.min(delta, 50) / 1000;

    this.animals.forEach((animal) => {
      if (!animal.sprite.visible) return;
      if (!this.nearCamera) {
        animal.sprite.anims.pause();
        return;
      }

      if (animal.sprite.anims.isPaused) animal.sprite.anims.resume();
      if (time >= animal.pauseUntil) {
        const distance = Phaser.Math.Distance.BetweenPoints(animal.position, animal.target);
        if (distance < 7) {
          animal.pauseUntil = time + Phaser.Math.Between(450, 1200);
          animal.target.copy(this.pickTarget(animal.phase + time * 0.0002));
        } else {
          const direction = new Phaser.Math.Vector2(
            animal.target.x - animal.position.x,
            animal.target.y - animal.position.y
          ).normalize();
          animal.position.x += direction.x * animal.speed * step;
          animal.position.y += direction.y * animal.speed * step;
          animal.sprite.setFlipX(direction.x < 0);
        }
      }

      const hop = animal.kind === 'bird'
        ? Math.max(0, Math.sin(time * 0.008 + animal.phase)) * 5
        : Math.sin(time * 0.005 + animal.phase) * 1.2;
      animal.sprite.setPosition(animal.position.x, animal.position.y - hop);
      animal.shadow
        .setPosition(animal.position.x, animal.position.y + 2)
        .setScale(animal.kind === 'bird' ? 1 - hop * 0.025 : 1, 1)
        .setAlpha(animal.kind === 'bird' ? 0.28 - hop * 0.018 : 0.28);
    });
  }

  interact(_point: WorldInteraction): boolean {
    return false;
  }

  getEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return [];
  }

  getVisibleLightCount(): number {
    return 0;
  }

  destroy(): void {
    this.animals.forEach((animal) => {
      animal.sprite.destroy();
      animal.shadow.destroy();
    });
  }

  private getAnimationKey(kind: AnimalKind): string {
    return `arena-${kind}-move`;
  }

  private pickTarget(seed: number): Phaser.Math.Vector2 {
    const angle = seed + Phaser.Math.FloatBetween(-1.2, 1.2);
    const radius = Math.sqrt(Phaser.Math.FloatBetween(0.08, 0.86));
    return new Phaser.Math.Vector2(
      ARENA_CENTER.x + Math.cos(angle) * ARENA_RADIUS_X * radius,
      ARENA_CENTER.y + Math.sin(angle) * ARENA_RADIUS_Y * radius
    );
  }
}
