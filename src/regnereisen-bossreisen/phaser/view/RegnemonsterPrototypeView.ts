import Phaser from 'phaser';
import {
  REGNEMONSTER_PROTOTYPE,
  REGNEMONSTER_PROTOTYPE_OBJECTS,
  isRegnemonsterPrototypePositionWalkable,
  type RegnemonsterPrototypePosition
} from '../../game/content/regnemonsterPrototype';
import {
  MAP_OBJECT_POSITIONS,
  getMapObjectPosition,
  getMapObjectPositions,
  type EditableMapObjectPosition
} from '../../game/content/mapObjectPositions';
import { REGNEMONSTER_MAP_ID } from '../../game/content/maps';
import {
  REGNEMONSTER_OBJECT_CATALOG,
  createRegnemonsterLibraryInstance,
  getRegnemonsterCatalogAssetPath,
  getRegnemonsterCatalogItem,
  getRegnemonsterCatalogTextureKey,
  isRegnemonsterLibraryPositionWalkable
} from '../../game/content/regnemonsterObjectCatalog';
import type { MapEditorObjectBinding } from '../../dev/TallvokterMapEditor';
import {
  isRegnemonsterRoomPositionWalkable,
  type RegnemonsterInteriorRoomId,
  type RegnemonsterRoomId
} from '../../game/simulation/regnemonsterRooms';
import {
  REGNEMONSTER_TOWN_LIFE,
  getRegnemonsterTownLifeMotion,
  type RegnemonsterTownLifeDefinition,
  type RegnemonsterTownLifeDirection
} from '../../game/simulation/regnemonsterTownLife';

export const REGNEMONSTER_INTERIOR_MAP_IDS: Record<RegnemonsterInteriorRoomId, string> = {
  'collector-house': 'regnemonster-collector-house',
  'game-house': 'regnemonster-game-house'
};

const OPEN_DOOR_TEXTURE_KEY = 'regnemonster-prototype-house-door-open';
const OPEN_DOOR_ASSET_PATH =
  '/regnemester/regnemonster/assets/objects/one-story-house-door-open-48.png';
const GAME_OPEN_DOOR_TEXTURE_KEY = 'regnemonster-game-house-door-open';
const GAME_OPEN_DOOR_ASSET_PATH =
  '/regnemester/regnemonster/assets/objects/japanese-house-door-open-48.png';
const COLLECTOR_INTERIOR_TEXTURE_KEY = 'regnemonster-collector-house-interior';
const COLLECTOR_INTERIOR_ASSET_PATH =
  '/regnemester/regnemonster/assets/interiors/collector-house.png';
const GAME_INTERIOR_TEXTURE_KEY = 'regnemonster-game-house-interior';
const GAME_INTERIOR_ASSET_PATH =
  '/regnemester/regnemonster/assets/interiors/game-house.png';
const BINDER_TABLE_TEXTURE_KEY = 'regnemonster-binder-table';
const BINDER_TABLE_ASSET_PATH =
  '/regnemester/regnemonster/assets/interiors/binder-table.png';

type PrototypeObjectView = {
  position: RegnemonsterPrototypePosition;
  sprite: Phaser.GameObjects.Image;
  applyPosition: () => void;
};

type LibraryObjectView = {
  position: EditableMapObjectPosition;
  sprite: Phaser.GameObjects.Image;
};

type TownLifeView = {
  definition: RegnemonsterTownLifeDefinition;
  position: EditableMapObjectPosition;
  sprite: Phaser.GameObjects.Sprite;
  direction?: RegnemonsterTownLifeDirection;
};

