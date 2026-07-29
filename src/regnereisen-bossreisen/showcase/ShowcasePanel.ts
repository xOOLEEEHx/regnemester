import { SHOWCASE_ASSETS } from './assets';
import { EFFECT_KEYS, EFFECT_LABELS, type EffectKey, type QualityLevel, type ShowcaseTelemetry } from './types';
import type { ShowcaseStore } from './showcaseStore';

const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: 'Lav',
  standard: 'Standard',
  high: 'Høy',
  ultra: 'Ultra test'
};

export class ShowcasePanel {
  private readonly root: HTMLElement;
  private readonly narrowMedia = window.matchMedia('(max-width: 720px)');
  private readonly unsubscribe: Array<() => void> = [];
  private readonly effectInputs = new Map<EffectKey, HTMLInputElement>();
  private readonly qualityButtons = new Map<QualityLevel, HTMLButtonElement>();
  private readonly telemetryNodes: Record<keyof ShowcaseTelemetry, HTMLElement>;

  constructor(private readonly store: ShowcaseStore) {
    this.root = document.createElement('aside');
    this.root.id = 'showcase-panel';
    this.root.className = 'showcase-panel';
    this.root.setAttribute('aria-label', 'Phaser 4 visuelt testlaboratorium');
    this.root.innerHTML = `
      <button class="showcase-panel__collapse" type="button" aria-expanded="true" aria-label="Skjul testpanel">×</button>
      <div class="showcase-panel__body">
        <header class="showcase-panel__header">
          <span class="showcase-panel__eyebrow">Phaser 4.2.1 · Visual laboratory</span>
          <h1>Tallvokterens verden</h1>
          <p>Levende kartlag uten gameplay. Dra for å panorere, rull eller knip for å zoome, og trykk på magiske områder.</p>
        </header>
        <section class="showcase-panel__section" aria-labelledby="quality-heading">
          <h2 id="quality-heading">Visuell kvalitet</h2>
          <div class="showcase-quality" role="group" aria-label="Kvalitetsnivå">
            ${Object.entries(QUALITY_LABELS)
              .map(([key, label]) => `<button type="button" data-quality="${key}">${label}</button>`)
              .join('')}
          </div>
        </section>
        <section class="showcase-panel__section" aria-labelledby="effects-heading">
          <div class="showcase-section-heading">
            <h2 id="effects-heading">Effektgrupper</h2>
            <div>
              <button type="button" class="showcase-text-button" data-all="off">Statisk</button>
              <button type="button" class="showcase-text-button" data-all="on">Alle</button>
            </div>
          </div>
          <div class="showcase-effects">
            ${EFFECT_KEYS.map((key) => {
              const disabled = key === 'ocean' && !SHOWCASE_ASSETS.waterMask.available;
              return `
                <label class="showcase-effect${disabled ? ' is-unavailable' : ''}" title="${disabled ? 'Venter på manuelt markert vannmaske' : ''}">
                  <input type="checkbox" data-effect="${key}" ${disabled ? 'disabled' : ''} />
                  <span aria-hidden="true"></span>
                  <em>${EFFECT_LABELS[key]}</em>
                  ${
                    disabled
                      ? '<small>Manuell maske mangler</small>'
                      : key === 'ocean'
                        ? '<small>Din manuelle maske</small>'
                        : key === 'waterfalls'
                          ? '<small>Din manuelle markering</small>'
                          : key === 'events'
                            ? '<small>Sjelden visuell hendelse</small>'
                          : ''
                  }
                </label>`;
            }).join('')}
          </div>
        </section>
        <section class="showcase-panel__section" aria-labelledby="demo-heading">
          <h2 id="demo-heading">Demonstrasjoner</h2>
          <div class="showcase-actions">
            <button type="button" data-action="tour-start">Start kameratur</button>
            <button type="button" data-action="tour-stop">Stopp tur</button>
            <button type="button" data-action="overview">Hele kartet</button>
            <button type="button" data-action="portal-demo">Portalaktivering</button>
            <button type="button" data-action="event-demo">Test stjerneregn</button>
            <button type="button" data-action="filter-demo">Filterdemo</button>
          </div>
          <p class="showcase-event-status" id="showcase-event-status">Verdenshendelse: Verden er rolig</p>
        </section>
        <section class="showcase-panel__section showcase-telemetry" aria-labelledby="telemetry-heading">
          <h2 id="telemetry-heading">Sanntidsmåling</h2>
          <dl>
            <div><dt>FPS</dt><dd data-stat="fps">–</dd></div>
            <div><dt>Frame</dt><dd><span data-stat="frameMs">–</span> ms</dd></div>
            <div><dt>Emitters</dt><dd data-stat="activeEmitters">–</dd></div>
            <div><dt>Partikler</dt><dd data-stat="aliveParticles">–</dd></div>
            <div><dt>Lys</dt><dd data-stat="visibleLights">–</dd></div>
            <div><dt>Zoom</dt><dd data-stat="zoom">–</dd></div>
            <div><dt>Kamera</dt><dd><span data-stat="cameraX">–</span>, <span data-stat="cameraY">–</span></dd></div>
            <div><dt>Renderer</dt><dd data-stat="renderer">–</dd></div>
          </dl>
        </section>
        <footer class="showcase-panel__footer">
          <p id="showcase-load-status">Laster kartet …</p>
          <a href="?classic=1">Åpne den kopierte klassiske reisen</a>
        </footer>
      </div>`;
    document.body.appendChild(this.root);

    if (this.narrowMedia.matches) this.setCollapsed(true);
    this.narrowMedia.addEventListener('change', this.handleNarrowChange);
    window.addEventListener('resize', this.handleWindowResize);

    this.telemetryNodes = {
      fps: this.requireElement('[data-stat="fps"]'),
      frameMs: this.requireElement('[data-stat="frameMs"]'),
      activeEmitters: this.requireElement('[data-stat="activeEmitters"]'),
      aliveParticles: this.requireElement('[data-stat="aliveParticles"]'),
      visibleLights: this.requireElement('[data-stat="visibleLights"]'),
      cameraX: this.requireElement('[data-stat="cameraX"]'),
      cameraY: this.requireElement('[data-stat="cameraY"]'),
      zoom: this.requireElement('[data-stat="zoom"]'),
      renderer: this.requireElement('[data-stat="renderer"]')
    };

    this.bindControls();
    this.unsubscribe.push(
      store.subscribe((state) => {
        this.effectInputs.forEach((input, key) => {
          input.checked = state.effects[key];
        });
        this.qualityButtons.forEach((button, quality) => {
          button.classList.toggle('is-active', quality === state.quality);
          button.setAttribute('aria-pressed', String(quality === state.quality));
        });
      }),
      store.subscribeTelemetry((telemetry) => this.updateTelemetry(telemetry))
    );

    document.addEventListener('showcase-loading', this.handleLoading as EventListener);
    document.addEventListener('showcase-world-event', this.handleWorldEvent as EventListener);
  }

