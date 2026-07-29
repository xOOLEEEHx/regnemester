import Phaser from 'phaser';
import './mapEditor.css';
import {
  addCollisionRect,
  cloneCollisionRects,
  moveCollisionRect,
  removeCollisionRect,
  resizeCollisionRect,
  type EditableCollisionRect
} from './mapCollisionEditorModel';
import {
  getMapEditorCameraLimits,
  getMapEditorFitZoom,
  getMapEditorZoom,
  type MapEditorCameraLimits
} from './mapEditorCameraModel';

export type MapEditorPosition = {
  x: number;
  y: number;
};

export type MapEditorObjectBinding = {
  id: string;
  label: string;
  catalogId?: string;
  canDelete?: boolean;
  mapId: string;
  position: MapEditorPosition;
  target?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  interactionRadius: number;
  collisionRects?: EditableCollisionRect[];
  maxX: number;
  maxY: number;
  applyPosition: () => void;
};

export type MapEditorCatalogItem = {
  id: string;
  label: string;
  category: string;
  assetPath: string;
  mapId: string;
};

type MapEditorOptions = {
  scene: Phaser.Scene;
  objects: MapEditorObjectBinding[];
  getActiveMapId: () => string;
  onEditingChange: (active: boolean) => void;
  focusObject: (position: MapEditorPosition) => void;
  catalogItems?: MapEditorCatalogItem[];
  addCatalogObject?: (
    catalogId: string,
    position: MapEditorPosition
  ) => MapEditorObjectBinding;
  duplicateObject?: (binding: MapEditorObjectBinding) => MapEditorObjectBinding;
  deleteObject?: (binding: MapEditorObjectBinding) => void;
};

type ObjectMarker = {
  area: Phaser.GameObjects.Arc;
  anchor: Phaser.GameObjects.Arc;
  coordinates: Phaser.GameObjects.Text;
  collisionAreas: Phaser.GameObjects.Rectangle[];
  collisionHandles: Phaser.GameObjects.Rectangle[];
};

type DragHandlers = {
  pointerdown: () => void;
  dragstart: (pointer: Phaser.Input.Pointer) => void;
  drag: (pointer: Phaser.Input.Pointer) => void;
  targets: Array<Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc>;
};

type UndoPosition = {
  kind: 'object';
  id: string;
  x: number;
  y: number;
};

type UndoCollision = {
  kind: 'collision';
  id: string;
  rects: EditableCollisionRect[];
};

type EditorMode = 'objects' | 'collision' | 'library';
type UndoState = UndoPosition | UndoCollision;

const SAVE_ROUTE = '/__dev/map-object-positions';

export class TallvokterMapEditor {
  private readonly root: HTMLDivElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly panel: HTMLElement;
  private readonly panelHeading: HTMLElement;
  private readonly objectList: HTMLDivElement;
  private readonly objectModeButton: HTMLButtonElement;
  private readonly collisionModeButton: HTMLButtonElement;
  private readonly libraryModeButton: HTMLButtonElement;
  private readonly selectionPanel: HTMLDivElement;
  private readonly libraryControls: HTMLDivElement;
  private readonly libraryCategory: HTMLSelectElement;
  private readonly libraryGrid: HTMLDivElement;
  private readonly collisionControls: HTMLDivElement;
  private readonly collisionSelect: HTMLSelectElement;
  private readonly collisionOutput: HTMLOutputElement;
  private readonly addCollisionButton: HTMLButtonElement;
  private readonly deleteCollisionButton: HTMLButtonElement;
  private readonly duplicateObjectButton: HTMLButtonElement;
  private readonly deleteObjectButton: HTMLButtonElement;
  private readonly selectedTitle: HTMLElement;
  private readonly selectedId: HTMLElement;
  private readonly coordinateOutput: HTMLOutputElement;
  private readonly status: HTMLParagraphElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly zoomOutButton: HTMLButtonElement;
  private readonly zoomInButton: HTMLButtonElement;
  private readonly fitMapButton: HTMLButtonElement;
  private readonly cameraZoomOutput: HTMLOutputElement;
  private readonly markers = new Map<string, ObjectMarker>();
  private readonly dragHandlers = new Map<string, DragHandlers>();
  private readonly sessionStart = new Map<string, MapEditorPosition>();
  private readonly sessionCollisionStart = new Map<string, EditableCollisionRect[]>();
  private readonly collisionDragCleanups: Array<() => void> = [];
  private active = false;
  private mode: EditorMode = 'objects';
  private selectedIdValue?: string;
  private selectedCollisionIndex = 0;
  private undoPosition?: UndoState;
  private dragOffset?: { id: string; x: number; y: number };
  private initialCameraZoom = 1;
  private cameraLimits: MapEditorCameraLimits = { minZoom: 0.25, maxZoom: 2 };
  private spacePanHeld = false;
  private cameraPanPointerId?: number;
  private cameraPanLast?: { x: number; y: number };
  private panelDragPointerId?: number;
  private panelDragOffset?: { x: number; y: number };

  private readonly stopPanelPointerPropagation = (event: Event): void => {
    event.stopPropagation();
  };

  private readonly handlePanelPointerDown = (event: PointerEvent): void => {
    if ((event.target as Element | null)?.closest('button')) {
      return;
    }
    const rect = this.panel.getBoundingClientRect();
    this.panelDragPointerId = event.pointerId;
    this.panelDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    this.panelHeading.setPointerCapture(event.pointerId);
    this.panel.classList.add('is-dragging');
    event.preventDefault();
  };

  private readonly handlePanelPointerMove = (event: PointerEvent): void => {
    if (this.panelDragPointerId !== event.pointerId || !this.panelDragOffset) {
      return;
    }
    const rect = this.panel.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    const left = Phaser.Math.Clamp(event.clientX - this.panelDragOffset.x, 8, maxLeft);
    const top = Phaser.Math.Clamp(event.clientY - this.panelDragOffset.y, 8, maxTop);
    this.panel.style.left = `${Math.round(left)}px`;
    this.panel.style.top = `${Math.round(top)}px`;
    this.panel.style.bottom = 'auto';
  };