export function queueRegnemonsterPrototypeAssets(scene: Phaser.Scene): void {
  if (!scene.cache.tilemap.exists(REGNEMONSTER_PROTOTYPE.tilemapKey)) {
    scene.load.tilemapTiledJSON(
      REGNEMONSTER_PROTOTYPE.tilemapKey,
      REGNEMONSTER_PROTOTYPE.tilemapPath
    );
  }
  if (!scene.textures.exists(REGNEMONSTER_PROTOTYPE.groundTextureKey)) {
    scene.load.image(
      REGNEMONSTER_PROTOTYPE.groundTextureKey,
      REGNEMONSTER_PROTOTYPE.groundAssetPath
    );
  }
  for (const object of REGNEMONSTER_PROTOTYPE_OBJECTS) {
    if (!scene.textures.exists(object.textureKey)) {
      scene.load.image(object.textureKey, object.assetPath);
    }
  }
  for (const item of REGNEMONSTER_OBJECT_CATALOG) {
    const textureKey = getRegnemonsterCatalogTextureKey(item.id);
    if (!scene.textures.exists(textureKey)) {
      scene.load.image(textureKey, getRegnemonsterCatalogAssetPath(item));
    }
  }
  for (const item of REGNEMONSTER_TOWN_LIFE) {
    if (!scene.textures.exists(item.textureKey)) {
      scene.load.spritesheet(item.textureKey, item.assetPath, {
        frameWidth: item.frameWidth,
        frameHeight: item.frameHeight
      });
    }
  }
  if (!scene.textures.exists(OPEN_DOOR_TEXTURE_KEY)) {
    scene.load.image(OPEN_DOOR_TEXTURE_KEY, OPEN_DOOR_ASSET_PATH);
  }
  [
    [GAME_OPEN_DOOR_TEXTURE_KEY, GAME_OPEN_DOOR_ASSET_PATH],
    [COLLECTOR_INTERIOR_TEXTURE_KEY, COLLECTOR_INTERIOR_ASSET_PATH],
    [GAME_INTERIOR_TEXTURE_KEY, GAME_INTERIOR_ASSET_PATH],
    [BINDER_TABLE_TEXTURE_KEY, BINDER_TABLE_ASSET_PATH]
  ].forEach(([textureKey, assetPath]) => {
    if (!scene.textures.exists(textureKey)) {
      scene.load.image(textureKey, assetPath);
    }
  });
}

export function hasRegnemonsterPrototypeAssets(scene: Phaser.Scene): boolean {
  return scene.cache.tilemap.exists(REGNEMONSTER_PROTOTYPE.tilemapKey)
    && scene.textures.exists(REGNEMONSTER_PROTOTYPE.groundTextureKey)
    && scene.textures.exists(OPEN_DOOR_TEXTURE_KEY)
    && scene.textures.exists(GAME_OPEN_DOOR_TEXTURE_KEY)
    && scene.textures.exists(COLLECTOR_INTERIOR_TEXTURE_KEY)
    && scene.textures.exists(GAME_INTERIOR_TEXTURE_KEY)
    && scene.textures.exists(BINDER_TABLE_TEXTURE_KEY)
    && REGNEMONSTER_PROTOTYPE_OBJECTS.every((object) =>
      scene.textures.exists(object.textureKey)
    )
    && REGNEMONSTER_OBJECT_CATALOG.every((item) =>
      scene.textures.exists(getRegnemonsterCatalogTextureKey(item.id))
    )
    && REGNEMONSTER_TOWN_LIFE.every((item) => scene.textures.exists(item.textureKey));
}

export class RegnemonsterPrototypeView {
  private readonly layers: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer>;
  private readonly objectViews = new Map<string, PrototypeObjectView>();
  private readonly libraryObjectViews = new Map<string, LibraryObjectView>();
  private readonly townLifeViews = new Map<string, TownLifeView>();
  private readonly openDoor: Phaser.GameObjects.Image;
  private readonly gameOpenDoor: Phaser.GameObjects.Image;
  private readonly collectorInterior: Phaser.GameObjects.Image;
  private readonly gameInterior: Phaser.GameObjects.Image;
  private readonly binderTable: Phaser.GameObjects.Image;
  private readonly binderMarker: Phaser.GameObjects.Arc;
  private readonly gameConsoleMarker: Phaser.GameObjects.Arc;
  private readonly townLabels: Phaser.GameObjects.Text[] = [];
  private active = false;
  private editing = false;
  private room: RegnemonsterRoomId = 'town';

