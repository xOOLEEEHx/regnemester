export function installBaselineProbe() {
  if (window.__regnemesterBaseline) return;

  const activeTimeouts = new Set();
  const activeIntervals = new Set();
  const activeAnimationFrames = new Set();
  const canvasContexts = new WeakMap();
  const longTasks = [];
  const rafGaps = [];
  const paintEntries = [];
  let largestContentfulPaint = null;
  let stopped = false;

  const originalSetTimeout = window.setTimeout.bind(window);
  const originalClearTimeout = window.clearTimeout.bind(window);
  const originalSetInterval = window.setInterval.bind(window);
  const originalClearInterval = window.clearInterval.bind(window);
  const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const originalCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  window.setTimeout = function baselineSetTimeout(callback, delay, ...args) {
    let handle;
    const measuredCallback = typeof callback === 'function'
      ? function measuredTimeoutCallback(...callbackArgs) {
        activeTimeouts.delete(handle);
        return callback.apply(this, callbackArgs);
      }
      : callback;
    handle = originalSetTimeout(measuredCallback, delay, ...args);
    activeTimeouts.add(handle);
    return handle;
  };

  window.clearTimeout = function baselineClearTimeout(handle) {
    activeTimeouts.delete(handle);
    return originalClearTimeout(handle);
  };

  window.setInterval = function baselineSetInterval(callback, delay, ...args) {
    const handle = originalSetInterval(callback, delay, ...args);
    activeIntervals.add(handle);
    return handle;
  };

  window.clearInterval = function baselineClearInterval(handle) {
    activeIntervals.delete(handle);
    return originalClearInterval(handle);
  };

  window.requestAnimationFrame = function baselineRequestAnimationFrame(callback) {
    let handle;
    handle = originalRequestAnimationFrame((timestamp) => {
      activeAnimationFrames.delete(handle);
      callback(timestamp);
    });
    activeAnimationFrames.add(handle);
    return handle;
  };

  window.cancelAnimationFrame = function baselineCancelAnimationFrame(handle) {
    activeAnimationFrames.delete(handle);
    return originalCancelAnimationFrame(handle);
  };

  HTMLCanvasElement.prototype.getContext = function baselineGetContext(...args) {
    const context = Reflect.apply(originalGetContext, this, args);
    if (context && (args[0] === 'webgl' || args[0] === 'webgl2' || args[0] === 'experimental-webgl')) {
      canvasContexts.set(this, args[0]);
    }
    return context;
  };

  const observers = [];
  function observe(type, callback) {
    if (!globalThis.PerformanceObserver?.supportedEntryTypes?.includes(type)) return;
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true });
    observers.push(observer);
  }

  observe('longtask', (entries) => {
    for (const entry of entries) {
      longTasks.push({ startTime: entry.startTime, duration: entry.duration });
    }
  });
  observe('paint', (entries) => {
    for (const entry of entries) {
      paintEntries.push({ name: entry.name, startTime: entry.startTime });
    }
  });
  observe('largest-contentful-paint', (entries) => {
    const entry = entries.at(-1);
    if (entry) largestContentfulPaint = { startTime: entry.startTime, size: entry.size };
  });

  let previousFrame = performance.now();
  let samplerHandle;
  const sampleFrame = (timestamp) => {
    const gap = timestamp - previousFrame;
    if (gap > 0) rafGaps.push(gap);
    previousFrame = timestamp;
    if (!stopped) samplerHandle = originalRequestAnimationFrame(sampleFrame);
  };
  samplerHandle = originalRequestAnimationFrame(sampleFrame);

  function findConnectedCanvases(root = document, found = new Set()) {
    for (const canvas of root.querySelectorAll('canvas')) {
      if (canvas.isConnected) found.add(canvas);
    }
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) findConnectedCanvases(element.shadowRoot, found);
    }
    return [...found];
  }

  function snapshot(label = 'snapshot') {
    const canvases = findConnectedCanvases();
    return {
      label,
      timestamp: performance.now(),
      longTasks: longTasks.map((entry) => ({ ...entry })),
      rafGaps: [...rafGaps],
      paintEntries: paintEntries.map((entry) => ({ ...entry })),
      largestContentfulPaint: largestContentfulPaint ? { ...largestContentfulPaint } : null,
      activeTimeouts: activeTimeouts.size,
      activeIntervals: activeIntervals.size,
      activeRafs: activeAnimationFrames.size,
      canvasCount: canvases.length,
      webglContextCount: canvases.filter((canvas) => canvasContexts.has(canvas)).length
    };
  }

  function finish() {
    stopped = true;
    originalCancelAnimationFrame(samplerHandle);
    for (const observer of observers) observer.disconnect();
    return snapshot('finish');
  }

  Object.defineProperty(window, '__regnemesterBaseline', {
    configurable: false,
    enumerable: false,
    value: { snapshot, finish },
    writable: false
  });
}
