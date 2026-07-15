// node_modules/stats-gl/dist/core.js
var StatsCore = class {
  constructor({
    trackGPU = false,
    trackCPT = false,
    trackHz = false,
    trackFPS = true,
    logsPerSecond = 4,
    graphsPerSecond = 30,
    samplesLog = 40,
    samplesGraph = 10,
    precision = 2,
    maxTimestampPairs = 2048
  } = {}) {
    this.gl = null;
    this.ext = null;
    this.gpuDevice = null;
    this.gpuBackend = null;
    this.renderer = null;
    this.activeQuery = null;
    this.gpuQueries = [];
    this.threeRendererPatched = false;
    this.maxTimestampPairs = 2048;
    this.webgpuNative = false;
    this.gpuQuerySet = null;
    this.gpuResolveBuffer = null;
    this.gpuTimestampBufferSize = 0;
    this.frameCursor = 0;
    this.slotTypes = [];
    this.readBufferPool = [];
    this.inFlightFrames = [];
    this.poolWarnThreshold = 8;
    this.warnedMapError = false;
    this.warnedSlotOverflow = false;
    this.warnedPoolGrowth = false;
    this.frameTimes = [];
    this.frameTimesHead = 0;
    this.renderCount = 0;
    this.cpuStartTime = 0;
    this.isRunningCPUProfiling = false;
    this.totalCpuDuration = 0;
    this.totalGpuDuration = 0;
    this.totalGpuDurationCompute = 0;
    this.averageFps = { logs: [], graph: [] };
    this.averageCpu = { logs: [], graph: [] };
    this.averageGpu = { logs: [], graph: [] };
    this.averageGpuCompute = { logs: [], graph: [] };
    this.trackGPU = trackGPU;
    this.trackCPT = trackCPT;
    this.trackHz = trackHz;
    this.trackFPS = trackFPS;
    this.samplesLog = samplesLog;
    this.samplesGraph = samplesGraph;
    this.precision = precision;
    this.logsPerSecond = logsPerSecond;
    this.graphsPerSecond = graphsPerSecond;
    this.maxTimestampPairs = Math.max(1, maxTimestampPairs);
    const now = performance.now();
    this.prevGraphTime = now;
    this.beginTime = now;
    this.prevTextTime = now;
    this.prevCpuTime = now;
  }
  async init(canvasOrGL) {
    if (!canvasOrGL) {
      console.error('Stats: The "canvas" parameter is undefined.');
      return;
    }
    if (this.handleThreeRenderer(canvasOrGL)) return;
    if (await this.handleWebGPURenderer(canvasOrGL)) return;
    if (this.handleNativeWebGPU(canvasOrGL)) return;
    if (this.initializeWebGL(canvasOrGL)) {
      if (this.trackGPU) {
        this.initializeGPUTracking();
      }
      return;
    } else {
      console.error("Stats-gl: Failed to initialize WebGL context");
    }
  }
  handleNativeWebGPU(device) {
    var _a;
    if (device && typeof device.createCommandEncoder === "function" && typeof device.createQuerySet === "function" && device.queue) {
      this.gpuDevice = device;
      this.webgpuNative = true;
      if (this.trackGPU && ((_a = device.features) == null ? void 0 : _a.has("timestamp-query"))) {
        this.initializeWebGPUTiming();
        this.onWebGPUTimestampSupported();
      }
      return true;
    }
    return false;
  }
  initializeWebGPUTiming() {
    if (!this.gpuDevice) return;
    const count = this.maxTimestampPairs * 2;
    this.gpuTimestampBufferSize = count * 8;
    this.gpuQuerySet = this.gpuDevice.createQuerySet({
      type: "timestamp",
      count
    });
    this.gpuResolveBuffer = this.gpuDevice.createBuffer({
      size: this.gpuTimestampBufferSize,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
    });
  }
  acquireReadBuffer() {
    if (!this.gpuDevice) return null;
    const recycled = this.readBufferPool.pop();
    if (recycled) return recycled;
    const totalLive = this.inFlightFrames.length + this.readBufferPool.length + 1;
    if (totalLive > this.poolWarnThreshold && !this.warnedPoolGrowth) {
      console.warn(
        `stats-gl: WebGPU timestamp readback pool grew to ${totalLive} buffers \u2014 is update() being called every frame after queue.submit?`
      );
      this.warnedPoolGrowth = true;
    }
    return this.gpuDevice.createBuffer({
      size: this.gpuTimestampBufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
  }
  handleThreeRenderer(renderer) {
    if (renderer.isWebGLRenderer && !this.threeRendererPatched) {
      this.patchThreeRenderer(renderer);
      this.gl = renderer.getContext();
      if (this.trackGPU) {
        this.initializeGPUTracking();
      }
      return true;
    }
    return false;
  }
  async handleWebGPURenderer(renderer) {
    var _a;
    if (renderer.isWebGPURenderer) {
      this.renderer = renderer;
      if (this.trackGPU || this.trackCPT) {
        renderer.backend.trackTimestamp = true;
        if (!renderer._initialized) {
          await renderer.init();
        }
        if (renderer.hasFeature("timestamp-query")) {
          this.onWebGPUTimestampSupported();
        }
      }
      this.info = renderer.info;
      this.gpuBackend = renderer.backend;
      this.gpuDevice = ((_a = renderer.backend) == null ? void 0 : _a.device) || null;
      this.patchThreeWebGPU(renderer);
      return true;
    }
    return false;
  }
  onWebGPUTimestampSupported() {
  }
  initializeWebGL(canvasOrGL) {
    if (canvasOrGL instanceof WebGL2RenderingContext) {
      this.gl = canvasOrGL;
    } else if (canvasOrGL instanceof HTMLCanvasElement || canvasOrGL instanceof OffscreenCanvas) {
      this.gl = canvasOrGL.getContext("webgl2");
      if (!this.gl) {
        console.error("Stats: Unable to obtain WebGL2 context.");
        return false;
      }
    } else {
      console.error(
        "Stats: Invalid input type. Expected WebGL2RenderingContext, HTMLCanvasElement, or OffscreenCanvas."
      );
      return false;
    }
    return true;
  }
  initializeGPUTracking() {
    if (this.gl) {
      this.ext = this.gl.getExtension("EXT_disjoint_timer_query_webgl2");
      if (this.ext) {
        this.onGPUTrackingInitialized();
      }
    }
  }
  onGPUTrackingInitialized() {
  }
  /**
   * Allocate a fresh timestamp pair (beginning + end) and return the descriptor
   * to embed in a render or compute pass. Each call consumes one pair from the
   * per-frame budget; counters reset on the next `begin()`.
   *
   * @param type - 'render' (default) or 'compute' — controls which panel the
   *               resolved duration is added to.
   * @returns timestampWrites object, or `undefined` if the native WebGPU path
   *          is not active or the per-frame pair budget is exhausted.
   */
  getTimestampWrites(type = "render") {
    if (!this.webgpuNative || !this.gpuQuerySet) return void 0;
    if (this.frameCursor >= this.maxTimestampPairs) {
      if (!this.warnedSlotOverflow) {
        console.warn(
          `stats-gl: WebGPU timestamp pair budget exhausted (maxTimestampPairs=${this.maxTimestampPairs}). Increase maxTimestampPairs in StatsOptions to instrument more passes.`
        );
        this.warnedSlotOverflow = true;
      }
      return void 0;
    }
    const i = this.frameCursor++;
    this.slotTypes[i] = type;
    return {
      querySet: this.gpuQuerySet,
      beginningOfPassWriteIndex: i * 2,
      endOfPassWriteIndex: i * 2 + 1
    };
  }
  begin(encoder) {
    this.beginProfiling();
    if (this.webgpuNative) {
      this.frameCursor = 0;
      this.slotTypes.length = 0;
      return;
    }
    if (!this.gl || !this.ext) return;
    if (this.activeQuery) {
      this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    }
    this.activeQuery = this.gl.createQuery();
    if (this.activeQuery) {
      this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.activeQuery);
    }
  }
  end(encoder) {
    this.renderCount++;
    if (this.webgpuNative && encoder && this.gpuQuerySet && this.gpuResolveBuffer) {
      const usedPairs = this.frameCursor;
      if (usedPairs > 0) {
        const usedQueries = usedPairs * 2;
        const usedBytes = usedQueries * 8;
        encoder.resolveQuerySet(this.gpuQuerySet, 0, usedQueries, this.gpuResolveBuffer, 0);
        const readBuffer = this.acquireReadBuffer();
        if (readBuffer) {
          encoder.copyBufferToBuffer(this.gpuResolveBuffer, 0, readBuffer, 0, usedBytes);
          this.inFlightFrames.push({
            buffer: readBuffer,
            pairCount: usedPairs,
            slotTypes: this.slotTypes.slice(0, usedPairs),
            mapPromise: null,
            ready: false,
            error: null
          });
        }
      }
      this.endProfiling();
      return;
    }
    if (this.gl && this.ext && this.activeQuery) {
      this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
      this.gpuQueries.push({ query: this.activeQuery });
      this.activeQuery = null;
    }
    this.endProfiling();
  }
  /**
   * Drive the WebGPU timestamp readback pipeline. Call once per frame, AFTER
   * queue.submit(). Kicks off mapAsync for any newly-submitted in-flight frames
   * and drains any frames whose mapping has resolved (oldest first).
   *
   * Returns the most recently resolved render-pass duration in milliseconds.
   */
  async resolveTimestampsAsync() {
    if (!this.webgpuNative) return this.totalGpuDuration;
    for (const entry of this.inFlightFrames) {
      if (entry.mapPromise === null) {
        entry.mapPromise = entry.buffer.mapAsync(GPUMapMode.READ).then(
          () => {
            entry.ready = true;
          },
          (e) => {
            entry.error = e;
            entry.ready = true;
          }
        );
      }
    }
    while (this.inFlightFrames.length > 0 && this.inFlightFrames[0].ready) {
      const entry = this.inFlightFrames.shift();
      if (entry.error) {
        if (!this.warnedMapError) {
          console.warn("stats-gl: WebGPU timestamp mapAsync failed", entry.error);
          this.warnedMapError = true;
        }
        this.totalGpuDuration = 0;
        this.totalGpuDurationCompute = 0;
        this.readBufferPool.push(entry.buffer);
        continue;
      }
      const data = new BigUint64Array(entry.buffer.getMappedRange());
      let renderNs = 0;
      let computeNs = 0;
      for (let i = 0; i < entry.pairCount; i++) {
        const start = data[i * 2];
        const end = data[i * 2 + 1];
        const delta = end >= start ? Number(end - start) : 0;
        if (entry.slotTypes[i] === "compute") {
          computeNs += delta;
        } else {
          renderNs += delta;
        }
      }
      entry.buffer.unmap();
      this.readBufferPool.push(entry.buffer);
      this.totalGpuDuration = renderNs / 1e6;
      this.totalGpuDurationCompute = computeNs / 1e6;
    }
    return this.totalGpuDuration;
  }
  processGpuQueries() {
    if (!this.gl || !this.ext) return;
    this.totalGpuDuration = 0;
    for (let i = this.gpuQueries.length - 1; i >= 0; i--) {
      const queryInfo = this.gpuQueries[i];
      const available = this.gl.getQueryParameter(queryInfo.query, this.gl.QUERY_RESULT_AVAILABLE);
      const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
      if (available && !disjoint) {
        const elapsed = this.gl.getQueryParameter(queryInfo.query, this.gl.QUERY_RESULT);
        const duration = elapsed * 1e-6;
        this.totalGpuDuration += duration;
        this.gl.deleteQuery(queryInfo.query);
        this.gpuQueries.splice(i, 1);
      }
    }
  }
  processWebGPUTimestamps() {
    this.totalGpuDuration = this.info.render.timestamp;
    this.totalGpuDurationCompute = this.info.compute.timestamp;
  }
  beginProfiling() {
    this.cpuStartTime = performance.now();
    this.isRunningCPUProfiling = true;
  }
  endProfiling() {
    if (this.isRunningCPUProfiling) {
      this.totalCpuDuration += performance.now() - this.cpuStartTime;
      this.isRunningCPUProfiling = false;
    }
  }
  calculateFps() {
    const currentTime = performance.now();
    const cutoff = currentTime - 1e3;
    this.frameTimes.push(currentTime);
    while (this.frameTimesHead < this.frameTimes.length && this.frameTimes[this.frameTimesHead] <= cutoff) {
      this.frameTimesHead++;
    }
    if (this.frameTimesHead > 128) {
      this.frameTimes = this.frameTimes.slice(this.frameTimesHead);
      this.frameTimesHead = 0;
    }
    return Math.round(this.frameTimes.length - this.frameTimesHead);
  }
  updateAverages() {
    this.addToAverage(this.totalCpuDuration, this.averageCpu);
    this.addToAverage(this.totalGpuDuration, this.averageGpu);
    if ((this.info || this.webgpuNative) && this.totalGpuDurationCompute !== void 0) {
      this.addToAverage(this.totalGpuDurationCompute, this.averageGpuCompute);
    }
  }
  addToAverage(value, averageArray) {
    averageArray.logs.push(value);
    while (averageArray.logs.length > this.samplesLog) {
      averageArray.logs.shift();
    }
    averageArray.graph.push(value);
    while (averageArray.graph.length > this.samplesGraph) {
      averageArray.graph.shift();
    }
  }
  resetCounters() {
    this.renderCount = 0;
    this.totalCpuDuration = 0;
    this.beginTime = performance.now();
  }
  getData() {
    const fpsLogs = this.averageFps.logs;
    const cpuLogs = this.averageCpu.logs;
    const gpuLogs = this.averageGpu.logs;
    const gpuComputeLogs = this.averageGpuCompute.logs;
    return {
      fps: fpsLogs.length > 0 ? fpsLogs[fpsLogs.length - 1] : 0,
      cpu: cpuLogs.length > 0 ? cpuLogs[cpuLogs.length - 1] : 0,
      gpu: gpuLogs.length > 0 ? gpuLogs[gpuLogs.length - 1] : 0,
      gpuCompute: gpuComputeLogs.length > 0 ? gpuComputeLogs[gpuComputeLogs.length - 1] : 0
    };
  }
  patchThreeWebGPU(renderer) {
    const originalAnimationLoop = renderer.info.reset;
    const statsInstance = this;
    renderer.info.reset = function() {
      statsInstance.beginProfiling();
      originalAnimationLoop.call(this);
    };
  }
  patchThreeRenderer(renderer) {
    const originalRenderMethod = renderer.render;
    const statsInstance = this;
    renderer.render = function(scene, camera) {
      statsInstance.begin();
      originalRenderMethod.call(this, scene, camera);
      statsInstance.end();
    };
    this.threeRendererPatched = true;
  }
  /**
   * Dispose of all resources. Call when done using the stats instance.
   */
  dispose() {
    if (this.gl) {
      if (this.activeQuery && this.ext) {
        try {
          this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
        } catch (_) {
        }
        this.gl.deleteQuery(this.activeQuery);
        this.activeQuery = null;
      }
      for (const queryInfo of this.gpuQueries) {
        this.gl.deleteQuery(queryInfo.query);
      }
      this.gpuQueries.length = 0;
    }
    if (this.gpuQuerySet) {
      this.gpuQuerySet.destroy();
      this.gpuQuerySet = null;
    }
    if (this.gpuResolveBuffer) {
      this.gpuResolveBuffer.destroy();
      this.gpuResolveBuffer = null;
    }
    for (const entry of this.inFlightFrames) {
      try {
        if (entry.buffer.mapState === "mapped") {
          entry.buffer.unmap();
        }
      } catch (_) {
      }
      entry.buffer.destroy();
    }
    this.inFlightFrames.length = 0;
    for (const buffer of this.readBufferPool) {
      buffer.destroy();
    }
    this.readBufferPool.length = 0;
    this.frameCursor = 0;
    this.slotTypes.length = 0;
    this.gpuTimestampBufferSize = 0;
    this.warnedMapError = false;
    this.warnedSlotOverflow = false;
    this.warnedPoolGrowth = false;
    this.webgpuNative = false;
    this.gl = null;
    this.ext = null;
    this.info = void 0;
    this.gpuDevice = null;
    this.gpuBackend = null;
    this.renderer = null;
    this.frameTimes.length = 0;
    this.frameTimesHead = 0;
    this.averageFps.logs.length = 0;
    this.averageFps.graph.length = 0;
    this.averageCpu.logs.length = 0;
    this.averageCpu.graph.length = 0;
    this.averageGpu.logs.length = 0;
    this.averageGpu.graph.length = 0;
    this.averageGpuCompute.logs.length = 0;
    this.averageGpuCompute.graph.length = 0;
  }
};

// node_modules/stats-gl/dist/panel.js
var Panel = class {
  constructor(name, fg, bg) {
    this.id = 0;
    this.name = name;
    this.fg = fg;
    this.bg = bg;
    this.gradient = null;
    this.PR = Math.round(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    this.WIDTH = 90 * this.PR;
    this.HEIGHT = 48 * this.PR;
    this.TEXT_X = 3 * this.PR;
    this.TEXT_Y = 2 * this.PR;
    this.GRAPH_X = 3 * this.PR;
    this.GRAPH_Y = 15 * this.PR;
    this.GRAPH_WIDTH = 84 * this.PR;
    this.GRAPH_HEIGHT = 30 * this.PR;
    this.canvas = typeof document !== "undefined" ? document.createElement("canvas") : new OffscreenCanvas(this.WIDTH, this.HEIGHT);
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.canvas.style.width = "90px";
    this.canvas.style.height = "48px";
    this.canvas.style.position = "absolute";
    this.canvas.style.cssText = "width:90px;height:48px;background-color: transparent !important;";
    this.context = this.canvas.getContext("2d");
    this.initializeCanvas();
  }
  createGradient() {
    if (!this.context) throw new Error("No context");
    const gradient = this.context.createLinearGradient(
      0,
      this.GRAPH_Y,
      0,
      this.GRAPH_Y + this.GRAPH_HEIGHT
    );
    let startColor;
    const endColor = this.fg;
    switch (this.fg.toLowerCase()) {
      case "#0ff":
        startColor = "#006666";
        break;
      case "#0f0":
        startColor = "#006600";
        break;
      case "#ff0":
        startColor = "#666600";
        break;
      case "#e1e1e1":
        startColor = "#666666";
        break;
      default:
        startColor = this.bg;
        break;
    }
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  }
  initializeCanvas() {
    if (!this.context) return;
    this.context.imageSmoothingEnabled = false;
    this.context.font = "bold " + 9 * this.PR + "px Helvetica,Arial,sans-serif";
    this.context.textBaseline = "top";
    this.gradient = this.createGradient();
    this.context.fillStyle = this.bg;
    this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    this.context.fillStyle = this.fg;
    this.context.fillText(this.name, this.TEXT_X, this.TEXT_Y);
    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT);
  }
  // Update only text portion
  update(value, maxValue, decimals = 0, suffix = "") {
    if (!this.context || !this.gradient) return;
    const min = Math.min(Infinity, value);
    const max = Math.max(maxValue, value);
    this.context.globalAlpha = 1;
    this.context.fillStyle = this.bg;
    this.context.fillRect(0, 0, this.WIDTH, this.GRAPH_Y);
    const valueAndName = `${value.toFixed(decimals)} ${this.name}`;
    this.context.fillStyle = this.fg;
    this.context.fillText(valueAndName, this.TEXT_X, this.TEXT_Y);
    let textX = this.TEXT_X + this.context.measureText(valueAndName).width;
    if (suffix) {
      this.context.fillStyle = "#f90";
      this.context.fillText(suffix, textX, this.TEXT_Y);
      textX += this.context.measureText(suffix).width;
    }
    this.context.fillStyle = this.fg;
    this.context.fillText(
      ` (${min.toFixed(decimals)}-${parseFloat(max.toFixed(decimals))})`,
      textX,
      this.TEXT_Y
    );
  }
  // Update only graph portion
  updateGraph(valueGraph, maxGraph) {
    if (!this.context || !this.gradient) return;
    if (valueGraph === 0 && maxGraph === 0) {
      maxGraph = 1;
    }
    maxGraph = Math.max(maxGraph, valueGraph, 0.1);
    valueGraph = Math.max(valueGraph, 0);
    const graphX = Math.round(this.GRAPH_X);
    const graphY = Math.round(this.GRAPH_Y);
    const graphWidth = Math.round(this.GRAPH_WIDTH);
    const graphHeight = Math.round(this.GRAPH_HEIGHT);
    const pr = Math.round(this.PR);
    this.context.drawImage(
      this.canvas,
      graphX + pr,
      graphY,
      graphWidth - pr,
      graphHeight,
      graphX,
      graphY,
      graphWidth - pr,
      graphHeight
    );
    this.context.fillStyle = this.bg;
    this.context.fillRect(
      graphX + graphWidth - pr,
      graphY,
      pr,
      graphHeight
    );
    const columnHeight = Math.min(
      graphHeight,
      Math.round(valueGraph / maxGraph * graphHeight)
    );
    if (columnHeight > 0) {
      this.context.globalAlpha = 0.9;
      this.context.fillStyle = this.gradient;
      this.context.fillRect(
        graphX + graphWidth - pr,
        graphY + (graphHeight - columnHeight),
        pr,
        columnHeight
      );
    }
    this.context.globalAlpha = 1;
  }
};

// node_modules/stats-gl/dist/panelVsync.js
var PanelVSync = class extends Panel {
  constructor(name, fg, bg) {
    super(name, fg, bg);
    this.vsyncValue = 0;
    this.SMALL_HEIGHT = 9 * this.PR;
    this.HEIGHT = this.SMALL_HEIGHT;
    this.WIDTH = 35 * this.PR;
    this.TEXT_Y = 0 * this.PR;
    this.canvas.height = this.HEIGHT;
    this.canvas.width = this.WIDTH;
    this.canvas.style.height = "9px";
    this.canvas.style.width = "35px";
    this.canvas.style.cssText = `
            width: 35px;
            height: 9px;
            position: absolute;
            top: 0;
            left: 0;
            background-color: transparent !important;
            pointer-events: none;
        `;
    this.initializeCanvas();
  }
  initializeCanvas() {
    if (!this.context) return;
    this.context.imageSmoothingEnabled = false;
    this.context.font = "bold " + 9 * this.PR + "px Helvetica,Arial,sans-serif";
    this.context.textBaseline = "top";
    this.context.globalAlpha = 1;
  }
  // Override update for VSync-specific display
  update(value, _maxValue, _decimals = 0) {
    if (!this.context) return;
    this.vsyncValue = value;
    this.context.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    this.context.globalAlpha = 1;
    this.context.fillStyle = this.bg;
    this.context.fillText(
      `${value.toFixed(0)}Hz`,
      this.TEXT_X,
      this.TEXT_Y
    );
  }
  // Override updateGraph to do nothing (we don't need a graph for VSync)
  updateGraph(_valueGraph, _maxGraph) {
    return;
  }
  // Method to set the offset position relative to parent panel
  setOffset(x, y) {
    this.canvas.style.transform = `translate(${x}px, ${y}px)`;
  }
};

// node_modules/stats-gl/dist/panelTexture.js
var PanelTexture = class extends Panel {
  // Source texture aspect ratio (width/height)
  constructor(name) {
    super(name, "#fff", "#111");
    this.currentBitmap = null;
    this.sourceAspect = 1;
    this.initializeCanvas();
  }
  initializeCanvas() {
    if (!this.context) return;
    this.context.imageSmoothingEnabled = true;
    this.context.font = "bold " + 9 * this.PR + "px Helvetica,Arial,sans-serif";
    this.context.textBaseline = "top";
    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    this.drawLabelOverlay();
  }
  drawLabelOverlay() {
    if (!this.context) return;
    this.context.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.context.fillRect(0, 0, this.WIDTH, this.GRAPH_Y);
    this.context.fillStyle = this.fg;
    this.context.fillText(this.name, this.TEXT_X, this.TEXT_Y);
  }
  /**
   * Set the source texture aspect ratio for proper display
   * @param width - Source texture width
   * @param height - Source texture height
   */
  setSourceSize(width, height) {
    this.sourceAspect = width / height;
  }
  updateTexture(bitmap) {
    if (!this.context) return;
    if (this.currentBitmap) {
      this.currentBitmap.close();
    }
    this.currentBitmap = bitmap;
    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    const panelAspect = this.WIDTH / this.HEIGHT;
    let destWidth;
    let destHeight;
    let destX;
    let destY;
    if (this.sourceAspect > panelAspect) {
      destWidth = this.WIDTH;
      destHeight = this.WIDTH / this.sourceAspect;
      destX = 0;
      destY = (this.HEIGHT - destHeight) / 2;
    } else {
      destHeight = this.HEIGHT;
      destWidth = this.HEIGHT * this.sourceAspect;
      destX = (this.WIDTH - destWidth) / 2;
      destY = 0;
    }
    this.context.drawImage(
      bitmap,
      destX,
      destY,
      destWidth,
      destHeight
    );
    this.drawLabelOverlay();
  }
  setLabel(label) {
    this.name = label;
    this.drawLabelOverlay();
  }
  // Override update - not used for texture panels
  update(_value, _maxValue, _decimals = 0, _suffix = "") {
  }
  // Override updateGraph - not used for texture panels
  updateGraph(_valueGraph, _maxGraph) {
  }
  /**
   * Dispose of resources
   */
  dispose() {
    if (this.currentBitmap) {
      this.currentBitmap.close();
      this.currentBitmap = null;
    }
  }
};

// node_modules/stats-gl/dist/textureCapture.js
var DEFAULT_PREVIEW_WIDTH = 90;
var DEFAULT_PREVIEW_HEIGHT = 48;
var TextureCaptureWebGL = class {
  constructor(gl, width = DEFAULT_PREVIEW_WIDTH, height = DEFAULT_PREVIEW_HEIGHT) {
    this.previewFbo = null;
    this.previewTexture = null;
    this.gl = gl;
    this.previewWidth = width;
    this.previewHeight = height;
    this.pixels = new Uint8Array(width * height * 4);
    this.flippedPixels = new Uint8Array(width * height * 4);
    this.initResources();
  }
  /**
   * Resize preview dimensions
   */
  resize(width, height) {
    if (width === this.previewWidth && height === this.previewHeight) return;
    this.previewWidth = width;
    this.previewHeight = height;
    this.pixels = new Uint8Array(width * height * 4);
    this.flippedPixels = new Uint8Array(width * height * 4);
    this.dispose();
    this.initResources();
  }
  initResources() {
    const gl = this.gl;
    this.previewTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.previewTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.previewWidth, this.previewHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.previewFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.previewFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.previewTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  async capture(source, sourceWidth, sourceHeight, _sourceId = "default") {
    const gl = this.gl;
    const prevReadFbo = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
    const prevDrawFbo = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.previewFbo);
    gl.blitFramebuffer(
      0,
      0,
      sourceWidth,
      sourceHeight,
      0,
      0,
      this.previewWidth,
      this.previewHeight,
      gl.COLOR_BUFFER_BIT,
      gl.LINEAR
    );
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.previewFbo);
    gl.readPixels(0, 0, this.previewWidth, this.previewHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, prevReadFbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, prevDrawFbo);
    const flipped = this.flipY(this.pixels, this.previewWidth, this.previewHeight);
    const imageData = new ImageData(new Uint8ClampedArray(flipped), this.previewWidth, this.previewHeight);
    return createImageBitmap(imageData);
  }
  flipY(pixels, width, height) {
    const rowSize = width * 4;
    for (let y = 0; y < height; y++) {
      const srcOffset = y * rowSize;
      const dstOffset = (height - 1 - y) * rowSize;
      this.flippedPixels.set(pixels.subarray(srcOffset, srcOffset + rowSize), dstOffset);
    }
    return this.flippedPixels;
  }
  removeSource(_sourceId) {
  }
  dispose() {
    const gl = this.gl;
    if (this.previewFbo) {
      gl.deleteFramebuffer(this.previewFbo);
      this.previewFbo = null;
    }
    if (this.previewTexture) {
      gl.deleteTexture(this.previewTexture);
      this.previewTexture = null;
    }
  }
};
var TextureCaptureWebGPU = class {
  constructor(device, width = DEFAULT_PREVIEW_WIDTH, height = DEFAULT_PREVIEW_HEIGHT) {
    this.previewTexture = null;
    this.stagingBuffer = null;
    this.blitPipeline = null;
    this.sampler = null;
    this.bindGroupLayout = null;
    this.initialized = false;
    this.device = device;
    this.previewWidth = width;
    this.previewHeight = height;
    this.pixelsBuffer = new Uint8ClampedArray(width * height * 4);
  }
  /**
   * Resize preview dimensions
   */
  resize(width, height) {
    if (width === this.previewWidth && height === this.previewHeight) return;
    this.previewWidth = width;
    this.previewHeight = height;
    this.pixelsBuffer = new Uint8ClampedArray(width * height * 4);
    if (this.previewTexture) this.previewTexture.destroy();
    if (this.stagingBuffer) this.stagingBuffer.destroy();
    this.previewTexture = null;
    this.stagingBuffer = null;
    if (this.initialized) {
      this.createSizeResources();
    }
  }
  createSizeResources() {
    const device = this.device;
    this.previewTexture = device.createTexture({
      size: { width: this.previewWidth, height: this.previewHeight },
      format: "rgba8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    const bytesPerRow = Math.ceil(this.previewWidth * 4 / 256) * 256;
    this.stagingBuffer = device.createBuffer({
      size: bytesPerRow * this.previewHeight,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
  }
  async initResources() {
    if (this.initialized) return;
    const device = this.device;
    this.createSizeResources();
    this.sampler = device.createSampler({
      minFilter: "linear",
      magFilter: "linear"
    });
    const shaderModule = device.createShaderModule({
      code: `
        @group(0) @binding(0) var texSampler: sampler;
        @group(0) @binding(1) var texInput: texture_2d<f32>;

        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) uv: vec2f
        }

        @vertex
        fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          var positions = array<vec2f, 3>(
            vec2f(-1.0, -1.0),
            vec2f(3.0, -1.0),
            vec2f(-1.0, 3.0)
          );
          var uvs = array<vec2f, 3>(
            vec2f(0.0, 1.0),
            vec2f(2.0, 1.0),
            vec2f(0.0, -1.0)
          );

          var output: VertexOutput;
          output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
          output.uv = uvs[vertexIndex];
          return output;
        }

        @fragment
        fn fragmentMain(@location(0) uv: vec2f) -> @location(0) vec4f {
          return textureSample(texInput, texSampler, uv);
        }
      `
    });
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } }
      ]
    });
    this.blitPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: "rgba8unorm" }]
      },
      primitive: { topology: "triangle-list" }
    });
    this.initialized = true;
  }
  async capture(source) {
    await this.initResources();
    if (!this.previewTexture || !this.stagingBuffer || !this.blitPipeline || !this.sampler || !this.bindGroupLayout) {
      return null;
    }
    const device = this.device;
    const bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: this.sampler },
        { binding: 1, resource: source.createView() }
      ]
    });
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: this.previewTexture.createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 1 }
      }]
    });
    renderPass.setPipeline(this.blitPipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(3);
    renderPass.end();
    const bytesPerRow = Math.ceil(this.previewWidth * 4 / 256) * 256;
    commandEncoder.copyTextureToBuffer(
      { texture: this.previewTexture },
      { buffer: this.stagingBuffer, bytesPerRow },
      { width: this.previewWidth, height: this.previewHeight }
    );
    device.queue.submit([commandEncoder.finish()]);
    await this.stagingBuffer.mapAsync(GPUMapMode.READ);
    const data = new Uint8Array(this.stagingBuffer.getMappedRange());
    for (let y = 0; y < this.previewHeight; y++) {
      const srcOffset = y * bytesPerRow;
      const dstOffset = y * this.previewWidth * 4;
      this.pixelsBuffer.set(data.subarray(srcOffset, srcOffset + this.previewWidth * 4), dstOffset);
    }
    this.stagingBuffer.unmap();
    const imageData = new ImageData(new Uint8ClampedArray(this.pixelsBuffer), this.previewWidth, this.previewHeight);
    return createImageBitmap(imageData);
  }
  dispose() {
    if (this.previewTexture) this.previewTexture.destroy();
    if (this.stagingBuffer) this.stagingBuffer.destroy();
    this.previewTexture = null;
    this.stagingBuffer = null;
    this.blitPipeline = null;
    this.sampler = null;
    this.bindGroupLayout = null;
    this.initialized = false;
  }
};
function extractWebGLSource(target, gl) {
  if (target.isWebGLRenderTarget && target.__webglFramebuffer) {
    return {
      framebuffer: target.__webglFramebuffer,
      width: target.width || 1,
      height: target.height || 1
    };
  }
  return null;
}
function extractWebGPUSource(target, backend) {
  if (target.isRenderTarget && target.texture && backend.get) {
    const textureData = backend.get(target.texture);
    return (textureData == null ? void 0 : textureData.texture) || null;
  }
  return null;
}