  constructor(private readonly scene: Phaser.Scene) {
    const tilemap = scene.make.tilemap({ key: REGNEMONSTER_PROTOTYPE.tilemapKey });
    const tileset = tilemap.addTilesetImage(
      'prototype-ground-48',
      REGNEMONSTER_PROTOTYPE.groundTextureKey
    );
    if (!tileset) {
      throw new Error('Kunne ikke koble flisene til Regnemonster-prøvekartet.');
    }

    this.layers = ['Grass', 'Path'].map((name, index) => {
      const layer = tilemap.createLayer(name, tileset, 0, 0);
      if (!layer) {
        throw new Error(`Mangler kartlaget ${name} i Regnemonster-prøvekartet.`);
      }
      layer.setDepth(index);
      return layer;
    });

    for (const definition of REGNEMONSTER_PROTOTYPE_OBJECTS) {
      const position = getMapObjectPosition(REGNEMONSTER_MAP_ID, definition.id);
      const sprite = scene.add
        .image(position.x, position.y, definition.textureKey)
        .setOrigin(definition.originX, definition.originY)
        .setDepth(definition.depth);
      this.objectViews.set(definition.id, {
        position,
        sprite,
        applyPosition: () => sprite.setPosition(position.x, position.y)
      });
    }
    for (const { id, position } of getMapObjectPositions(REGNEMONSTER_MAP_ID)) {
      if (position.catalogId) {
        this.createLibraryView(id, position);
      }
    }
    this.createTownLifeAnimations();
    for (const definition of REGNEMONSTER_TOWN_LIFE) {
      const position = MAP_OBJECT_POSITIONS[REGNEMONSTER_MAP_ID]?.[definition.id];
      if (position) {
        this.createTownLifeView(definition, position);
      }
    }

    this.openDoor = scene.add
      .image(0, 0, OPEN_DOOR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setDepth(12);
    this.gameOpenDoor = scene.add
      .image(0, 0, GAME_OPEN_DOOR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setDepth(12);
    this.collectorInterior = scene.add
      .image(960, 700, COLLECTOR_INTERIOR_TEXTURE_KEY)
      .setScale(1.18)
      .setDepth(2);
    this.gameInterior = scene.add
      .image(960, 700, GAME_INTERIOR_TEXTURE_KEY)
      .setScale(1.55)
      .setDepth(2);
    this.binderTable = scene.add
      .image(790, 720, BINDER_TABLE_TEXTURE_KEY)
      .setOrigin(0.5, 1)
      .setScale(1.25)
      .setDepth(12);
    this.binderMarker = scene.add
      .circle(790, 760, 72, 0xf4d35e, 0.12)
      .setStrokeStyle(5, 0xf4d35e, 0.88)
      .setDepth(13);
    this.gameConsoleMarker = scene.add
      .circle(960, 700, 76, 0x54d7ff, 0.12)
      .setStrokeStyle(5, 0x54d7ff, 0.88)
      .setDepth(13);
    this.townLabels.push(
      this.createTownLabel('SAMLERHUSET'),
      this.createTownLabel('SPILLHUSET')
    );
    this.applyHousePositions();
    this.applyInteriorPositions();
    this.applyVisibility();
  }

  public setActive(active: boolean): void {
    this.active = active;
    this.applyVisibility();
  }

  public setRoom(room: RegnemonsterRoomId): void {
    this.room = room;
    this.applyVisibility();
  }

  public setEditing(editing: boolean): void {
    this.editing = editing;
    this.townLifeViews.forEach((view) => {
      if (editing) {
        view.sprite.anims.pause();
        view.sprite.setPosition(view.position.x, view.position.y);
      } else {
        view.sprite.anims.resume();
      }
    });
  }

  public update(elapsedMs: number): void {
    if (!this.active || this.room !== 'town' || this.editing) {
      return;
    }
    this.townLifeViews.forEach((view) => {
      const motion = getRegnemonsterTownLifeMotion(view.definition.route, elapsedMs);
      view.sprite.setPosition(view.position.x + motion.x, view.position.y + motion.y);
      if (view.direction !== motion.direction) {
        view.direction = motion.direction;
        this.applyTownLifeDirection(view, motion.direction);
      }
    });
  }

  public getRoom(): RegnemonsterRoomId {
    return this.room;
  }

  public getEditorMapId(): string {
    return this.room === 'town'
      ? REGNEMONSTER_MAP_ID
      : REGNEMONSTER_INTERIOR_MAP_IDS[this.room];
  }

  public getInteriorPositions(): Partial<Record<
    RegnemonsterInteriorRoomId,
    Partial<Record<string, RegnemonsterPrototypePosition>>
  >> {
    return Object.fromEntries(
      Object.entries(REGNEMONSTER_INTERIOR_MAP_IDS).map(([room, mapId]) => [
        room,
        Object.fromEntries(
          getMapObjectPositions(mapId).map(({ id, position }) => [id, position])
        )
      ])
    );
  }

  public getPositions(): Partial<Record<string, RegnemonsterPrototypePosition>> {
    return Object.fromEntries(
      [...this.objectViews.entries()].map(([id, view]) => [id, view.position])
    );
  }

  public getCollisionRects(): Partial<Record<string, Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>>> {
    return Object.fromEntries(
      REGNEMONSTER_PROTOTYPE_OBJECTS.map((definition) => {
        const position = getMapObjectPosition(REGNEMONSTER_MAP_ID, definition.id);
        return [definition.id, position.collisionRects ?? definition.collisionRects];
      })
    );
  }

  public getEditorBindings(): MapEditorObjectBinding[] {
    const fixedBindings = REGNEMONSTER_PROTOTYPE_OBJECTS.map((definition) => {
      const view = this.objectViews.get(definition.id);
      if (!view) {
        throw new Error(`Mangler visning for ${definition.id}.`);
      }
      return {
        mapId: REGNEMONSTER_MAP_ID,
        maxX: REGNEMONSTER_PROTOTYPE.width,
        maxY: REGNEMONSTER_PROTOTYPE.height,
        id: definition.id,
        label: getMapObjectPosition(REGNEMONSTER_MAP_ID, definition.id).label,
        position: view.position,
        target: view.sprite,
        interactionRadius: definition.interactionRadius,
        collisionRects: getMapObjectPosition(REGNEMONSTER_MAP_ID, definition.id).collisionRects
          ?? definition.collisionRects,
        applyPosition: () => {
          view.applyPosition();
          if (definition.id === 'prototypeHouse' || definition.id === 'gameHouse') {
            this.applyHousePositions();
          }
        }
      };
    });
    return [
      ...fixedBindings,
      ...[...this.libraryObjectViews.keys()].map((id) => this.getLibraryBinding(id)),
      ...[...this.townLifeViews.keys()].map((id) => this.getTownLifeBinding(id)),
      ...this.getInteriorEditorBindings('collector-house'),
      ...this.getInteriorEditorBindings('game-house')
    ];
  }

  public addLibraryObject(
    catalogId: string,
    position: { x: number; y: number }
  ): MapEditorObjectBinding {
    const mapPositions = MAP_OBJECT_POSITIONS[REGNEMONSTER_MAP_ID];
    const instance = createRegnemonsterLibraryInstance(
      catalogId,
      Object.keys(mapPositions),
      position
    );
    const config: EditableMapObjectPosition = {
      label: instance.label,
      catalogId: instance.catalogId,
      x: instance.x,
      y: instance.y,
      collisionRects: instance.collisionRects
    };
    mapPositions[instance.id] = config;
    this.createLibraryView(instance.id, config);
    return this.getLibraryBinding(instance.id);
  }

  public duplicateLibraryObject(id: string): MapEditorObjectBinding {
    const position = getMapObjectPosition(REGNEMONSTER_MAP_ID, id);
    if (!position.catalogId) {
      throw new Error('Bare bibliotekobjekter kan dupliseres.');
    }
    return this.addLibraryObject(position.catalogId, {
      x: Phaser.Math.Clamp(position.x + 48, 0, REGNEMONSTER_PROTOTYPE.width),
      y: Phaser.Math.Clamp(position.y + 48, 0, REGNEMONSTER_PROTOTYPE.height)
    });
  }

  public deleteLibraryObject(id: string): void {
    const position = getMapObjectPosition(REGNEMONSTER_MAP_ID, id);
    if (!position.catalogId) {
      throw new Error('Faste kartobjekter kan ikke slettes fra bibliotekverktøyet.');
    }
    this.libraryObjectViews.get(id)?.sprite.destroy();
    this.libraryObjectViews.delete(id);
    delete MAP_OBJECT_POSITIONS[REGNEMONSTER_MAP_ID][id];
  }

  public deleteEditableObject(id: string): void {
    if (this.libraryObjectViews.has(id)) {
      this.deleteLibraryObject(id);
      return;
    }
    const view = this.townLifeViews.get(id);
    if (!view?.position.removable) {
      throw new Error('Dette kartobjektet kan ikke slettes.');
    }
    view.sprite.destroy();
    this.townLifeViews.delete(id);
    delete MAP_OBJECT_POSITIONS[REGNEMONSTER_MAP_ID][id];
  }

  public isPositionWalkable(x: number, y: number): boolean {
    if (this.room !== 'town') {
      return isRegnemonsterRoomPositionWalkable(
        this.room,
        x,
        y,
        this.getInteriorCollisionRects(this.room)
      );
    }
    if (!isRegnemonsterPrototypePositionWalkable(
      x,
      y,
      this.getPositions(),
      this.getCollisionRects()
    )) {
      return false;
    }
    const blockedByTownLife = [...this.townLifeViews.values()].some((view) =>
      (view.position.collisionRects ?? view.definition.collisionRects ?? []).some((rect) => (
        x >= view.position.x + rect.x
        && x <= view.position.x + rect.x + rect.width
        && y >= view.position.y + rect.y
        && y <= view.position.y + rect.y + rect.height
      )));
    if (blockedByTownLife) {
      return false;
    }
    return isRegnemonsterLibraryPositionWalkable(
      x,
      y,
      [...this.libraryObjectViews.entries()].map(([id, view]) => ({
        id,
        label: view.position.label,
        catalogId: view.position.catalogId ?? '',
        x: view.position.x,
        y: view.position.y,
        collisionRects: view.position.collisionRects ?? []
      }))
    );
  }

  private applyHousePositions(): void {
    const collectorHouse = this.objectViews.get('prototypeHouse');
    if (collectorHouse) {
      collectorHouse.applyPosition();
      this.openDoor.setPosition(collectorHouse.position.x, collectorHouse.position.y - 144);
      this.townLabels[0]?.setPosition(
        collectorHouse.position.x + 72,
        collectorHouse.position.y - 182
      );
    }
    const gameHouse = this.objectViews.get('gameHouse');
    if (gameHouse) {
      gameHouse.applyPosition();
      this.gameOpenDoor.setPosition(gameHouse.position.x - 72, gameHouse.position.y - 144);
      this.townLabels[1]?.setPosition(gameHouse.position.x, gameHouse.position.y - 190);
    }
  }

  private applyInteriorPositions(): void {
    const binder = getMapObjectPosition(
      REGNEMONSTER_INTERIOR_MAP_IDS['collector-house'],
      'binder'
    );
    this.binderTable.setPosition(binder.x, binder.y - 40);
    this.binderMarker.setPosition(binder.x, binder.y);

    const gameConsole = getMapObjectPosition(
      REGNEMONSTER_INTERIOR_MAP_IDS['game-house'],
      'gameConsole'
    );
    this.gameConsoleMarker.setPosition(gameConsole.x, gameConsole.y);
  }

  private getInteriorCollisionRects(room: RegnemonsterInteriorRoomId): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const mapId = REGNEMONSTER_INTERIOR_MAP_IDS[room];
    const collisionId = room === 'collector-house'
      ? 'collectorRoomCollision'
      : 'gameRoomCollision';
    const anchor = getMapObjectPosition(mapId, collisionId);
    return (anchor.collisionRects ?? []).map((rect) => ({
      x: anchor.x + rect.x,
      y: anchor.y + rect.y,
      width: rect.width,
      height: rect.height
    }));
  }

  private getInteriorEditorBindings(
    room: RegnemonsterInteriorRoomId
  ): MapEditorObjectBinding[] {
    const mapId = REGNEMONSTER_INTERIOR_MAP_IDS[room];
    return getMapObjectPositions(mapId).map(({ id, position }) => ({
      mapId,
      maxX: REGNEMONSTER_PROTOTYPE.width,
      maxY: REGNEMONSTER_PROTOTYPE.height,
      id,
      label: position.label,
      position,
      interactionRadius: id === 'roomExit' ? 70 : 58,
      collisionRects: position.collisionRects,
      applyPosition: () => this.applyInteriorPositions()
    }));
  }

  private createTownLabel(text: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(0, 0, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#fff7d6',
        backgroundColor: '#17233ccc',
        padding: { x: 10, y: 5 },
        stroke: '#17233c',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(15);
  }

  private applyVisibility(): void {
    const townVisible = this.active && this.room === 'town';
    this.layers.forEach((layer) => layer.setVisible(townVisible));
    this.objectViews.forEach((view) => view.sprite.setVisible(townVisible));
    this.libraryObjectViews.forEach((view) => view.sprite.setVisible(townVisible));
    this.townLifeViews.forEach((view) => view.sprite.setVisible(townVisible));
    this.openDoor.setVisible(townVisible);
    this.gameOpenDoor.setVisible(townVisible);
    this.townLabels.forEach((label) => label.setVisible(townVisible));

    const collectorVisible = this.active && this.room === 'collector-house';
    this.collectorInterior.setVisible(collectorVisible);
    this.binderTable.setVisible(collectorVisible);
    this.binderMarker.setVisible(collectorVisible);

    const gameVisible = this.active && this.room === 'game-house';
    this.gameInterior.setVisible(gameVisible);
    this.gameConsoleMarker.setVisible(gameVisible);
  }

  private createLibraryView(id: string, position: EditableMapObjectPosition): void {
    const item = position.catalogId
      ? getRegnemonsterCatalogItem(position.catalogId)
      : undefined;
    if (!item) {
      throw new Error(`Mangler katalogelement for ${id}.`);
    }
    const sprite = this.scene.add
      .image(
        position.x,
        position.y,
        getRegnemonsterCatalogTextureKey(item.id)
      )
      .setOrigin(0.5, 1)
      .setScale(item.scale)
      .setDepth(14);
    sprite.setVisible(this.active && this.room === 'town');
    this.libraryObjectViews.set(id, { position, sprite });
  }

  private getLibraryBinding(id: string): MapEditorObjectBinding {
    const view = this.libraryObjectViews.get(id);
    if (!view || !view.position.catalogId) {
      throw new Error(`Mangler bibliotekvisning for ${id}.`);
    }
    return {
      mapId: REGNEMONSTER_MAP_ID,
      maxX: REGNEMONSTER_PROTOTYPE.width,
      maxY: REGNEMONSTER_PROTOTYPE.height,
      id,
      label: view.position.label,
      catalogId: view.position.catalogId,
      position: view.position,
      target: view.sprite,
      interactionRadius: 72,
      collisionRects: view.position.collisionRects ?? [],
      canDelete: true,
      applyPosition: () => view.sprite.setPosition(view.position.x, view.position.y)
    };
  }

  private createTownLifeAnimations(): void {
    for (const definition of REGNEMONSTER_TOWN_LIFE) {
      if (definition.animationKind === 'person') {
        const ranges: Array<[RegnemonsterTownLifeDirection, number, number]> = [
          ['down', 0, 2],
          ['left', 3, 5],
          ['right', 6, 8],
          ['up', 9, 11]
        ];
        ranges.forEach(([direction, start, end]) => {
          const key = `${definition.textureKey}-${direction}`;
          if (!this.scene.anims.exists(key)) {
            this.scene.anims.create({
              key,
              frames: this.scene.anims.generateFrameNumbers(definition.textureKey, { start, end }),
              frameRate: 7,
              repeat: -1
            });
          }
        });
        continue;
      }
      const key = `${definition.textureKey}-move`;
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNumbers(definition.textureKey, {
            start: 0,
            end: definition.frameCount - 1
          }),
          frameRate: definition.animationKind === 'crow' ? 12 : 9,
          repeat: -1
        });
      }
    }
  }

  private createTownLifeView(
    definition: RegnemonsterTownLifeDefinition,
    position: EditableMapObjectPosition
  ): void {
    const sprite = this.scene.add
      .sprite(position.x, position.y, definition.textureKey, 0)
      .setOrigin(0.5, definition.animationKind === 'fountain' ? 0.78 : 0.8)
      .setScale(definition.scale)
      .setDepth(definition.depth);
    if (definition.animationKind === 'person') {
      sprite.play(`${definition.textureKey}-down`);
    } else {
      sprite.play(`${definition.textureKey}-move`);
    }
    sprite.setVisible(this.active && this.room === 'town');
    this.townLifeViews.set(definition.id, { definition, position, sprite });
  }

  private applyTownLifeDirection(
    view: TownLifeView,
    direction: RegnemonsterTownLifeDirection
  ): void {
    if (view.definition.animationKind === 'person') {
      view.sprite.setFlip(false, false);
      view.sprite.play(`${view.definition.textureKey}-${direction}`, true);
      return;
    }
    view.sprite.setFlip(
      view.definition.route?.axis === 'horizontal' && direction === 'left',
      view.definition.animationKind === 'crow'
        && view.definition.route?.axis === 'vertical'
        && direction === 'up'
    );
  }

  private getTownLifeBinding(id: string): MapEditorObjectBinding {
    const view = this.townLifeViews.get(id);
    if (!view) {
      throw new Error(`Mangler levende kartobjekt for ${id}.`);
    }
    return {
      mapId: REGNEMONSTER_MAP_ID,
      maxX: REGNEMONSTER_PROTOTYPE.width,
      maxY: REGNEMONSTER_PROTOTYPE.height,
      id,
      label: view.position.label,
      position: view.position,
      target: view.sprite,
      interactionRadius: view.definition.animationKind === 'fountain' ? 74 : 48,
      collisionRects: view.position.collisionRects ?? view.definition.collisionRects ?? [],
      canDelete: view.position.removable === true,
      applyPosition: () => view.sprite.setPosition(view.position.x, view.position.y)
    };
  }
}
