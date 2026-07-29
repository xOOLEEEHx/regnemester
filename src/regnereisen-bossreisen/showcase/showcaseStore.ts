import {
  EFFECT_KEYS,
  type EffectKey,
  type QualityLevel,
  type ShowcaseAction,
  type ShowcaseState,
  type ShowcaseTelemetry
} from './types';

type StateListener = (state: ShowcaseState) => void;
type TelemetryListener = (telemetry: ShowcaseTelemetry) => void;
type ActionListener = (action: ShowcaseAction) => void;

export class ShowcaseStore {
  private state: ShowcaseState = {
    quality: 'standard',
    effects: Object.fromEntries(EFFECT_KEYS.map((key) => [key, true])) as Record<EffectKey, boolean>
  };

  private readonly stateListeners = new Set<StateListener>();
  private readonly telemetryListeners = new Set<TelemetryListener>();
  private readonly actionListeners = new Set<ActionListener>();

  getSnapshot(): ShowcaseState {
    return {
      quality: this.state.quality,
      effects: { ...this.state.effects }
    };
  }

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getSnapshot());
    return () => this.stateListeners.delete(listener);
  }

  subscribeTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  subscribeActions(listener: ActionListener): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  setEffect(key: EffectKey, enabled: boolean): void {
    if (this.state.effects[key] === enabled) return;
    this.state = {
      ...this.state,
      effects: { ...this.state.effects, [key]: enabled }
    };
    this.emitState();
  }

  setAllEffects(enabled: boolean): void {
    this.state = {
      ...this.state,
      effects: Object.fromEntries(EFFECT_KEYS.map((key) => [key, enabled])) as Record<EffectKey, boolean>
    };
    this.emitState();
  }

  setQuality(quality: QualityLevel): void {
    if (this.state.quality === quality) return;
    this.state = { ...this.state, quality };
    this.emitState();
  }

  request(action: ShowcaseAction): void {
    for (const listener of this.actionListeners) listener(action);
  }

  updateTelemetry(telemetry: ShowcaseTelemetry): void {
    for (const listener of this.telemetryListeners) listener(telemetry);
  }

  private emitState(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.stateListeners) listener(snapshot);
  }
}

export const showcaseStore = new ShowcaseStore();