  private readonly handlePanelPointerUp = (event: PointerEvent): void => {
    if (this.panelDragPointerId !== event.pointerId) {
      return;
    }
    if (this.panelHeading.hasPointerCapture(event.pointerId)) {
      this.panelHeading.releasePointerCapture(event.pointerId);
    }
    this.panelDragPointerId = undefined;
    this.panelDragOffset = undefined;
    this.panel.classList.remove('is-dragging');
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.active) {
      return;
    }
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      return;
    }

    if (event.code === 'Space') {
      this.spacePanHeld = true;
      event.preventDefault();
      return;
    }

    const cameraDirection = event.key.toLowerCase();
    if (cameraDirection === 'w' || cameraDirection === 'a' || cameraDirection === 's' || cameraDirection === 'd') {
      event.preventDefault();
      event.stopPropagation();
      const distance = event.shiftKey ? 320 : 150;
      if (cameraDirection === 'w') this.panCamera(0, -distance);
      if (cameraDirection === 'a') this.panCamera(-distance, 0);
      if (cameraDirection === 's') this.panCamera(0, distance);
      if (cameraDirection === 'd') this.panCamera(distance, 0);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.changeCameraZoom('in');
      return;
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      this.changeCameraZoom('out');
      return;
    }
    if (event.key === '0') {
      event.preventDefault();
      this.fitMapInView();
      return;
    }

    if (!this.selectedIdValue || !event.key.startsWith('Arrow')) {
      return;
    }
    const binding = this.getSelectedBinding();
    if (!binding) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (event.key === 'ArrowLeft') dx = -step;
    if (event.key === 'ArrowRight') dx = step;
    if (event.key === 'ArrowUp') dy = -step;
    if (event.key === 'ArrowDown') dy = step;
    if (this.mode === 'collision') {
      const rect = binding.collisionRects?.[this.selectedCollisionIndex];
      if (!rect) {
        return;
      }
      this.rememberCollisionUndo(binding);
      this.replaceCollisionRect(
        binding,
        this.selectedCollisionIndex,
        moveCollisionRect(rect, dx, dy)
      );
      return;
    }
    this.rememberUndo(binding);
    this.moveBinding(binding, binding.position.x + dx, binding.position.y + dy);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      this.spacePanHeld = false;
      this.cameraPanPointerId = undefined;
      this.cameraPanLast = undefined;
    }
  };

  private readonly handleCameraPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this.active || !this.spacePanHeld || this.panelDragPointerId !== undefined) {
      return;
    }
    pointer.event?.preventDefault?.();
    this.cameraPanPointerId = pointer.id;
    this.cameraPanLast = { x: pointer.x, y: pointer.y };
  };

  private readonly handleCameraPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (
      !this.active
      || this.panelDragPointerId !== undefined
      || this.cameraPanPointerId !== pointer.id
      || !pointer.isDown
      || !this.cameraPanLast
    ) {
      return;
    }
    const dx = pointer.x - this.cameraPanLast.x;
    const dy = pointer.y - this.cameraPanLast.y;
    this.cameraPanLast = { x: pointer.x, y: pointer.y };
    const camera = this.options.scene.cameras.main;
    camera.scrollX -= dx / camera.zoom;
    camera.scrollY -= dy / camera.zoom;
    this.clampCameraToMap();
  };

  private readonly handleCameraPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (this.cameraPanPointerId === pointer.id) {
      this.cameraPanPointerId = undefined;
      this.cameraPanLast = undefined;
    }
  };

  private readonly handleCameraWheel = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    if (!this.active || deltaY === 0) {
      return;
    }
    this.changeCameraZoom(deltaY < 0 ? 'in' : 'out');
  };

  constructor(private readonly options: MapEditorOptions) {
    this.root = document.createElement('div');
    this.root.className = 'map-editor-root';
    this.root.innerHTML = `
      <button class="map-editor-toggle" type="button">Rediger kart</button>
      <aside class="map-editor-panel" aria-label="Lokal kartredigering" hidden>
        <div class="map-editor-heading">
          <div><small>Kun lokal development · dra vinduet her</small><strong>Kartredigering</strong></div>
          <button class="map-editor-close" type="button" aria-label="Avslutt kartredigering">×</button>
        </div>
        <p class="map-editor-help">Dra objekter eller bruk piltastene. Flytt kameraet med WASD, eller hold mellomrom og dra i kartet.</p>
        <section class="map-editor-camera" aria-label="Kamerakontroller">
          <strong>Kartvisning</strong>
          <div class="map-editor-zoom-controls">
            <button class="map-editor-zoom-out" type="button" aria-label="Zoom ut">−</button>
            <output class="map-editor-zoom-output">100 %</output>
            <button class="map-editor-zoom-in" type="button" aria-label="Zoom inn">+</button>
            <button class="map-editor-fit-map" type="button">Vis hele kartet</button>
          </div>
          <div class="map-editor-pan-controls" aria-label="Flytt kartvisningen">
            <span></span>
            <button type="button" data-camera-dy="-180" aria-label="Flytt kartvisningen opp">↑</button>
            <span></span>
            <button type="button" data-camera-dx="-180" aria-label="Flytt kartvisningen til venstre">←</button>
            <button type="button" data-camera-dy="180" aria-label="Flytt kartvisningen ned">↓</button>
            <button type="button" data-camera-dx="180" aria-label="Flytt kartvisningen til høyre">→</button>
          </div>
          <small>Musehjul zoomer. Tast 0 viser hele kartet.</small>
        </section>
        <div class="map-editor-modes" role="tablist" aria-label="Redigeringsmodus">
          <button class="map-editor-mode-objects is-active" type="button" role="tab">Objekter</button>
          <button class="map-editor-mode-collision" type="button" role="tab">Kollisjon</button>
          <button class="map-editor-mode-library" type="button" role="tab">Bibliotek</button>
        </div>
        <div class="map-editor-object-list"></div>
        <div class="map-editor-selection" aria-live="polite">
          <strong class="map-editor-selected-title">Ingen objekt valgt</strong>
          <code class="map-editor-selected-id">–</code>
          <output class="map-editor-coordinates">X: –  Y: –</output>
        </div>
        <div class="map-editor-collision-controls" hidden>
          <label for="map-editor-collision-select">Kollisjonsfelt</label>
          <select id="map-editor-collision-select" class="map-editor-collision-select"></select>
          <output class="map-editor-collision-output"></output>
          <div>
            <button class="map-editor-add-collision" type="button">+ Nytt felt</button>
            <button class="map-editor-delete-collision" type="button">Slett felt</button>
          </div>
          <p>Dra feltet for å flytte det. Dra håndtaket nederst til høyre for å endre størrelse.</p>
        </div>
        <div class="map-editor-library-controls" hidden>
          <label for="map-editor-library-category">Kategori</label>
          <select id="map-editor-library-category" class="map-editor-library-category"></select>
          <div class="map-editor-library-grid"></div>
          <p>Trykk på et element for å plassere det midt i det synlige kartområdet.</p>
        </div>
        <div class="map-editor-actions">
          <button class="map-editor-undo" type="button" disabled>Angre siste flytting</button>
          <button class="map-editor-reset" type="button" disabled>Nullstill valgt objekt</button>
          <button class="map-editor-duplicate-object" type="button">Dupliser objekt</button>
          <button class="map-editor-delete-object" type="button">Slett objekt</button>
          <button class="map-editor-save" type="button">Lagre kartendringer</button>
        </div>
        <p class="map-editor-status" aria-live="polite"></p>
      </aside>
    `;

    this.toggleButton = this.requireElement('.map-editor-toggle');
    this.panel = this.requireElement('.map-editor-panel');
    this.panelHeading = this.requireElement('.map-editor-heading');
    this.objectList = this.requireElement('.map-editor-object-list');
    this.objectModeButton = this.requireElement('.map-editor-mode-objects');
    this.collisionModeButton = this.requireElement('.map-editor-mode-collision');
    this.libraryModeButton = this.requireElement('.map-editor-mode-library');
    this.selectionPanel = this.requireElement('.map-editor-selection');
    this.libraryControls = this.requireElement('.map-editor-library-controls');
    this.libraryCategory = this.requireElement('.map-editor-library-category');
    this.libraryGrid = this.requireElement('.map-editor-library-grid');
    this.collisionControls = this.requireElement('.map-editor-collision-controls');
    this.collisionSelect = this.requireElement('.map-editor-collision-select');
    this.collisionOutput = this.requireElement('.map-editor-collision-output');
    this.addCollisionButton = this.requireElement('.map-editor-add-collision');
    this.deleteCollisionButton = this.requireElement('.map-editor-delete-collision');
    this.duplicateObjectButton = this.requireElement('.map-editor-duplicate-object');
    this.deleteObjectButton = this.requireElement('.map-editor-delete-object');
    this.selectedTitle = this.requireElement('.map-editor-selected-title');
    this.selectedId = this.requireElement('.map-editor-selected-id');
    this.coordinateOutput = this.requireElement('.map-editor-coordinates');
    this.status = this.requireElement('.map-editor-status');
    this.undoButton = this.requireElement('.map-editor-undo');
    this.resetButton = this.requireElement('.map-editor-reset');
    this.saveButton = this.requireElement('.map-editor-save');
    this.zoomOutButton = this.requireElement('.map-editor-zoom-out');
    this.zoomInButton = this.requireElement('.map-editor-zoom-in');
    this.fitMapButton = this.requireElement('.map-editor-fit-map');
    this.cameraZoomOutput = this.requireElement('.map-editor-zoom-output');

    this.toggleButton.addEventListener('click', () => this.setActive(!this.active));
    this.objectModeButton.addEventListener('click', () => this.setMode('objects'));
    this.collisionModeButton.addEventListener('click', () => this.setMode('collision'));
    this.libraryModeButton.addEventListener('click', () => this.setMode('library'));
    this.libraryCategory.addEventListener('change', () => this.renderLibrary());
    this.collisionSelect.addEventListener('change', () => {
      this.selectedCollisionIndex = Math.max(0, Number(this.collisionSelect.value) || 0);
      this.renderCollisionControls();
      this.refreshMarkers();
    });
    this.addCollisionButton.addEventListener('click', () => this.addCollision());
    this.deleteCollisionButton.addEventListener('click', () => this.deleteCollision());
    this.duplicateObjectButton.addEventListener('click', () => this.duplicateSelectedObject());
    this.deleteObjectButton.addEventListener('click', () => this.deleteSelectedObject());
    this.requireElement<HTMLButtonElement>('.map-editor-close').addEventListener('click', () => this.setActive(false));
    this.undoButton.addEventListener('click', () => this.undoLastMove());
    this.resetButton.addEventListener('click', () => this.resetSelected());
    this.saveButton.addEventListener('click', () => void this.savePositions());
    this.zoomOutButton.addEventListener('click', () => this.changeCameraZoom('out'));
    this.zoomInButton.addEventListener('click', () => this.changeCameraZoom('in'));
    this.fitMapButton.addEventListener('click', () => this.fitMapInView());
    this.panel.addEventListener('pointerdown', this.stopPanelPointerPropagation);
    this.panel.addEventListener('pointermove', this.stopPanelPointerPropagation);
    this.panel.addEventListener('pointerup', this.stopPanelPointerPropagation);
    this.panel.addEventListener('pointercancel', this.stopPanelPointerPropagation);
    this.panel.addEventListener('wheel', this.stopPanelPointerPropagation);
    this.panelHeading.addEventListener('pointerdown', this.handlePanelPointerDown);
    this.panelHeading.addEventListener('pointermove', this.handlePanelPointerMove);
    this.panelHeading.addEventListener('pointerup', this.handlePanelPointerUp);
    this.panelHeading.addEventListener('pointercancel', this.handlePanelPointerUp);
    this.root.querySelectorAll<HTMLButtonElement>('[data-camera-dx], [data-camera-dy]').forEach((button) => {
      button.addEventListener('click', () => this.panCamera(
        Number(button.dataset.cameraDx ?? 0),
        Number(button.dataset.cameraDy ?? 0)
      ));
    });
    document.body.append(this.root);
    this.renderObjectList();
    this.renderLibraryCategories();
    this.renderLibrary();
  }

  public setAvailable(available: boolean): void {
    this.root.classList.toggle('is-unavailable', !available);
    this.toggleButton.disabled = !available;
    if (!available && this.active) {
      this.setActive(false);
    }
  }

  public refreshForActiveMap(): void {
    if (this.active) {
      this.setActive(false);
    }
    this.selectedIdValue = undefined;
    this.mode = 'objects';
    this.selectedCollisionIndex = 0;
    this.undoPosition = undefined;
    this.renderObjectList();
    this.renderSelection();
    this.renderLibraryCategories();
    this.setAvailable(this.getActiveObjects().length > 0);
    this.renderMode();
  }

  public destroy(): void {
    this.setActive(false);
    this.panel.removeEventListener('pointerdown', this.stopPanelPointerPropagation);
    this.panel.removeEventListener('pointermove', this.stopPanelPointerPropagation);
    this.panel.removeEventListener('pointerup', this.stopPanelPointerPropagation);
    this.panel.removeEventListener('pointercancel', this.stopPanelPointerPropagation);
    this.panel.removeEventListener('wheel', this.stopPanelPointerPropagation);
    this.panelHeading.removeEventListener('pointerdown', this.handlePanelPointerDown);
    this.panelHeading.removeEventListener('pointermove', this.handlePanelPointerMove);
    this.panelHeading.removeEventListener('pointerup', this.handlePanelPointerUp);
    this.panelHeading.removeEventListener('pointercancel', this.handlePanelPointerUp);
    this.root.remove();
  }

  private setActive(active: boolean): void {
    if (active === this.active) {
      return;
    }
    const activeObjects = this.getActiveObjects();
    if (active && activeObjects.length === 0) {
      this.setStatus('Dette kartet har ingen flyttbare objekter ennå.', true);
      return;
    }

    this.active = active;
    this.panel.hidden = !active;
    this.toggleButton.textContent = active ? 'Avslutt redigering' : 'Rediger kart';
    this.toggleButton.classList.toggle('is-active', active);
    this.status.textContent = '';

    if (active) {
      this.sessionStart.clear();
      this.sessionCollisionStart.clear();
      for (const binding of activeObjects) {
        this.sessionStart.set(binding.id, { x: binding.position.x, y: binding.position.y });
        this.sessionCollisionStart.set(
          binding.id,
          cloneCollisionRects(binding.collisionRects ?? [])
        );
      }
      this.undoPosition = undefined;
      this.createMarkers();
      this.bindDraggingForMode();
      window.addEventListener('keydown', this.handleKeyDown, true);
      window.addEventListener('keyup', this.handleKeyUp, true);
      this.options.onEditingChange(true);
      this.activateCameraControls();
      this.selectObject(activeObjects[0]?.id, false);
    } else {
      window.removeEventListener('keydown', this.handleKeyDown, true);
      window.removeEventListener('keyup', this.handleKeyUp, true);
      this.deactivateCameraControls();
      this.unbindObjectDragging();
      this.unbindCollisionDragging();
      this.destroyMarkers();
      this.selectedIdValue = undefined;
      this.options.onEditingChange(false);
      this.renderSelection();
    }
    this.renderObjectList();
    this.renderMode();
  }

  private activateCameraControls(): void {
    const camera = this.options.scene.cameras.main;
    const { width: mapWidth, height: mapHeight } = this.getActiveMapSize();
    this.initialCameraZoom = camera.zoom;
    const fitZoom = getMapEditorFitZoom(camera.width, camera.height, mapWidth, mapHeight);
    this.cameraLimits = getMapEditorCameraLimits(fitZoom, this.initialCameraZoom);
    this.options.scene.input.on('pointerdown', this.handleCameraPointerDown);
    this.options.scene.input.on('pointermove', this.handleCameraPointerMove);
    this.options.scene.input.on('pointerup', this.handleCameraPointerUp);
    this.options.scene.input.on('wheel', this.handleCameraWheel);
    this.updateCameraControls();
  }

  private deactivateCameraControls(): void {
    this.options.scene.input.off('pointerdown', this.handleCameraPointerDown);
    this.options.scene.input.off('pointermove', this.handleCameraPointerMove);
    this.options.scene.input.off('pointerup', this.handleCameraPointerUp);
    this.options.scene.input.off('wheel', this.handleCameraWheel);
    this.spacePanHeld = false;
    this.cameraPanPointerId = undefined;
    this.cameraPanLast = undefined;
    this.options.scene.cameras.main.setZoom(this.initialCameraZoom);
  }

  private changeCameraZoom(direction: 'in' | 'out'): void {
    const camera = this.options.scene.cameras.main;
    camera.setZoom(getMapEditorZoom(camera.zoom, direction, this.cameraLimits));
    this.clampCameraToMap();
    this.updateCameraControls();
  }

  private fitMapInView(): void {
    const camera = this.options.scene.cameras.main;
    const { width, height } = this.getActiveMapSize();
    camera.setZoom(this.cameraLimits.minZoom);
    camera.centerOn(width / 2, height / 2);
    this.updateCameraControls();
  }

  private panCamera(dx: number, dy: number): void {
    const camera = this.options.scene.cameras.main;
    camera.scrollX += dx / camera.zoom;
    camera.scrollY += dy / camera.zoom;
    this.clampCameraToMap();
  }

  private clampCameraToMap(): void {
    const camera = this.options.scene.cameras.main;
    const { width, height } = this.getActiveMapSize();
    const viewWidth = camera.width / Math.max(camera.zoom, 0.01);
    const viewHeight = camera.height / Math.max(camera.zoom, 0.01);
    camera.scrollX = viewWidth >= width
      ? (width - viewWidth) / 2
      : Phaser.Math.Clamp(camera.scrollX, 0, width - viewWidth);
    camera.scrollY = viewHeight >= height
      ? (height - viewHeight) / 2
      : Phaser.Math.Clamp(camera.scrollY, 0, height - viewHeight);
  }

  private getActiveMapSize(): { width: number; height: number } {
    const activeObjects = this.getActiveObjects();
    return {
      width: Math.max(1, ...activeObjects.map((binding) => binding.maxX)),
      height: Math.max(1, ...activeObjects.map((binding) => binding.maxY))
    };
  }

  private updateCameraControls(): void {
    const zoom = this.options.scene.cameras.main.zoom;
    this.cameraZoomOutput.textContent = `${Math.round((zoom / this.initialCameraZoom) * 100)} %`;
    this.zoomOutButton.disabled = zoom <= this.cameraLimits.minZoom + 0.001;
    this.zoomInButton.disabled = zoom >= this.cameraLimits.maxZoom - 0.001;
  }

  private setMode(mode: EditorMode): void {
    if (!this.active || mode === this.mode) {
      return;
    }
    this.mode = mode;
    this.selectedCollisionIndex = 0;
    this.undoPosition = undefined;
    this.unbindObjectDragging();
    this.unbindCollisionDragging();
    this.bindDraggingForMode();
    this.renderMode();
    this.renderSelection();
    this.refreshMarkers();
  }

  private bindDraggingForMode(): void {
    if (this.mode === 'collision') {
      this.bindCollisionDragging();
    } else if (this.mode === 'objects') {
      this.bindObjectDragging();
    }
  }

  private bindObjectDragging(): void {
    for (const binding of this.getActiveObjects()) {
      const marker = this.markers.get(binding.id);
      const targets = [binding.target, marker?.area, marker?.anchor].filter(
        (target): target is Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc => Boolean(target)
      );
      const handlers: DragHandlers = {
        pointerdown: () => {
          if (!this.spacePanHeld && this.panelDragPointerId === undefined) {
            this.selectObject(binding.id, false);
          }
        },
        dragstart: (pointer) => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          this.selectObject(binding.id, false);
          this.rememberUndo(binding);
          const worldPoint = this.options.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.dragOffset = {
            id: binding.id,
            x: binding.position.x - worldPoint.x,
            y: binding.position.y - worldPoint.y
          };
        },
        drag: (pointer) => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          const worldPoint = this.options.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          const offset = this.dragOffset?.id === binding.id ? this.dragOffset : { x: 0, y: 0 };
          this.moveBinding(binding, worldPoint.x + offset.x, worldPoint.y + offset.y);
        },
        targets
      };
      for (const target of targets) {
        target.setInteractive({ useHandCursor: true });
        this.options.scene.input.setDraggable(target, true);
        target.on('pointerdown', handlers.pointerdown);
        target.on('dragstart', handlers.dragstart);
        target.on('drag', handlers.drag);
      }
      this.dragHandlers.set(binding.id, handlers);
    }
  }

  private unbindObjectDragging(): void {
    for (const binding of this.options.objects) {
      const handlers = this.dragHandlers.get(binding.id);
      if (handlers) {
        for (const target of handlers.targets) {
          target.off('pointerdown', handlers.pointerdown);
          target.off('dragstart', handlers.dragstart);
          target.off('drag', handlers.drag);
          this.options.scene.input.setDraggable(target, false);
          target.disableInteractive();
        }
      }
    }
    this.dragHandlers.clear();
    this.dragOffset = undefined;
  }

  private bindCollisionDragging(): void {
    for (const binding of this.getActiveObjects()) {
      const marker = this.markers.get(binding.id);
      if (!marker) {
        continue;
      }
      (binding.collisionRects ?? []).forEach((rect, index) => {
        const area = marker.collisionAreas[index];
        const handle = marker.collisionHandles[index];
        if (!area || !handle) {
          return;
        }

        let offset = { x: 0, y: 0 };
        const select = () => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          this.selectObject(binding.id, false);
          this.selectedCollisionIndex = index;
          this.renderCollisionControls();
          this.refreshMarkers();
        };
        const moveStart = (pointer: Phaser.Input.Pointer) => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          select();
          this.rememberCollisionUndo(binding);
          const world = this.options.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          offset = {
            x: rect.x - (world.x - binding.position.x),
            y: rect.y - (world.y - binding.position.y)
          };
        };
        const move = (pointer: Phaser.Input.Pointer) => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          const current = binding.collisionRects?.[index];
          if (!current) {
            return;
          }
          const world = this.options.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.replaceCollisionRect(binding, index, {
            ...current,
            x: Math.round(world.x - binding.position.x + offset.x),
            y: Math.round(world.y - binding.position.y + offset.y)
          });
        };
        const resizeStart = () => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          select();
          this.rememberCollisionUndo(binding);
        };
        const resize = (pointer: Phaser.Input.Pointer) => {
          if (this.spacePanHeld || this.panelDragPointerId !== undefined) {
            return;
          }
          const current = binding.collisionRects?.[index];
          if (!current) {
            return;
          }
          const world = this.options.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.replaceCollisionRect(
            binding,
            index,
            resizeCollisionRect(
              current,
              world.x - binding.position.x - current.x,
              world.y - binding.position.y - current.y
            )
          );
        };

        area.setInteractive({ useHandCursor: true });
        handle.setInteractive({ useHandCursor: true });
        this.options.scene.input.setDraggable(area, true);
        this.options.scene.input.setDraggable(handle, true);
        area.on('pointerdown', select);
        area.on('dragstart', moveStart);
        area.on('drag', move);
        handle.on('pointerdown', select);
        handle.on('dragstart', resizeStart);
        handle.on('drag', resize);
        this.collisionDragCleanups.push(() => {
          area.off('pointerdown', select);
          area.off('dragstart', moveStart);
          area.off('drag', move);
          handle.off('pointerdown', select);
          handle.off('dragstart', resizeStart);
          handle.off('drag', resize);
          this.options.scene.input.setDraggable(area, false);
          this.options.scene.input.setDraggable(handle, false);
          area.disableInteractive();
          handle.disableInteractive();
        });
      });
    }
  }

  private unbindCollisionDragging(): void {
    this.collisionDragCleanups.splice(0).forEach((cleanup) => cleanup());
  }

  private createMarkers(): void {
    for (const binding of this.getActiveObjects()) {
      const area = this.options.scene.add.circle(
        binding.position.x,
        binding.position.y,
        binding.interactionRadius,
        0x14dff2,
        0.045
      ).setStrokeStyle(3, 0x55f3ff, 0.48).setDepth(190);
      const anchor = this.options.scene.add.circle(binding.position.x, binding.position.y, 7, 0xffe45c, 1)
        .setStrokeStyle(3, 0x102a3d, 1)
        .setDepth(192);
      const coordinates = this.options.scene.add.text(
        binding.position.x,
        binding.position.y - binding.interactionRadius - 18,
        '',
        {
          fontFamily: 'Consolas, monospace',
          fontSize: '20px',
          fontStyle: '700',
          color: '#ffffff',
          backgroundColor: '#0b253ddd',
          padding: { x: 8, y: 5 }
        }
      ).setOrigin(0.5).setDepth(193);
      const collisionAreas = (binding.collisionRects ?? []).map((rect) => (
        this.options.scene.add
          .rectangle(
            binding.position.x + rect.x,
            binding.position.y + rect.y,
            rect.width,
            rect.height,
            0xff3d67,
            0.11
          )
          .setOrigin(0)
          .setStrokeStyle(3, 0xff6685, 0.9)
          .setDepth(191)
      ));
      const collisionHandles = (binding.collisionRects ?? []).map((rect) => (
        this.options.scene.add
          .rectangle(
            binding.position.x + rect.x + rect.width,
            binding.position.y + rect.y + rect.height,
            18,
            18,
            0xffe45c,
            1
          )
          .setStrokeStyle(3, 0x402d00, 1)
          .setDepth(194)
      ));
      this.markers.set(binding.id, {
        area,
        anchor,
        coordinates,
        collisionAreas,
        collisionHandles
      });
    }
    this.refreshMarkers();
  }

  private destroyMarkers(): void {
    for (const marker of this.markers.values()) {
      marker.area.destroy();
      marker.anchor.destroy();
      marker.coordinates.destroy();
      marker.collisionAreas.forEach((area) => area.destroy());
      marker.collisionHandles.forEach((handle) => handle.destroy());
    }
    this.markers.clear();
  }

  private selectObject(id?: string, focus = true): void {
    if (!id || !this.getActiveObjects().some((binding) => binding.id === id)) {
      return;
    }
    this.selectedIdValue = id;
    const binding = this.getSelectedBinding();
    this.selectedCollisionIndex = Math.min(
      this.selectedCollisionIndex,
      Math.max(0, (binding?.collisionRects?.length ?? 1) - 1)
    );
    if (binding && focus) {
      this.options.focusObject(binding.position);
    }
    this.renderObjectList();
    this.renderSelection();
    this.renderCollisionControls();
    this.refreshMarkers();
  }

  private moveBinding(binding: MapEditorObjectBinding, x: number, y: number): void {
    binding.position.x = Phaser.Math.Clamp(Math.round(x), 0, binding.maxX);
    binding.position.y = Phaser.Math.Clamp(Math.round(y), 0, binding.maxY);
    binding.applyPosition();
    this.renderObjectList();
    this.renderSelection();
    this.refreshMarkers();
  }

  private replaceCollisionRect(
    binding: MapEditorObjectBinding,
    index: number,
    rect: EditableCollisionRect
  ): void {
    if (!binding.collisionRects?.[index]) {
      return;
    }
    Object.assign(binding.collisionRects[index], rect);
    this.renderCollisionControls();
    this.refreshMarkers();
  }

  private replaceCollisionRects(
    binding: MapEditorObjectBinding,
    rects: readonly EditableCollisionRect[]
  ): void {
    if (!binding.collisionRects) {
      binding.collisionRects = [];
    }
    binding.collisionRects.splice(
      0,
      binding.collisionRects.length,
      ...cloneCollisionRects(rects)
    );
    this.selectedCollisionIndex = Math.min(
      this.selectedCollisionIndex,
      Math.max(0, binding.collisionRects.length - 1)
    );
    this.rebuildMarkers();
    this.renderCollisionControls();
  }

  private rebuildMarkers(): void {
    this.unbindObjectDragging();
    this.unbindCollisionDragging();
    this.destroyMarkers();
    this.createMarkers();
    this.bindDraggingForMode();
  }

  private addCollision(): void {
    const binding = this.getSelectedBinding();
    if (!binding) {
      return;
    }
    this.rememberCollisionUndo(binding);
    const rects = addCollisionRect(binding.collisionRects ?? [], { x: -32, y: -32 });
    this.selectedCollisionIndex = rects.length - 1;
    this.replaceCollisionRects(binding, rects);
  }

  private deleteCollision(): void {
    const binding = this.getSelectedBinding();
    if (!binding?.collisionRects?.[this.selectedCollisionIndex]) {
      return;
    }
    this.rememberCollisionUndo(binding);
    this.replaceCollisionRects(
      binding,
      removeCollisionRect(binding.collisionRects, this.selectedCollisionIndex)
    );
  }

  private rememberUndo(binding: MapEditorObjectBinding): void {
    this.undoPosition = {
      kind: 'object',
      id: binding.id,
      x: binding.position.x,
      y: binding.position.y
    };
    this.undoButton.disabled = false;
  }

  private rememberCollisionUndo(binding: MapEditorObjectBinding): void {
    this.undoPosition = {
      kind: 'collision',
      id: binding.id,
      rects: cloneCollisionRects(binding.collisionRects ?? [])
    };
    this.undoButton.disabled = false;
  }

  private undoLastMove(): void {
    const undo = this.undoPosition;
    if (!undo) {
      return;
    }
    const binding = this.getActiveObjects().find((candidate) => candidate.id === undo.id);
    this.undoPosition = undefined;
    this.undoButton.disabled = true;
    if (!binding) {
      return;
    }
    this.selectObject(binding.id, true);
    if (undo.kind === 'collision') {
      this.replaceCollisionRects(binding, undo.rects);
    } else {
      this.moveBinding(binding, undo.x, undo.y);
    }
  }

  private resetSelected(): void {
    const binding = this.getSelectedBinding();
    const original = binding ? this.sessionStart.get(binding.id) : undefined;
    if (!binding || !original) {
      return;
    }
    if (this.mode === 'collision') {
      const originalCollision = this.sessionCollisionStart.get(binding.id) ?? [];
      this.rememberCollisionUndo(binding);
      this.replaceCollisionRects(binding, originalCollision);
      return;
    }
    this.rememberUndo(binding);
    this.moveBinding(binding, original.x, original.y);
  }

  private async savePositions(): Promise<void> {
    const mapId = this.options.getActiveMapId();
    const activeObjects = this.getActiveObjects();
    const positions = Object.fromEntries(activeObjects.map((binding) => [
      binding.id,
      {
        x: Math.round(binding.position.x),
        y: Math.round(binding.position.y),
        ...(binding.catalogId ? { catalogId: binding.catalogId } : {}),
        ...(binding.collisionRects
          ? { collisionRects: cloneCollisionRects(binding.collisionRects) }
          : {})
      }
    ]));

    this.saveButton.disabled = true;
    this.setStatus('Lagrer plasseringene ...');
    try {
      const response = await fetch(SAVE_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId, positions })
      });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Kunne ikke lagre plasseringene.');
      }
      for (const binding of activeObjects) {
        this.sessionStart.set(binding.id, { x: binding.position.x, y: binding.position.y });
        this.sessionCollisionStart.set(
          binding.id,
          cloneCollisionRects(binding.collisionRects ?? [])
        );
      }
      this.undoPosition = undefined;
      this.undoButton.disabled = true;
      this.setStatus('Kartendringene er lagret.');
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : 'Kunne ikke lagre plasseringene.', true);
    } finally {
      this.saveButton.disabled = false;
    }
  }

  private renderObjectList(): void {
    this.objectList.replaceChildren(...this.getActiveObjects().map((binding) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'map-editor-object';
      button.classList.toggle('is-selected', this.selectedIdValue === binding.id);
      button.innerHTML = '<span></span><code></code><output></output>';
      const name = button.querySelector('span');
      const id = button.querySelector('code');
      const coordinates = button.querySelector('output');
      if (name) name.textContent = binding.label;
      if (id) id.textContent = binding.id;
      if (coordinates) coordinates.textContent = `X ${Math.round(binding.position.x)} · Y ${Math.round(binding.position.y)}`;
      button.addEventListener('click', () => this.selectObject(binding.id, true));
      return button;
    }));
  }

  private renderSelection(): void {
    const binding = this.getSelectedBinding();
    this.selectedTitle.textContent = binding?.label ?? 'Ingen objekt valgt';
    this.selectedId.textContent = binding?.id ?? '–';
    this.coordinateOutput.textContent = binding
      ? `X: ${Math.round(binding.position.x)}  Y: ${Math.round(binding.position.y)}`
      : 'X: –  Y: –';
    this.resetButton.disabled = !binding;
    this.resetButton.textContent = this.mode === 'collision'
      ? 'Nullstill kollisjon'
      : 'Nullstill valgt objekt';
    this.undoButton.disabled = !this.undoPosition;
    this.duplicateObjectButton.hidden = this.mode !== 'objects';
    this.deleteObjectButton.hidden = this.mode !== 'objects';
    this.duplicateObjectButton.disabled = !binding?.catalogId || !this.options.duplicateObject;
    this.deleteObjectButton.disabled = !binding?.canDelete || !this.options.deleteObject;
  }

  private renderMode(): void {
    const collisionAvailable = this.getActiveObjects().some(
      (binding) => binding.collisionRects !== undefined
    );
    if (!collisionAvailable && this.mode === 'collision') {
      this.mode = 'objects';
    }
    const libraryAvailable = Boolean(
      this.getActiveCatalogItems().length && this.options.addCatalogObject
    );
    if (!libraryAvailable && this.mode === 'library') {
      this.mode = 'objects';
    }
    this.objectModeButton.classList.toggle('is-active', this.mode === 'objects');
    this.collisionModeButton.classList.toggle('is-active', this.mode === 'collision');
    this.libraryModeButton.classList.toggle('is-active', this.mode === 'library');
    this.objectModeButton.setAttribute('aria-selected', String(this.mode === 'objects'));
    this.collisionModeButton.setAttribute('aria-selected', String(this.mode === 'collision'));
    this.libraryModeButton.setAttribute('aria-selected', String(this.mode === 'library'));
    this.collisionModeButton.disabled = !collisionAvailable;
    this.libraryModeButton.disabled = !libraryAvailable;
    this.objectList.hidden = this.mode === 'library';
    this.selectionPanel.hidden = this.mode === 'library';
    this.collisionControls.hidden = this.mode !== 'collision';
    this.libraryControls.hidden = this.mode !== 'library';
    this.renderSelection();
    this.renderCollisionControls();
    this.renderLibrary();
  }

  private renderCollisionControls(): void {
    const binding = this.getSelectedBinding();
    const rects = binding?.collisionRects ?? [];
    this.collisionSelect.replaceChildren(...rects.map((_, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `Felt ${index + 1}`;
      option.selected = index === this.selectedCollisionIndex;
      return option;
    }));
    const rect = rects[this.selectedCollisionIndex];
    this.collisionSelect.disabled = rects.length === 0;
    this.deleteCollisionButton.disabled = !rect;
    this.addCollisionButton.disabled = !binding;
    this.collisionOutput.textContent = rect
      ? `X ${rect.x} · Y ${rect.y} · B ${rect.width} · H ${rect.height}`
      : 'Ingen kollisjonsfelt';
  }

  private renderLibraryCategories(): void {
    const categories = [
      'Alle',
      ...new Set(this.getActiveCatalogItems().map((item) => item.category))
    ];
    this.libraryCategory.replaceChildren(...categories.map((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      return option;
    }));
  }

  private renderLibrary(): void {
    const category = this.libraryCategory.value || 'Alle';
    const items = this.getActiveCatalogItems().filter(
      (item) => category === 'Alle' || item.category === category
    );
    this.libraryGrid.replaceChildren(...items.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'map-editor-library-item';
      button.title = `Plasser ${item.label}`;
      const image = document.createElement('img');
      image.src = item.assetPath;
      image.alt = '';
      const label = document.createElement('span');
      label.textContent = item.label;
      button.append(image, label);
      button.addEventListener('click', () => this.addCatalogItem(item.id));
      return button;
    }));
  }

  private addCatalogItem(catalogId: string): void {
    if (!this.options.addCatalogObject) {
      return;
    }
    const camera = this.options.scene.cameras.main;
    const binding = this.options.addCatalogObject(catalogId, {
      x: Phaser.Math.Clamp(camera.midPoint.x, 0, camera.getBounds().width),
      y: Phaser.Math.Clamp(camera.midPoint.y, 0, camera.getBounds().height)
    });
    this.registerNewBinding(binding);
  }

  private duplicateSelectedObject(): void {
    const binding = this.getSelectedBinding();
    if (!binding?.catalogId || !this.options.duplicateObject) {
      return;
    }
    this.registerNewBinding(this.options.duplicateObject(binding));
  }

  private deleteSelectedObject(): void {
    const binding = this.getSelectedBinding();
    if (!binding?.canDelete || !this.options.deleteObject) {
      return;
    }
    this.unbindObjectDragging();
    this.unbindCollisionDragging();
    this.options.deleteObject(binding);
    const index = this.options.objects.indexOf(binding);
    if (index >= 0) {
      this.options.objects.splice(index, 1);
    }
    this.sessionStart.delete(binding.id);
    this.sessionCollisionStart.delete(binding.id);
    this.selectedIdValue = this.getActiveObjects()[0]?.id;
    this.selectedCollisionIndex = 0;
    this.rebuildMarkers();
    this.renderObjectList();
    this.renderSelection();
    this.setStatus(`${binding.label} er fjernet. Lagre kartendringene for å beholde slettingen.`);
  }

  private registerNewBinding(binding: MapEditorObjectBinding): void {
    this.options.objects.push(binding);
    this.sessionStart.set(binding.id, {
      x: binding.position.x,
      y: binding.position.y
    });
    this.sessionCollisionStart.set(
      binding.id,
      cloneCollisionRects(binding.collisionRects ?? [])
    );
    this.mode = 'objects';
    this.selectedIdValue = binding.id;
    this.selectedCollisionIndex = 0;
    this.rebuildMarkers();
    this.renderMode();
    this.renderObjectList();
    this.renderSelection();
    this.options.focusObject(binding.position);
    this.setStatus(`${binding.label} er lagt til. Dra elementet dit du vil ha det.`);
  }

  private refreshMarkers(): void {
    for (const binding of this.getActiveObjects()) {
      const marker = this.markers.get(binding.id);
      if (!marker) {
        continue;
      }
      const selected = binding.id === this.selectedIdValue;
      marker.area
        .setPosition(binding.position.x, binding.position.y)
        .setVisible(this.mode === 'objects')
        .setFillStyle(selected ? 0xffdf4d : 0x14dff2, selected ? 0.09 : 0.035)
        .setStrokeStyle(selected ? 5 : 3, selected ? 0xffe45c : 0x55f3ff, selected ? 1 : 0.42);
      marker.anchor
        .setPosition(binding.position.x, binding.position.y)
        .setVisible(this.mode === 'objects' && selected);
      marker.coordinates
        .setPosition(binding.position.x, binding.position.y - binding.interactionRadius - 18)
        .setText(`${binding.label}  X:${Math.round(binding.position.x)}  Y:${Math.round(binding.position.y)}`)
        .setVisible(selected);
      (binding.collisionRects ?? []).forEach((rect, index) => {
        const selectedCollision = this.mode === 'collision'
          && selected
          && index === this.selectedCollisionIndex;
        marker.collisionAreas[index]
          ?.setPosition(binding.position.x + rect.x, binding.position.y + rect.y)
          .setSize(rect.width, rect.height)
          .setFillStyle(selectedCollision ? 0xffc74d : 0xff3d67, selectedCollision ? 0.24 : 0.08)
          .setStrokeStyle(selectedCollision ? 4 : 3, selectedCollision ? 0xffe45c : 0xff6685, selected ? 1 : 0.55);
        marker.collisionHandles[index]
          ?.setPosition(
            binding.position.x + rect.x + rect.width,
            binding.position.y + rect.y + rect.height
          )
          .setVisible(selectedCollision);
      });
    }
  }

  private getSelectedBinding(): MapEditorObjectBinding | undefined {
    return this.getActiveObjects().find((binding) => binding.id === this.selectedIdValue);
  }

  private getActiveObjects(): MapEditorObjectBinding[] {
    const mapId = this.options.getActiveMapId();
    return this.options.objects.filter((binding) => binding.mapId === mapId);
  }

  private getActiveCatalogItems(): MapEditorCatalogItem[] {
    const mapId = this.options.getActiveMapId();
    return (this.options.catalogItems ?? []).filter((item) => item.mapId === mapId);
  }

  private setStatus(message: string, error = false): void {
    this.status.textContent = message;
    this.status.classList.toggle('is-error', error);
  }

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Mangler element i karteditoren: ${selector}`);
    }
    return element;
  }
}