// node_modules/stats-gl/dist/main.js
var _Stats = class _Stats2 extends StatsCore {
  constructor({
    trackGPU = false,
    trackCPT = false,
    trackHz = false,
    trackFPS = true,
    logsPerSecond = 4,
    graphsPerSecond = 30,
    samplesLog = 40,
    samplesGraph = 10,
    precision = 2,
    minimal = false,
    horizontal = true,
    mode = 0
  } = {}) {
    super({
      trackGPU,
      trackCPT,
      trackHz,
      trackFPS,
      logsPerSecond,
      graphsPerSecond,
      samplesLog,
      samplesGraph,
      precision
    });
    this.fpsPanel = null;
    this.msPanel = null;
    this.gpuPanel = null;
    this.gpuPanelCompute = null;
    this.vsyncPanel = null;
    this.workerCpuPanel = null;
    this.texturePanels = /* @__PURE__ */ new Map();
    this.texturePanelRow = null;
    this.textureCaptureWebGL = null;
    this.textureCaptureWebGPU = null;
    this.textureSourcesWebGL = /* @__PURE__ */ new Map();
    this.textureSourcesWebGPU = /* @__PURE__ */ new Map();
    this.texturePreviewWidth = DEFAULT_PREVIEW_WIDTH;
    this.texturePreviewHeight = DEFAULT_PREVIEW_HEIGHT;
    this.lastRendererWidth = 0;
    this.lastRendererHeight = 0;
    this.textureUpdatePending = false;
    this.updateCounter = 0;
    this.lastMin = {};
    this.lastMax = {};
    this.lastValue = {};
    this.VSYNC_RATES = [
      { refreshRate: 60, frameTime: 16.67 },
      { refreshRate: 75, frameTime: 13.33 },
      { refreshRate: 90, frameTime: 11.11 },
      { refreshRate: 120, frameTime: 8.33 },
      { refreshRate: 144, frameTime: 6.94 },
      { refreshRate: 165, frameTime: 6.06 },
      { refreshRate: 240, frameTime: 4.17 }
    ];
    this.detectedVSync = null;
    this.frameTimeHistory = [];
    this.HISTORY_SIZE = 120;
    this.VSYNC_THRESHOLD = 0.05;
    this.lastFrameTime = 0;
    this.externalData = null;
    this.hasNewExternalData = false;
    this.isWorker = false;
    this.averageWorkerCpu = { logs: [], graph: [] };
    this.handleClick = (event) => {
      event.preventDefault();
      this.showPanel(++this.mode % this.dom.children.length);
    };
    this.handleResize = () => {
      if (this.fpsPanel) this.resizePanel(this.fpsPanel);
      if (this.msPanel) this.resizePanel(this.msPanel);
      if (this.workerCpuPanel) this.resizePanel(this.workerCpuPanel);
      if (this.gpuPanel) this.resizePanel(this.gpuPanel);
      if (this.gpuPanelCompute) this.resizePanel(this.gpuPanelCompute);
    };
    this.mode = mode;
    this.horizontal = horizontal;
    this.minimal = minimal;
    this.dom = document.createElement("div");
    this.initializeDOM();
    this._panelId = 0;
    if (this.trackFPS) {
      this.fpsPanel = this.addPanel(new _Stats2.Panel("FPS", "#0ff", "#002"));
      this.msPanel = this.addPanel(new _Stats2.Panel("CPU", "#0f0", "#020"));
    }
    if (this.trackGPU) {
      this.gpuPanel = this.addPanel(new _Stats2.Panel("GPU", "#ff0", "#220"));
    }
    if (this.trackCPT) {
      this.gpuPanelCompute = this.addPanel(new _Stats2.Panel("CPT", "#e1e1e1", "#212121"));
    }
    if (this.trackHz === true) {
      this.vsyncPanel = new PanelVSync("", "#f0f", "#202");
      this.dom.appendChild(this.vsyncPanel.canvas);
      this.vsyncPanel.setOffset(56, 35);
    }
    this.setupEventListeners();
  }
  initializeDOM() {
    this.dom.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      opacity: 0.9;
      z-index: 10000;
      ${this.minimal ? "cursor: pointer;" : ""}
    `;
  }
  setupEventListeners() {
    if (this.minimal) {
      this.dom.addEventListener("click", this.handleClick);
      this.showPanel(this.mode);
    } else {
      window.addEventListener("resize", this.handleResize);
    }
  }
  /**
   * Compute and update texture preview dimensions based on renderer aspect ratio
   */
  updateTexturePreviewDimensions() {
    var _a, _b;
    if (!this.renderer) return;
    const rendererWidth = ((_a = this.renderer.domElement) == null ? void 0 : _a.width) || 0;
    const rendererHeight = ((_b = this.renderer.domElement) == null ? void 0 : _b.height) || 0;
    if (rendererWidth === this.lastRendererWidth && rendererHeight === this.lastRendererHeight) {
      return;
    }
    if (rendererWidth === 0 || rendererHeight === 0) return;
    this.lastRendererWidth = rendererWidth;
    this.lastRendererHeight = rendererHeight;
    const sourceAspect = rendererWidth / rendererHeight;
    const panelAspect = DEFAULT_PREVIEW_WIDTH / DEFAULT_PREVIEW_HEIGHT;
    let newWidth;
    let newHeight;
    if (sourceAspect > panelAspect) {
      newWidth = DEFAULT_PREVIEW_WIDTH;
      newHeight = Math.round(DEFAULT_PREVIEW_WIDTH / sourceAspect);
    } else {
      newHeight = DEFAULT_PREVIEW_HEIGHT;
      newWidth = Math.round(DEFAULT_PREVIEW_HEIGHT * sourceAspect);
    }
    newWidth = Math.max(newWidth, 16);
    newHeight = Math.max(newHeight, 16);
    if (newWidth !== this.texturePreviewWidth || newHeight !== this.texturePreviewHeight) {
      this.texturePreviewWidth = newWidth;
      this.texturePreviewHeight = newHeight;
      if (this.textureCaptureWebGL) {
        this.textureCaptureWebGL.resize(newWidth, newHeight);
      }
      if (this.textureCaptureWebGPU) {
        this.textureCaptureWebGPU.resize(newWidth, newHeight);
      }
      for (const panel of this.texturePanels.values()) {
        panel.setSourceSize(rendererWidth, rendererHeight);
      }
    }
  }
  onWebGPUTimestampSupported() {
  }
  onGPUTrackingInitialized() {
  }
  setData(data) {
    this.externalData = data;
    this.hasNewExternalData = true;
    if (!this.isWorker && this.msPanel) {
      this.isWorker = true;
      this.workerCpuPanel = new _Stats2.Panel("WRK", "#f90", "#220");
      const insertPosition = this.msPanel.id + 1;
      this.workerCpuPanel.id = insertPosition;
      if (this.gpuPanel && this.gpuPanel.id >= insertPosition) {
        this.gpuPanel.id++;
        this.resizePanel(this.gpuPanel);
      }
      if (this.gpuPanelCompute && this.gpuPanelCompute.id >= insertPosition) {
        this.gpuPanelCompute.id++;
        this.resizePanel(this.gpuPanelCompute);
      }
      const msCanvas = this.msPanel.canvas;
      if (msCanvas.nextSibling) {
        this.dom.insertBefore(this.workerCpuPanel.canvas, msCanvas.nextSibling);
      } else {
        this.dom.appendChild(this.workerCpuPanel.canvas);
      }
      this.resizePanel(this.workerCpuPanel);
      this._panelId++;
    }
  }
  update() {
    if (this.externalData) {
      this.updateFromExternalData();
    } else {
      this.updateFromInternalData();
    }
  }
  updateFromExternalData() {
    const data = this.externalData;
    this.endProfiling();
    this.addToAverage(this.totalCpuDuration, this.averageCpu);
    this.totalCpuDuration = 0;
    if (this.hasNewExternalData) {
      this.addToAverage(data.cpu, this.averageWorkerCpu);
      this.addToAverage(data.fps, this.averageFps);
      this.addToAverage(data.gpu, this.averageGpu);
      this.addToAverage(data.gpuCompute, this.averageGpuCompute);
      this.hasNewExternalData = false;
    }
    this.renderPanels();
  }
  updateFromInternalData() {
    this.endProfiling();
    if (this.webgpuNative) {
      this.resolveTimestampsAsync();
    } else if (!this.info) {
      this.processGpuQueries();
    } else {
      this.processWebGPUTimestamps();
    }
    this.updateAverages();
    this.resetCounters();
    this.renderPanels();
  }
  renderPanels() {
    var _a;
    const currentTime = performance.now();
    if (!this.isWorker) {
      this.frameTimes.push(currentTime);
      while (this.frameTimes.length > 0 && this.frameTimes[0] <= currentTime - 1e3) {
        this.frameTimes.shift();
      }
      const fps = Math.round(this.frameTimes.length);
      this.addToAverage(fps, this.averageFps);
    }
    const shouldUpdateText = currentTime >= this.prevTextTime + 1e3 / this.logsPerSecond;
    const shouldUpdateGraph = currentTime >= this.prevGraphTime + 1e3 / this.graphsPerSecond;
    const suffix = this.isWorker ? " \u26ED" : "";
    this.updatePanelComponents(this.fpsPanel, this.averageFps, 0, shouldUpdateText, shouldUpdateGraph, suffix);
    this.updatePanelComponents(this.msPanel, this.averageCpu, this.precision, shouldUpdateText, shouldUpdateGraph, "");
    if (this.workerCpuPanel && this.isWorker) {
      this.updatePanelComponents(this.workerCpuPanel, this.averageWorkerCpu, this.precision, shouldUpdateText, shouldUpdateGraph, " \u26ED");
    }
    if (this.gpuPanel) {
      this.updatePanelComponents(this.gpuPanel, this.averageGpu, this.precision, shouldUpdateText, shouldUpdateGraph, suffix);
    }
    if (this.trackCPT && this.gpuPanelCompute) {
      this.updatePanelComponents(this.gpuPanelCompute, this.averageGpuCompute, this.precision, shouldUpdateText, shouldUpdateGraph, suffix);
    }
    if (shouldUpdateText) {
      this.prevTextTime = currentTime;
    }
    if (shouldUpdateGraph) {
      this.prevGraphTime = currentTime;
      if (this.texturePanels.size > 0 && !this.textureUpdatePending) {
        this.textureUpdatePending = true;
        this.updateTexturePanels().finally(() => {
          this.textureUpdatePending = false;
        });
      }
      this.captureStatsGLNodes();
    }
    if (this.vsyncPanel !== null) {
      this.detectVSync(currentTime);
      const vsyncValue = ((_a = this.detectedVSync) == null ? void 0 : _a.refreshRate) || 0;
      if (shouldUpdateText && vsyncValue > 0) {
        this.vsyncPanel.update(vsyncValue, vsyncValue);
      }
    }
  }
  resetCounters() {
    this.renderCount = 0;
    this.totalCpuDuration = 0;
    this.beginTime = performance.now();
  }
  resizePanel(panel) {
    panel.canvas.style.position = "absolute";
    if (this.minimal) {
      panel.canvas.style.display = "none";
    } else {
      panel.canvas.style.display = "block";
      if (this.horizontal) {
        panel.canvas.style.top = "0px";
        panel.canvas.style.left = panel.id * panel.WIDTH / panel.PR + "px";
      } else {
        panel.canvas.style.left = "0px";
        panel.canvas.style.top = panel.id * panel.HEIGHT / panel.PR + "px";
      }
    }
  }
  addPanel(panel) {
    if (panel.canvas) {
      this.dom.appendChild(panel.canvas);
      panel.id = this._panelId;
      this.resizePanel(panel);
      this._panelId++;
    }
    return panel;
  }
  showPanel(id) {
    for (let i = 0; i < this.dom.children.length; i++) {
      const child = this.dom.children[i];
      child.style.display = i === id ? "block" : "none";
    }
    this.mode = id;
  }
  // ==========================================================================
  // Texture Panel API
  // ==========================================================================
  /**
   * Add a new texture preview panel
   * @param name - Label for the texture panel
   * @returns The created PanelTexture instance
   */
  addTexturePanel(name) {
    if (!this.texturePanelRow) {
      this.texturePanelRow = document.createElement("div");
      this.texturePanelRow.style.cssText = `
        position: absolute;
        top: 48px;
        left: 0;
        display: flex;
        flex-direction: row;
      `;
      this.dom.appendChild(this.texturePanelRow);
    }
    const panel = new PanelTexture(name);
    panel.canvas.style.position = "relative";
    panel.canvas.style.left = "";
    panel.canvas.style.top = "";
    this.texturePanelRow.appendChild(panel.canvas);
    this.texturePanels.set(name, panel);
    return panel;
  }
  /**
   * Set texture source for a panel (Three.js render target)
   * Auto-detects WebGL/WebGPU and extracts native handles
   * @param name - Panel name
   * @param source - Three.js RenderTarget or native texture
   */
  setTexture(name, source) {
    this.updateTexturePreviewDimensions();
    if (this.gl && !this.textureCaptureWebGL) {
      this.textureCaptureWebGL = new TextureCaptureWebGL(this.gl, this.texturePreviewWidth, this.texturePreviewHeight);
    }
    if (this.gpuDevice && !this.textureCaptureWebGPU) {
      this.textureCaptureWebGPU = new TextureCaptureWebGPU(this.gpuDevice, this.texturePreviewWidth, this.texturePreviewHeight);
    }
    const panel = this.texturePanels.get(name);
    if (source.isWebGLRenderTarget && this.gl) {
      const webglSource = extractWebGLSource(source, this.gl);
      if (webglSource) {
        this.textureSourcesWebGL.set(name, {
          target: source,
          ...webglSource
        });
        if (panel) {
          panel.setSourceSize(webglSource.width, webglSource.height);
        }
      }
      return;
    }
    if (source.isRenderTarget && this.gpuBackend) {
      const gpuTexture = extractWebGPUSource(source, this.gpuBackend);
      if (gpuTexture) {
        this.textureSourcesWebGPU.set(name, gpuTexture);
        if (panel && source.width && source.height) {
          panel.setSourceSize(source.width, source.height);
        }
      }
      return;
    }
    if (source && typeof source.createView === "function") {
      this.textureSourcesWebGPU.set(name, source);
      return;
    }
  }
  /**
   * Set WebGL framebuffer source with explicit dimensions
   * @param name - Panel name
   * @param framebuffer - WebGL framebuffer
   * @param width - Texture width
   * @param height - Texture height
   */
  setTextureWebGL(name, framebuffer, width, height) {
    this.updateTexturePreviewDimensions();
    if (this.gl && !this.textureCaptureWebGL) {
      this.textureCaptureWebGL = new TextureCaptureWebGL(this.gl, this.texturePreviewWidth, this.texturePreviewHeight);
    }
    this.textureSourcesWebGL.set(name, {
      target: { isWebGLRenderTarget: true },
      framebuffer,
      width,
      height
    });
    const panel = this.texturePanels.get(name);
    if (panel) {
      panel.setSourceSize(width, height);
    }
  }
  /**
   * Set texture from ImageBitmap (for worker mode)
   * @param name - Panel name
   * @param bitmap - ImageBitmap transferred from worker
   * @param sourceWidth - Optional source texture width for aspect ratio
   * @param sourceHeight - Optional source texture height for aspect ratio
   */
  setTextureBitmap(name, bitmap, sourceWidth, sourceHeight) {
    const panel = this.texturePanels.get(name);
    if (panel) {
      if (sourceWidth !== void 0 && sourceHeight !== void 0) {
        panel.setSourceSize(sourceWidth, sourceHeight);
      }
      panel.updateTexture(bitmap);
    }
  }
  /**
   * Remove a texture panel
   * @param name - Panel name to remove
   */
  removeTexturePanel(name) {
    const panel = this.texturePanels.get(name);
    if (panel) {
      panel.dispose();
      panel.canvas.remove();
      this.texturePanels.delete(name);
      this.textureSourcesWebGL.delete(name);
      this.textureSourcesWebGPU.delete(name);
    }
  }
  /**
   * Capture and update all texture panels
   * Called automatically during renderPanels at graphsPerSecond rate
   */
  async updateTexturePanels() {
    this.updateTexturePreviewDimensions();
    if (this.textureCaptureWebGL) {
      for (const [name, source] of this.textureSourcesWebGL) {
        const panel = this.texturePanels.get(name);
        if (panel) {
          let framebuffer = source.framebuffer;
          let width = source.width;
          let height = source.height;
          if (source.target.isWebGLRenderTarget && source.target.__webglFramebuffer) {
            framebuffer = source.target.__webglFramebuffer;
            width = source.target.width || width;
            height = source.target.height || height;
          }
          const bitmap = await this.textureCaptureWebGL.capture(framebuffer, width, height, name);
          if (bitmap) {
            panel.updateTexture(bitmap);
          }
        }
      }
    }
    if (this.textureCaptureWebGPU) {
      for (const [name, gpuTexture] of this.textureSourcesWebGPU) {
        const panel = this.texturePanels.get(name);
        if (panel) {
          const bitmap = await this.textureCaptureWebGPU.capture(gpuTexture);
          if (bitmap) {
            panel.updateTexture(bitmap);
          }
        }
      }
    }
  }
  /**
   * Capture StatsGL nodes registered by the addon
   */
  captureStatsGLNodes() {
    const captures = this._statsGLCaptures;
    if (!captures || captures.size === 0 || !this.renderer) return;
    for (const captureData of captures.values()) {
      if (captureData.capture) {
        captureData.capture(this.renderer);
      }
    }
  }
  detectVSync(currentTime) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return;
    }
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.HISTORY_SIZE) {
      this.frameTimeHistory.shift();
    }
    if (this.frameTimeHistory.length < 60) return;
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
    const variance = this.frameTimeHistory.reduce((acc, time) => acc + Math.pow(time - avgFrameTime, 2), 0) / this.frameTimeHistory.length;
    const stability = Math.sqrt(variance);
    if (stability > 2) {
      this.detectedVSync = null;
      return;
    }
    let closestMatch = null;
    let smallestDiff = Infinity;
    for (const rate of this.VSYNC_RATES) {
      const diff = Math.abs(avgFrameTime - rate.frameTime);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestMatch = rate;
      }
    }
    if (closestMatch && smallestDiff / closestMatch.frameTime <= this.VSYNC_THRESHOLD) {
      this.detectedVSync = closestMatch;
    } else {
      this.detectedVSync = null;
    }
  }
  updatePanelComponents(panel, averageArray, precision, shouldUpdateText, shouldUpdateGraph, suffix = "") {
    if (!panel || averageArray.logs.length === 0) return;
    const key = String(panel.id);
    if (!(key in this.lastMin)) {
      this.lastMin[key] = Infinity;
      this.lastMax[key] = 0;
      this.lastValue[key] = 0;
    }
    const currentValue = averageArray.logs[averageArray.logs.length - 1];
    this.lastMax[key] = Math.max(...averageArray.logs);
    this.lastMin[key] = Math.min(this.lastMin[key], currentValue);
    this.lastValue[key] = this.lastValue[key] * 0.7 + currentValue * 0.3;
    const graphMax = Math.max(
      Math.max(...averageArray.logs),
      ...averageArray.graph.slice(-this.samplesGraph)
    );
    this.updateCounter++;
    if (shouldUpdateText) {
      panel.update(
        this.lastValue[key],
        this.lastMax[key],
        precision,
        suffix
      );
    }
    if (shouldUpdateGraph) {
      panel.updateGraph(
        currentValue,
        graphMax
      );
    }
  }
  updatePanel(panel, averageArray, precision = 2) {
    if (!panel || averageArray.logs.length === 0) return;
    const currentTime = performance.now();
    if (!(panel.name in this.lastMin)) {
      this.lastMin[panel.name] = Infinity;
      this.lastMax[panel.name] = 0;
      this.lastValue[panel.name] = 0;
    }
    const currentValue = averageArray.logs[averageArray.logs.length - 1];
    const recentMax = Math.max(...averageArray.logs.slice(-30));
    this.lastMin[panel.name] = Math.min(this.lastMin[panel.name], currentValue);
    this.lastMax[panel.name] = Math.max(this.lastMax[panel.name], currentValue);
    this.lastValue[panel.name] = this.lastValue[panel.name] * 0.7 + currentValue * 0.3;
    const graphMax = Math.max(recentMax, ...averageArray.graph.slice(-this.samplesGraph));
    this.updateCounter++;
    if (this.updateCounter % (this.logsPerSecond * 2) === 0) {
      this.lastMax[panel.name] = recentMax;
      this.lastMin[panel.name] = currentValue;
    }
    if (panel.update) {
      if (currentTime >= this.prevCpuTime + 1e3 / this.logsPerSecond) {
        panel.update(
          this.lastValue[panel.name],
          currentValue,
          this.lastMax[panel.name],
          graphMax,
          precision
        );
      }
      if (currentTime >= this.prevGraphTime + 1e3 / this.graphsPerSecond) {
        panel.updateGraph(
          currentValue,
          graphMax
        );
        this.prevGraphTime = currentTime;
      }
    }
  }
  get domElement() {
    return this.dom;
  }
  /**
   * Dispose of all resources. Call when done using Stats.
   */
  dispose() {
    if (this.minimal) {
      this.dom.removeEventListener("click", this.handleClick);
    } else {
      window.removeEventListener("resize", this.handleResize);
    }
    if (this.textureCaptureWebGL) {
      this.textureCaptureWebGL.dispose();
      this.textureCaptureWebGL = null;
    }
    if (this.textureCaptureWebGPU) {
      this.textureCaptureWebGPU.dispose();
      this.textureCaptureWebGPU = null;
    }
    for (const panel of this.texturePanels.values()) {
      panel.dispose();
    }
    this.texturePanels.clear();
    this.textureSourcesWebGL.clear();
    this.textureSourcesWebGPU.clear();
    const captures = this._statsGLCaptures;
    if (captures) {
      for (const captureData of captures.values()) {
        if (captureData.dispose) {
          captureData.dispose();
        }
      }
      captures.clear();
    }
    if (this.texturePanelRow) {
      this.texturePanelRow.remove();
      this.texturePanelRow = null;
    }
    this.dom.remove();
    this.fpsPanel = null;
    this.msPanel = null;
    this.gpuPanel = null;
    this.gpuPanelCompute = null;
    this.vsyncPanel = null;
    this.workerCpuPanel = null;
    this.frameTimeHistory.length = 0;
    this.averageWorkerCpu.logs.length = 0;
    this.averageWorkerCpu.graph.length = 0;
    super.dispose();
  }
};
_Stats.Panel = Panel;
_Stats.PanelTexture = PanelTexture;
var Stats = _Stats;

// vrodos-stats-gl-entry.mjs
var vrodos_stats_gl_entry_default = Stats;
export {
  vrodos_stats_gl_entry_default as default
};