  destroy(): void {
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.narrowMedia.removeEventListener('change', this.handleNarrowChange);
    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('showcase-loading', this.handleLoading as EventListener);
    document.removeEventListener('showcase-world-event', this.handleWorldEvent as EventListener);
    this.root.remove();
  }

  private bindControls(): void {
    this.root.querySelectorAll<HTMLInputElement>('[data-effect]').forEach((input) => {
      const key = input.dataset.effect as EffectKey;
      this.effectInputs.set(key, input);
      input.addEventListener('change', () => this.store.setEffect(key, input.checked));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-quality]').forEach((button) => {
      const quality = button.dataset.quality as QualityLevel;
      this.qualityButtons.set(quality, button);
      button.addEventListener('click', () => this.store.setQuality(quality));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', () => this.store.request(button.dataset.action as Parameters<ShowcaseStore['request']>[0]));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-all]').forEach((button) => {
      button.addEventListener('click', () => {
        const enabled = button.dataset.all === 'on';
        this.store.setAllEffects(enabled);
        if (!SHOWCASE_ASSETS.waterMask.available) this.store.setEffect('ocean', false);
      });
    });
    const collapse = this.requireElement<HTMLButtonElement>('.showcase-panel__collapse');
    collapse.addEventListener('click', () => {
      const collapsed = this.root.classList.toggle('is-collapsed');
      collapse.textContent = collapsed ? 'FX' : '×';
      collapse.setAttribute('aria-expanded', String(!collapsed));
      collapse.setAttribute('aria-label', collapsed ? 'Vis testpanel' : 'Skjul testpanel');
    });
  }

  private setCollapsed(collapsed: boolean): void {
    this.root.classList.toggle('is-collapsed', collapsed);
    const collapse = this.root.querySelector<HTMLButtonElement>('.showcase-panel__collapse');
    if (!collapse) return;
    collapse.textContent = collapsed ? 'FX' : '\u00d7';
    collapse.setAttribute('aria-expanded', String(!collapsed));
    collapse.setAttribute('aria-label', collapsed ? 'Vis testpanel' : 'Skjul testpanel');
  }

  private readonly handleNarrowChange = (event: MediaQueryListEvent): void => {
    if (event.matches) this.setCollapsed(true);
  };

  private readonly handleWindowResize = (): void => {
    if (window.innerWidth <= 720) this.setCollapsed(true);
  };

  private updateTelemetry(telemetry: ShowcaseTelemetry): void {
    this.telemetryNodes.fps.textContent = telemetry.fps.toFixed(0);
    this.telemetryNodes.frameMs.textContent = telemetry.frameMs.toFixed(1);
    this.telemetryNodes.activeEmitters.textContent = String(telemetry.activeEmitters);
    this.telemetryNodes.aliveParticles.textContent = String(telemetry.aliveParticles);
    this.telemetryNodes.visibleLights.textContent = String(telemetry.visibleLights);
    this.telemetryNodes.cameraX.textContent = telemetry.cameraX.toFixed(0);
    this.telemetryNodes.cameraY.textContent = telemetry.cameraY.toFixed(0);
    this.telemetryNodes.zoom.textContent = `${telemetry.zoom.toFixed(2)}×`;
    this.telemetryNodes.renderer.textContent = telemetry.renderer;
  }

  private readonly handleLoading = (event: CustomEvent<{ progress: number; message: string }>) => {
    const status = this.root.querySelector<HTMLElement>('#showcase-load-status');
    if (!status) return;
    status.textContent = `${event.detail.message} ${Math.round(event.detail.progress * 100)} %`;
    status.classList.toggle('is-ready', event.detail.progress >= 1);
  };

  private readonly handleWorldEvent = (event: CustomEvent<{ name: string }>) => {
    const status = this.root.querySelector<HTMLElement>('#showcase-event-status');
    if (!status) return;
    status.textContent = `Verdenshendelse: ${event.detail.name}`;
    status.classList.toggle('is-active', event.detail.name !== 'Verden er rolig');
  };

  private requireElement<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Mangler panel-element: ${selector}`);
    return element;
  }
}
