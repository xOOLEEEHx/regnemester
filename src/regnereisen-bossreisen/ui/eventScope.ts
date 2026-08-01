export class EventScope {
  private controller = new AbortController();

  listen<TEvent extends Event>(
    target: EventTarget,
    type: string,
    listener: (event: TEvent) => void,
    options: boolean | AddEventListenerOptions = {},
  ): void {
    const scopedOptions: AddEventListenerOptions =
      typeof options === 'boolean'
        ? { capture: options, signal: this.controller.signal }
        : { ...options, signal: this.controller.signal };

    target.addEventListener(type, listener as EventListener, scopedOptions);
  }

  dispose(): void {
    this.controller.abort();
  }

  reset(): void {
    this.controller.abort();
    this.controller = new AbortController();
  }
}
