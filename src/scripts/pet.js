(function() {
  const CATEGORY_KEYS = ['normal', 'click', 'sleep', 'special', 'walk'];
  const FALLBACK_ASSETS = {
    normal: [
      'assets/pet/normal/cute-panda-gentle-blink.gif',
      'assets/pet/normal/cute-panda-waving.gif',
      'assets/pet/normal/happy-clapping-panda.gif',
      'assets/pet/normal/panda-typing-on-laptop.gif',
      'assets/pet/normal/panda-typing-on-computer.gif',
      'assets/pet/normal/cute-panda-watching-phone.gif',
      'assets/pet/normal/cute-bear-looking-at-phone.gif',
      'assets/pet/normal/panda-ready-to-write-with-pencil.gif',
      'assets/pet/normal/panda-scrolling-phone.gif',
      'assets/pet/normal/peeking-cute-bear.gif',
      'assets/pet/normal/peeking-bear.gif',
      'assets/pet/normal/little-bear-waving.gif',
      'assets/pet/normal/happy-panda-wiggle.gif',
      'assets/pet/normal/panda-watching-butterfly.gif',
      'assets/pet/normal/rainy-panda-in-poncho.gif',
      'assets/pet/normal/panda-coming-out-of-door.gif',
      'assets/pet/normal/panda-with-hand-fans.gif',
      'assets/pet/normal/snacking-while-working.gif',
      'assets/pet/normal/panda-drinking-bubble-tea.gif',
      'assets/pet/normal/cute-bears-taking-selfie.gif'
    ],
    click: [
      'assets/pet/click/review_一二布布__1_.gif',
      'assets/pet/click/review_一二布布__1001_.gif',
      'assets/pet/click/review_一二布布__1004_.gif',
      'assets/pet/click/review_一二布布__1006_.gif',
      'assets/pet/click/panda-taking-photo.gif',
      'assets/pet/click/head-pat-cute-bear.gif',
      'assets/pet/click/bored-bear-clicking-mouse.gif',
      'assets/pet/click/bear-popping-bubble.gif',
      'assets/pet/click/two-cute-characters-clapping.gif'
    ],
    sleep: [
      'assets/pet/sleep/sleep.gif',
      'assets/pet/normal/daydreaming-bear-in-bed.gif',
      'assets/pet/sleep/panda-yawning.gif',
      'assets/pet/sleep/sleeping-panda-snoring.gif',
      'assets/pet/sleep/sleeping-cute-bear.gif',
      'assets/pet/sleep/sleeping-panda-on-moon.gif',
      'assets/pet/sleep/sleepy-panda-closing-eyes.gif',
      'assets/pet/sleep/sleepy-bed-bear-blink.gif',
      'assets/pet/sleep/sleepy-panda-with-plushies.gif',
      'assets/pet/sleep/panda-using-phone-under-blanket.gif',
      'assets/pet/sleep/cute-sleepy-character.gif',
      'assets/pet/sleep/koala-hat-panda-sleeping.gif'
    ],
    special: [
      'assets/pet/special/sun-panda-rising.gif',
      'assets/pet/special/pop-party-poppers.gif',
      'assets/pet/special/panda-sending-love-letter.gif',
      'assets/pet/special/panda-shouting-megaphone.gif',
      'assets/pet/special/panda-phone-emotion-reaction.gif',
      'assets/pet/special/shocked-panda-reaction.gif',
      'assets/pet/special/flustered-panda-blushing.gif',
      'assets/pet/special/brown-bear-offering-flowers.gif',
      'assets/pet/special/bear-opening-door-return.gif',
      'assets/pet/special/beckoning-panda-with-gold-bar.gif',
      'assets/pet/special/cupid-panda-shoot-love-arrow.gif',
      'assets/pet/special/cute-bear-showing-phone.gif',
      'assets/pet/special/shushing-panda.gif',
      'assets/pet/special/playful-cat-action.gif',
      'assets/pet/special/crying-chubby-panda.gif'
    ],
    walk: [
      'assets/pet/walk/bubu-dudu-walking.gif',
      'assets/pet/walk/bears-riding-scooters.gif',
      'assets/pet/walk/cute-bear-walking-happily.gif',
      'assets/pet/walk/cool-panda-walking.gif',
      'assets/pet/walk/confident-panda-strut.gif',
      'assets/pet/walk/happy-walking-panda.gif',
      'assets/pet/walk/happy-panda-walk.gif',
      'assets/pet/walk/panda-walking-left.gif',
      'assets/pet/walk/panda-walking-forward.gif',
      'assets/pet/walk/walking-little-bear.gif',
      'assets/pet/walk/little-bear-walking-away.gif',
      'assets/pet/walk/little-panda-riding-scooter.gif',
      'assets/pet/walk/cute-bear-riding-scooter.gif',
      'assets/pet/walk/panda-running-with-umbrella.gif',
      'assets/pet/walk/bear-riding-scooter.gif',
      'assets/pet/walk/yellow-bear-hood-walking.gif'
    ]
  };

  const INLINE_DIALOG_TEXT = [
    '[normal]',
    '一二布布巡逻中。',
    '今天也要元气满满。',
    '你先忙，我在桌面上陪你。',
    '一二一二，布布开始散步了。',
    '抬头看我一眼，别总盯着屏幕。',
    '',
    '[click]',
    '别戳啦，我会害羞的。',
    '抓到你啦。',
    '摸摸头可以，拎着走也行。',
    '我正在认真营业。',
    '再点一下我就开始表演。',
    '',
    '[sleep]',
    '呼噜......布布先眯一会。',
    '太安静了，我有点困。',
    '醒了记得叫我继续巡逻。'
  ].join('\n');

  const KEYWORDS = {
    rainy: ['rain', 'umbrella', 'poncho', 'water', 'shower', 'bath', '雨', '伞'],
    sunny: ['sun', 'flower', 'rose', 'balloon', 'ice-cream', 'cheers', '阳光', '花'],
    sleep: ['sleep', 'sleepy', 'bed', 'blanket', 'rest', 'night', '困', '床', '休息'],
    walk: ['walk', 'walking', 'ride', 'riding', 'scooter', 'travel', 'wave', 'door', '散步', '出行'],
    click: ['blink', 'wink', 'tongue', 'surprised', 'shy', 'reaction', 'tease', 'heart', '眨眼', '调皮'],
    focus: ['computer', 'laptop', 'typing', 'writing', 'phone', 'watching', 'knitting', '认真', '工作'],
    celebrate: ['clap', 'cheers', 'party', 'rose', 'love', 'heart', 'happy', 'flower', '庆祝', '开心'],
    page: ['walk', 'wave', 'travel', 'door', 'outing', 'move'],
    avoidFocus: ['sleep', 'sleepy', 'bed', 'phone', 'lazy', '犯困', '刷手机', '躺', '休息']
  };

  const DEFAULT_DIALOG = {
    normal: [
      '一二布布巡逻中。',
      '今天也要元气满满。',
      '你先忙，我在旁边陪你。'
    ],
    click: [
      '别戳啦，我会害羞的。',
      '抓到你啦。',
      '再点一下我就开始表演。'
    ],
    sleep: [
      '呼噜......布布先眯一会。',
      '太安静了，我有点困。'
    ],
    weather: {
      rainy: ['下雨了，我今天走慢一点。', '空气潮潮的，适合发呆。'],
      sunny: ['太阳不错，适合在窗口散步。', '晴天模式启动，继续巡逻。'],
      snowy: ['外面像撒了糖霜一样。']
    },
    pomodoro: {
      focus: ['专注开始，我替你守着时间。', '认真工作中，我会安静一点。'],
      complete: ['番茄完成，表现很好。', '这一轮做得漂亮，休息一下。'],
      break: ['休息一下吧，我也伸个懒腰。'],
      interrupt: ['没关系，重新开始也算前进。']
    },
    page: ['换页成功，我继续跟上。']
  };

  const AUTONOMY_STATES = {
    idle: {
      delayMin: 3200,
      delayMax: 6200,
      transitions: { idle: 44, walk: 34, celebrate: 22 }
    },
    walk: {
      delayMin: 2800,
      delayMax: 5200,
      transitions: { idle: 58, walk: 16, celebrate: 26 }
    },
    celebrate: {
      delayMin: 2200,
      delayMax: 3800,
      transitions: { idle: 70, walk: 30 }
    }
  };

  function sample(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function normalizeManifestEntry(entry) {
    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    const pieces = [
      entry.name,
      entry.aiName,
      entry.description,
      entry.fineCategory,
      entry.fineLabel,
      ...tags
    ].filter(Boolean);

    return {
      ...entry,
      tags,
      searchText: pieces.join(' ').toLowerCase(),
      frameCount: Number(entry.frameCount || 0),
      durationMs: Number(entry.durationMs || 0),
      motionScore: Number(entry.motionScore || 0),
      confidence: Number(entry.confidence || 0)
    };
  }

  function filenameToAiName(relativePath) {
    const filename = relativePath.split('/').pop() || relativePath;
    return filename.replace(/\.gif$/i, '');
  }

  class DashboardPet {
    constructor() {
      this.edgeSnapDistance = 88;
      this.returnEpsilon = 1.2;
      this.returnSpeedX = 0.02;
      this.returnSpeedY = 0.024;
      this.layer = null;
      this.shell = null;
      this.image = null;
      this.altImage = null;
      this.imageSwapToken = 0;
      this.speech = null;
      this.dialogues = DEFAULT_DIALOG;
      this.state = 'idle';
      this.intentHint = null;
      this.currentAsset = null;
      this.position = { x: 1480, y: 270 };
      this.bounds = { minX: 24, maxX: 1710, minY: 36, maxY: 300 };
      this.direction = 1;
      this.speed = 0.075;
      this.lastFrameAt = 0;
      this.nextDecisionAt = 0;
      this.stateStartedAt = 0;
      this.weatherMood = 'sunny';
      this.pomodoroState = null;
      this.pageIndex = 0;
      this.speechTimer = null;
      this.reactTimer = null;
      this.stateTimer = null;
      this.suppressClickTimer = null;
      this.recentAssets = [];
      this.recentAssetsByLabel = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, []]));
      this.manifestReady = false;
      this.assetManifest = [];
      this.assetsByLabel = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, []]));
      this.dragPointerId = null;
      this.dragOffset = { x: 0, y: 0 };
      this.dragStart = { x: 0, y: 0 };
      this.isDragging = false;
      this.didDragMove = false;
      this.suppressNextClick = false;
      this.isReturningToLane = false;
      this.returnTarget = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;
      this.createDom();
      this.bindEvents();
      this.loadDialogues();
      this.setState(this.isNightTime() ? 'sleep' : 'idle', { speak: false, force: true });
      this.render();
      this.nextDecisionAt = performance.now() + 1400;
      this.lastFrameAt = performance.now();
      requestAnimationFrame(this.loop.bind(this));

      this.loadManifest().then(() => {
        this.preloadAssets();
        this.setState(this.isNightTime() ? 'sleep' : 'idle', { speak: false, force: true, intent: 'manifest-ready' });
      }).catch(() => {
        this.preloadAssets();
      });

      const weatherSnapshot = typeof window.getLatestWeatherSnapshot === 'function'
        ? window.getLatestWeatherSnapshot()
        : null;
      if (weatherSnapshot) this.applyWeatherSnapshot(weatherSnapshot);
    }

    createDom() {
      this.layer = document.createElement('div');
      this.layer.className = 'pet-layer';

      this.shell = document.createElement('button');
      this.shell.type = 'button';
      this.shell.className = 'pet-shell';
      this.shell.setAttribute('aria-label', '页面宠物');

      const stage = document.createElement('div');
      stage.className = 'pet-stage';

      this.image = document.createElement('img');
      this.image.className = 'pet-image is-active';
      this.image.alt = '一二布布';
      this.image.src = FALLBACK_ASSETS.normal[0];
      this.image.dataset.asset = FALLBACK_ASSETS.normal[0];

      this.altImage = document.createElement('img');
      this.altImage.className = 'pet-image';
      this.altImage.alt = '一二布布';
      this.altImage.src = FALLBACK_ASSETS.normal[0];
      this.altImage.dataset.asset = FALLBACK_ASSETS.normal[0];

      stage.appendChild(this.image);
      stage.appendChild(this.altImage);

      this.speech = document.createElement('div');
      this.speech.className = 'pet-speech';

      this.shell.appendChild(stage);
      this.shell.appendChild(this.speech);
      this.layer.appendChild(this.shell);
      document.body.appendChild(this.layer);
    }

    async loadManifest() {
      // Priority 1: Rust filesystem scan (Tauri)
      if (typeof window.__TAURI__ !== 'undefined') {
        try {
          const manifest = await window.__TAURI__.core.invoke('assets_scan_pet_dir');
          if (manifest && Array.isArray(manifest.entries) && manifest.entries.length) {
            this.hydrateAssetManifest(manifest.entries);
            // Store dialog text from Rust
            if (manifest.dialogText && !this._dialogLoaded) {
              this._dialogLoaded = true;
              this.applyDialogText(manifest.dialogText);
            }
            return;
          }
        } catch (_) {
          // Fall through to fallback
        }
      }

      // Priority 2: Inlined manifest from pet-data.js
      if (Array.isArray(window.PET_ASSET_MANIFEST) && window.PET_ASSET_MANIFEST.length) {
        this.hydrateAssetManifest(window.PET_ASSET_MANIFEST);
        return;
      }

      // Priority 3: Build from hardcoded fallback
      this.hydrateAssetManifest(this.buildFallbackManifestEntries());
    }

    hydrateAssetManifest(entries) {
      this.assetManifest = Array.isArray(entries) ? entries.map(normalizeManifestEntry) : [];
      this.assetsByLabel = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, []]));
      this.assetManifest.forEach((entry) => {
        const key = CATEGORY_KEYS.includes(entry.label) ? entry.label : 'normal';
        this.assetsByLabel[key].push(entry);
      });
      this.manifestReady = this.assetManifest.length > 0;
    }

    buildFallbackManifestEntries() {
      return CATEGORY_KEYS.flatMap((label) => {
        return (FALLBACK_ASSETS[label] || []).map((relativePath) => ({
          name: relativePath.split('/').pop(),
          label,
          sourceFolder: label,
          relativePath,
          width: null,
          height: null,
          frameCount: 0,
          durationMs: 0,
          motionScore: 0,
          opaqueRatio: null,
          subjectRatio: null,
          suggestion: label,
          aiName: filenameToAiName(relativePath),
          description: null,
          tags: [],
          confidence: 0,
          fineCategory: null,
          fineLabel: null
        }));
      });
    }

    preloadAssets() {
      const preloadPaths = [];
      CATEGORY_KEYS.forEach((key) => {
        const liveBucket = this.getAssetBucket(key).slice(0, 8).map((entry) => entry.relativePath);
        preloadPaths.push(...liveBucket);
      });

      [...new Set(preloadPaths)].forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }

    loadDialogues() {
      // Dialog text is now provided by Rust scan (see loadManifest)
      // Fallback: inline text or default
      if (this._dialogLoaded) return;

      if (typeof window.PET_DIALOG_TEXT === 'string' && window.PET_DIALOG_TEXT.trim()) {
        this.applyDialogText(window.PET_DIALOG_TEXT);
        return;
      }

      this.applyDialogText(INLINE_DIALOG_TEXT);
    }

    applyDialogText(text) {
      if (!text) return;
      const parsed = this.parseDialogText(text);
      this.dialogues = {
        ...DEFAULT_DIALOG,
        normal: parsed.normal.length ? parsed.normal : DEFAULT_DIALOG.normal,
        click: parsed.click.length ? parsed.click : DEFAULT_DIALOG.click,
        sleep: parsed.sleep.length ? parsed.sleep : DEFAULT_DIALOG.sleep
      };
    }

    parseDialogText(text) {
      const sections = { normal: [], click: [], sleep: [] };
      let current = 'normal';
      text.split(/\r?\n/).forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) return;
        if (line.startsWith('[') && line.endsWith(']')) {
          current = line.slice(1, -1).toLowerCase();
          if (!sections[current]) sections[current] = [];
          return;
        }
        sections[current].push(line);
      });
      return sections;
    }

    bindEvents() {
      this.shell.addEventListener('click', () => this.handleClick());
      this.shell.addEventListener('mouseenter', () => this.handleHoverEnter());
      this.shell.addEventListener('mouseleave', () => this.handleHoverLeave());
      this.shell.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
      this.shell.addEventListener('pointermove', (event) => this.handlePointerMove(event));
      this.shell.addEventListener('pointerup', (event) => this.handlePointerUp(event));
      this.shell.addEventListener('pointercancel', (event) => this.handlePointerUp(event));
      this.shell.addEventListener('mousedown', (event) => this.handleMouseDown(event));
      window.addEventListener('mousemove', (event) => this.handleMouseMove(event));
      window.addEventListener('mouseup', (event) => this.handleMouseUp(event));
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.nextDecisionAt = performance.now() + 600;
      });

      document.addEventListener('weather:updated', (event) => {
        this.applyWeatherSnapshot(event.detail);
      });

      document.addEventListener('pomodoro:statechange', (event) => {
        this.applyPomodoroState(event.detail);
      });

      document.addEventListener('page:changed', (event) => {
        this.pageIndex = event.detail.pageIndex;
        this.flashReaction();
        this.sayRandom('page');
        this.setState('walk', { speak: false, force: true, intent: 'page-change' });
      });
    }

    loop(timestamp) {
      const delta = Math.min(80, timestamp - this.lastFrameAt || 16);
      this.lastFrameAt = timestamp;

      if (this.isNightTime()) {
        if (this.state !== 'sleep') {
          this.setState('sleep', { speak: true, source: 'sleep', force: true });
        }
      } else {
        if (this.state === 'sleep') {
          this.setState('idle', { speak: false, force: true, intent: 'wake-up' });
        }

        if (!this.isDragging && this.isReturningToLane) {
          this.updateReturnToLane(delta);
        }

        if (!this.isDragging && !this.isReturningToLane && timestamp >= this.nextDecisionAt && !this.stateTimer) {
          this.makeAutonomousDecision(timestamp);
        }

        if (!this.isDragging && !this.isReturningToLane && this.state === 'walk') {
          this.updateMotion(delta);
        }
      }

      this.render();
      requestAnimationFrame(this.loop.bind(this));
    }

    makeAutonomousDecision(timestamp) {
      if (this.pomodoroState && this.pomodoroState.isRunning && this.pomodoroState.mode === 'work') {
        this.setState('focus', { speak: false, force: true, intent: 'pomodoro-focus' });
        this.nextDecisionAt = timestamp + 3200;
        return;
      }

      const nextState = this.pickAutonomousState(timestamp);
      if (nextState === 'walk') {
        this.direction = Math.random() > 0.5 ? 1 : -1;
      }

      if (nextState === 'celebrate') {
        this.setState('celebrate', { speak: Math.random() < 0.32, force: true, intent: `idle-${this.weatherMood}` });
      } else if (nextState === 'idle') {
        this.setState('idle', { speak: Math.random() < 0.28, source: 'normal', force: true, intent: `idle-${this.weatherMood}` });
      } else {
        this.setState('walk', { speak: false, force: true, intent: `weather-${this.weatherMood}` });
      }

      this.nextDecisionAt = timestamp + this.getDecisionDelay(nextState);
    }

    pickAutonomousState(timestamp) {
      const stateKey = AUTONOMY_STATES[this.state] ? this.state : 'idle';
      const config = AUTONOMY_STATES[stateKey];
      const weights = { ...config.transitions };
      const stateAge = timestamp - this.stateStartedAt;
      const hour = new Date().getHours();

      if (stateKey === 'idle' && stateAge > 12000) {
        weights.walk = (weights.walk || 0) + 24;
        weights.idle = Math.max(8, (weights.idle || 0) - 18);
      }

      if (this.weatherMood === 'rainy') {
        if (weights.walk) weights.walk *= 0.55;
        if (weights.idle) weights.idle *= 1.2;
      } else if (this.weatherMood === 'snowy') {
        if (weights.walk) weights.walk *= 0.72;
        if (weights.idle) weights.idle *= 1.15;
      } else {
        if (weights.walk) weights.walk *= 1.1;
        if (weights.celebrate) weights.celebrate *= 1.08;
      }

      if (hour >= 6 && hour < 10) {
        if (weights.walk) weights.walk *= 1.16;
        if (weights.celebrate) weights.celebrate *= 1.08;
      } else if (hour >= 19 && hour < 23) {
        if (weights.walk) weights.walk *= 0.8;
        if (weights.idle) weights.idle *= 1.12;
      }

      return this.pickWeightedState(weights, 'idle');
    }

    pickWeightedState(weights, fallback) {
      const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
      if (!entries.length) return fallback;

      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let threshold = Math.random() * total;
      for (const [state, weight] of entries) {
        threshold -= weight;
        if (threshold <= 0) return state;
      }

      return entries[entries.length - 1][0] || fallback;
    }

    getDecisionDelay(state) {
      const config = AUTONOMY_STATES[state] || AUTONOMY_STATES.idle;
      let min = config.delayMin;
      let max = config.delayMax;

      if (this.weatherMood === 'rainy') {
        min += 900;
        max += 1400;
      } else if (this.weatherMood === 'snowy') {
        min += 500;
        max += 900;
      }

      return randomBetween(min, max);
    }

    updateMotion(deltaMs) {
      const pace = this.speed * deltaMs * (this.pomodoroState && this.pomodoroState.isRunning ? 0.65 : 1);
      this.position.x += pace * this.direction;
      this.position.y = this.getPatrolLaneY();

      if (this.position.x <= this.bounds.minX) {
        this.position.x = this.bounds.minX;
        this.direction = 1;
        this.setState('idle', { speak: false, force: true, intent: 'turn-around' });
      } else if (this.position.x >= this.bounds.maxX) {
        this.position.x = this.bounds.maxX;
        this.direction = -1;
        this.setState('idle', { speak: false, force: true, intent: 'turn-around' });
      }
    }

    setState(nextState, options = {}) {
      if (this.state === nextState && !options.force) return;
      this.state = nextState;
      this.stateStartedAt = performance.now();
      this.intentHint = options.intent || null;
      this.applyVisualState();

      if (options.speak) {
        this.sayRandom(options.source || this.mapStateToSpeech(nextState));
      } else if (options.clearSpeech) {
        this.clearSpeech();
      }
    }

    applyVisualState() {
      this.shell.classList.toggle('is-sleeping', this.state === 'sleep');
      this.shell.classList.toggle('is-focused', this.state === 'focus');
      this.shell.style.setProperty('--pet-face', this.state === 'sleep' ? '1' : (this.direction < 0 ? '-1' : '1'));

      const entry = this.selectEntryForState(this.state, this.intentHint);
      if (entry) {
        this.currentAsset = entry;
        this.swapPetImage(entry.relativePath);
        this.rememberAsset(entry.name);
      }
    }

    handleClick() {
      if (this.suppressNextClick) {
        clearTimeout(this.suppressClickTimer);
        this.suppressClickTimer = null;
        this.suppressNextClick = false;
        return;
      }
      this.flashReaction();
      this.setState('interact', { speak: true, source: 'click', force: true, intent: 'click' });
      this.scheduleReturnToIdle(1500);
    }

    handleHoverEnter() {
      this.shell.classList.add('is-hovered');
      if (this.isDragging) return;
      if (this.state === 'sleep') {
        this.say('嘘，我还在打盹。');
        return;
      }

      this.sayRandom(this.state === 'walk' ? 'page' : 'normal');
    }

    handleHoverLeave() {
      this.shell.classList.remove('is-hovered');
      if (this.state !== 'interact') {
        this.clearSpeech();
      }
    }

    handlePointerDown(event) {
      if (event.button !== 0 || this.dragPointerId !== null) return;
      event.preventDefault();
      this.stopReturnToLane();
      this.startDragSession(event.pointerId, event.clientX, event.clientY);
      try {
        this.shell.setPointerCapture(event.pointerId);
      } catch (_) {}
    }

    handlePointerMove(event) {
      if (event.pointerId !== this.dragPointerId) return;
      event.preventDefault();
      this.moveDragSession(event.pointerId, event.clientX, event.clientY);
    }

    handlePointerUp(event) {
      if (event.pointerId !== this.dragPointerId) return;
      if (this.shell.hasPointerCapture(event.pointerId)) {
        this.shell.releasePointerCapture(event.pointerId);
      }
      this.endDragSession(event.pointerId);
    }

    handleMouseDown(event) {
      if (event.button !== 0 || this.dragPointerId !== null) return;
      event.preventDefault();
      this.stopReturnToLane();
      this.startDragSession('mouse', event.clientX, event.clientY);
    }

    handleMouseMove(event) {
      if (this.dragPointerId !== 'mouse') return;
      event.preventDefault();
      this.moveDragSession('mouse', event.clientX, event.clientY);
    }

    handleMouseUp(event) {
      if (this.dragPointerId !== 'mouse' || event.button !== 0) return;
      this.endDragSession('mouse');
    }

    startDragSession(sessionId, clientX, clientY) {
      this.dragPointerId = sessionId;
      this.dragStart = { x: clientX, y: clientY };
      this.dragOffset = {
        x: clientX - this.position.x,
        y: clientY - this.position.y
      };
      this.isDragging = false;
      this.didDragMove = false;
      this.shell.classList.add('is-dragging');
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
      this.setState('interact', { speak: false, force: true, intent: 'drag-start', clearSpeech: true });
    }

    moveDragSession(sessionId, clientX, clientY) {
      if (sessionId !== this.dragPointerId) return;
      const deltaX = clientX - this.dragStart.x;
      const deltaY = clientY - this.dragStart.y;
      if (!this.didDragMove && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        this.didDragMove = true;
        this.isDragging = true;
        this.suppressNextClick = true;
        clearTimeout(this.suppressClickTimer);
      }
      if (!this.isDragging) return;

      this.position.x = this.clamp(clientX - this.dragOffset.x, this.bounds.minX, this.bounds.maxX);
      this.position.y = this.clamp(clientY - this.dragOffset.y, this.bounds.minY, this.bounds.maxY);
      this.render();
    }

    endDragSession(sessionId) {
      if (sessionId !== this.dragPointerId) return;
      this.dragPointerId = null;
      this.shell.classList.remove('is-dragging');

      const wasDragging = this.isDragging;
      this.isDragging = false;
      if (wasDragging) {
        this.beginReturnToLane();
        this.nextDecisionAt = performance.now() + 1200;
        this.setState(this.isNightTime() ? 'sleep' : 'idle', {
          speak: false,
          force: true,
          intent: 'drag-end',
          clearSpeech: true
        });
        this.suppressClickTimer = setTimeout(() => {
          this.suppressNextClick = false;
          this.suppressClickTimer = null;
        }, 240);
      }
    }

    beginReturnToLane() {
      const laneY = this.getPatrolLaneY();
      const snapLeft = Math.abs(this.position.x - this.bounds.minX) <= this.edgeSnapDistance;
      const snapRight = Math.abs(this.position.x - this.bounds.maxX) <= this.edgeSnapDistance;
      let targetX = this.position.x;

      if (snapLeft && (!snapRight || this.position.x <= (this.bounds.minX + this.bounds.maxX) / 2)) {
        targetX = this.bounds.minX;
      } else if (snapRight) {
        targetX = this.bounds.maxX;
      }

      this.returnTarget = { x: targetX, y: laneY };
      this.isReturningToLane = true;
    }

    stopReturnToLane() {
      this.isReturningToLane = false;
      this.returnTarget = null;
    }

    updateReturnToLane(deltaMs) {
      if (!this.returnTarget) {
        this.isReturningToLane = false;
        return;
      }

      const xFactor = 1 - Math.exp(-this.returnSpeedX * deltaMs);
      const yFactor = 1 - Math.exp(-this.returnSpeedY * deltaMs);
      this.position.x += (this.returnTarget.x - this.position.x) * xFactor;
      this.position.y += (this.returnTarget.y - this.position.y) * yFactor;

      const xDone = Math.abs(this.returnTarget.x - this.position.x) <= this.returnEpsilon;
      const yDone = Math.abs(this.returnTarget.y - this.position.y) <= this.returnEpsilon;

      if (xDone) this.position.x = this.returnTarget.x;
      if (yDone) this.position.y = this.returnTarget.y;

      if (xDone && yDone) {
        this.stopReturnToLane();
      }
    }

    flashReaction() {
      if (!this.image) return;
      this.image.classList.remove('is-reacting');
      void this.image.offsetWidth;
      this.image.classList.add('is-reacting');
      clearTimeout(this.reactTimer);
      this.reactTimer = setTimeout(() => {
        if (this.image) this.image.classList.remove('is-reacting');
      }, 480);
    }

    swapPetImage(relativePath) {
      if (!this.image || !this.altImage || !relativePath) return;
      if (this.image.dataset.asset === relativePath) return;

      const incoming = this.altImage;
      const outgoing = this.image;
      const swapToken = ++this.imageSwapToken;
      const finalizeSwap = () => {
        if (swapToken !== this.imageSwapToken) return;
        incoming.classList.add('is-active');
        outgoing.classList.remove('is-active', 'is-reacting');
        this.image = incoming;
        this.altImage = outgoing;
      };

      incoming.alt = outgoing.alt;
      incoming.dataset.asset = relativePath;
      incoming.onload = () => {
        incoming.onload = null;
        finalizeSwap();
      };
      incoming.src = relativePath;

      if (incoming.complete) {
        incoming.onload = null;
        requestAnimationFrame(finalizeSwap);
      }
    }

    scheduleReturnToIdle(delayMs) {
      clearTimeout(this.stateTimer);
      this.stateTimer = setTimeout(() => {
        this.stateTimer = null;
        this.setState(this.isNightTime() ? 'sleep' : 'idle', { speak: false, force: true, intent: 'resume-idle' });
      }, delayMs);
    }

    say(text) {
      if (!text) return;
      this.speech.textContent = text;
      this.speech.classList.add('visible');
      clearTimeout(this.speechTimer);
      this.speechTimer = setTimeout(() => {
        this.speech.classList.remove('visible');
      }, 2800);
    }

    clearSpeech() {
      clearTimeout(this.speechTimer);
      this.speech.classList.remove('visible');
    }

    sayRandom(source) {
      const contextual = this.getContextualSpeechLines(source);
      const base = this.getSpeechBucket(source);
      if (contextual.length && (!base.length || Math.random() < 0.72)) {
        this.say(sample(contextual));
        return;
      }
      const lines = [...contextual, ...base];
      if (!lines.length) return;
      this.say(sample(lines));
    }

    getSpeechBucket(source) {
      if (source === 'weather') {
        return this.dialogues.weather[this.weatherMood] || this.dialogues.weather.sunny;
      }
      if (source === 'pomodoro-focus') return this.dialogues.pomodoro.focus;
      if (source === 'pomodoro-complete') return this.dialogues.pomodoro.complete;
      if (source === 'pomodoro-break') return this.dialogues.pomodoro.break;
      if (source === 'pomodoro-interrupt') return this.dialogues.pomodoro.interrupt;
      const bucket = this.dialogues[source];
      return Array.isArray(bucket) ? bucket : this.dialogues.normal;
    }

    getContextualSpeechLines(source) {
      if (!this.currentAsset) return [];

      const shortDescription = this.toShortDescription(this.currentAsset.description);
      const firstTag = Array.isArray(this.currentAsset.tags) && this.currentAsset.tags.length
        ? this.currentAsset.tags[0]
        : null;
      const fineLabel = this.currentAsset.fineLabel;
      const moodLabel = firstTag || fineLabel || '状态';

      if (source === 'click') {
        return shortDescription
          ? [`现在是“${shortDescription}”模式。`, `${moodLabel}反应，收到。`]
          : [];
      }

      if (source === 'page') {
        return shortDescription
          ? [`我带着“${shortDescription}”跟过来了。`]
          : [];
      }

      if (source === 'weather') {
        if (!shortDescription) return [];
        if (this.weatherMood === 'rainy') return [`这种天气，切成“${shortDescription}”更合适。`];
        if (this.weatherMood === 'snowy') return [`外面冷一点，我现在像“${shortDescription}”。`];
        return [`今天天气不错，适合“${shortDescription}”。`];
      }

      if (source === 'pomodoro-focus') {
        return shortDescription
          ? [`我切到“${shortDescription}”陪你专注。`]
          : [`${moodLabel}模式，开始守着你专注。`];
      }

      if (source === 'pomodoro-complete') {
        return shortDescription
          ? [`这一轮完成得像“${shortDescription}”一样顺。`]
          : [`${moodLabel}时间到了，辛苦了。`];
      }

      if (source === 'pomodoro-break') {
        return shortDescription
          ? [`先切到“${shortDescription}”缓一缓。`]
          : [`换个${moodLabel}节奏，休息一下。`];
      }

      if (source === 'pomodoro-interrupt') {
        return shortDescription
          ? [`先停一下，我用“${shortDescription}”陪你重整。`]
          : [];
      }

      if (source === 'sleep') {
        return shortDescription
          ? [`我要切到“${shortDescription}”慢慢休息。`]
          : [];
      }

      if (source === 'normal') {
        return shortDescription
          ? [`现在是“${shortDescription}”。`]
          : [];
      }

      return [];
    }

    toShortDescription(description) {
      if (!description) return '';
      const compact = String(description).replace(/[。！!？?]/g, '').trim();
      if (compact.length <= 12) return compact;
      return compact.slice(0, 12) + '...';
    }

    applyWeatherSnapshot(snapshot) {
      if (!snapshot) return;
      if (snapshot.isSnowy) {
        this.weatherMood = 'snowy';
      } else if (snapshot.isRainy) {
        this.weatherMood = 'rainy';
      } else {
        this.weatherMood = 'sunny';
      }

      if (!this.isNightTime() && this.state !== 'interact' && Math.random() < 0.72) {
        this.setState('idle', { speak: false, force: true, intent: `weather-${this.weatherMood}` });
        this.sayRandom('weather');
      }
    }

    applyPomodoroState(state) {
      this.pomodoroState = state;
      if (!state) return;

      if (state.reason === 'complete-work') {
        this.flashReaction();
        this.sayRandom('pomodoro-complete');
        this.setState('celebrate', { speak: false, force: true, intent: 'pomodoro-complete' });
        this.scheduleReturnToIdle(2200);
        return;
      }

      if (state.reason === 'interruption') {
        this.sayRandom('pomodoro-interrupt');
        this.setState('idle', { speak: false, force: true, intent: 'pomodoro-interrupt' });
        return;
      }

      if (state.isRunning && state.mode === 'work') {
        this.setState('focus', { speak: false, force: true, intent: 'pomodoro-focus' });
        if (state.reason === 'start' || state.reason === 'switch-mode') {
          this.sayRandom('pomodoro-focus');
        }
        return;
      }

      if (state.isRunning && state.mode !== 'work') {
        this.setState('idle', { speak: false, force: true, intent: 'pomodoro-break' });
        if (state.reason === 'start' || state.reason === 'switch-mode') {
          this.sayRandom('pomodoro-break');
        }
        return;
      }

      if (!this.isNightTime() && this.state === 'focus') {
        this.setState('idle', { speak: false, force: true, intent: 'resume-idle', clearSpeech: true });
      }
    }

    getAssetBucket(label) {
      const bucket = this.assetsByLabel[label];
      if (bucket && bucket.length) return bucket;

      return (FALLBACK_ASSETS[label] || []).map((relativePath) => ({
        name: relativePath.split('/').pop(),
        label,
        relativePath,
        searchText: relativePath.toLowerCase(),
        fineCategory: null,
        tags: [],
        motionScore: 0,
        durationMs: 0,
        suggestion: label,
        confidence: 0
      }));
    }

    selectEntryForState(state, intent) {
      const options = this.buildSelectionOptions(state, intent);
      return this.pickAsset(options);
    }

    buildSelectionOptions(state, intent) {
      const options = {
        labels: ['normal'],
        preferredFine: [],
        keywords: [],
        avoidFine: [],
        avoidKeywords: [],
        motionMax: null,
        durationMin: null,
        preferredSuggestions: [],
        scoreWindow: 1.75,
        poolSize: 12,
        recentLimit: 8,
        fineWeight: 2.4,
        keywordWeight: 0.9,
        suggestionWeight: 1.6,
        avoidFineWeight: 1.8,
        avoidKeywordWeight: 1.6,
        diversifyByLabel: false
      };

      if (state === 'sleep') {
        options.labels = ['sleep', 'normal'];
        options.preferredFine = ['rest_relax'];
        options.keywords = [...KEYWORDS.sleep];
        options.motionMax = 0.03;
        options.durationMin = 900;
        options.preferredSuggestions = ['sleep'];
        options.poolSize = 14;
        options.scoreWindow = 2.4;
        options.recentLimit = 10;
        return options;
      }

      if (state === 'walk') {
        options.labels = ['walk', 'normal', 'special'];
        options.preferredFine = ['movement_travel'];
        options.keywords = [...KEYWORDS.walk];
        options.preferredSuggestions = ['normal', 'special'];
        options.poolSize = 22;
        options.scoreWindow = 3.1;
        options.recentLimit = 12;
        options.diversifyByLabel = true;
        if (this.weatherMood === 'rainy') options.keywords.push(...KEYWORDS.rainy);
        if (this.weatherMood === 'sunny') options.keywords.push(...KEYWORDS.sunny);
        if (intent === 'page-change') options.keywords.push(...KEYWORDS.page);
        return options;
      }

      if (state === 'interact') {
        options.labels = ['click', 'special', 'normal'];
        options.preferredFine = ['cute_reaction', 'social_affection'];
        options.keywords = [...KEYWORDS.click];
        options.preferredSuggestions = ['click'];
        options.poolSize = 16;
        options.scoreWindow = 2.5;
        return options;
      }

      if (state === 'focus') {
        options.labels = ['normal'];
        options.preferredFine = ['daily_life', 'play_activity'];
        options.avoidFine = ['food_drink', 'social_affection', 'rest_relax'];
        options.keywords = ['computer', 'laptop', 'typing', 'writing', 'working', '打字', '工作', '电脑', '笔记本'];
        options.avoidKeywords = [...KEYWORDS.avoidFocus];
        options.motionMax = 0.04;
        options.durationMin = 700;
        options.preferredSuggestions = ['normal'];
        options.poolSize = 18;
        options.scoreWindow = 2.6;
        options.recentLimit = 10;
        return options;
      }

      if (state === 'celebrate') {
        options.labels = ['special', 'click', 'normal'];
        options.preferredFine = ['social_affection', 'play_activity', 'costume_roleplay'];
        options.keywords = [...KEYWORDS.celebrate];
        options.preferredSuggestions = ['special', 'click'];
        options.poolSize = 20;
        options.scoreWindow = 3.0;
        options.recentLimit = 12;
        options.diversifyByLabel = true;
        if (intent === 'pomodoro-complete') options.keywords.push('party', 'clapping', 'cheers');
        return options;
      }

      options.labels = this.weatherMood === 'rainy' ? ['normal', 'sleep', 'special'] : ['normal', 'special', 'walk'];
      options.preferredFine = this.weatherMood === 'rainy'
        ? ['rest_relax', 'daily_life']
        : ['cute_reaction', 'social_affection', 'movement_travel'];
      options.keywords = this.weatherMood === 'rainy' ? [...KEYWORDS.rainy] : [...KEYWORDS.sunny];
      options.preferredSuggestions = ['normal', 'special'];
      options.poolSize = this.weatherMood === 'rainy' ? 24 : 30;
      options.scoreWindow = this.weatherMood === 'rainy' ? 3.2 : 3.8;
      options.recentLimit = this.weatherMood === 'rainy' ? 14 : 18;
      options.fineWeight = this.weatherMood === 'rainy' ? 1.8 : 1.4;
      options.keywordWeight = this.weatherMood === 'rainy' ? 0.65 : 0.45;
      options.diversifyByLabel = true;
      if (intent === 'weather-snowy') options.keywords.push('snow', 'winter');
      return options;
    }

    pickAsset(options) {
      const labels = Array.isArray(options.labels) ? options.labels : ['normal'];
      const candidates = labels.flatMap((label) => this.getAssetBucket(label));
      if (!candidates.length) return null;

      const scored = candidates.map((entry) => ({ entry, score: this.scoreEntry(entry, options) }));
      scored.sort((left, right) => right.score - left.score);
      const bestScore = scored[0].score;
      const rawPool = scored
        .filter((item) => item.score >= bestScore - options.scoreWindow)
        .filter((item) => !this.isRecentlyUsed(item.entry, options.recentLimit));

      const pool = this.buildDiversePool(rawPool, options);
      const fallbackPool = this.buildDiversePool(scored, options);
      const finalPool = pool.length ? pool : fallbackPool;
      const picked = sample(finalPool);
      return picked ? picked.entry : candidates[0];
    }

    buildDiversePool(items, options) {
      const limited = items.slice(0, Math.max(options.poolSize * 3, options.poolSize));
      if (!options.diversifyByLabel) return limited.slice(0, options.poolSize);

      const buckets = new Map();
      limited.forEach((item) => {
        const key = `${item.entry.label}:${item.entry.fineCategory || 'misc'}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item);
      });

      const bucketList = Array.from(buckets.values());
      const diversified = [];
      let cursor = 0;
      while (diversified.length < options.poolSize && bucketList.some((bucket) => bucket.length > 0)) {
        const bucket = bucketList[cursor % bucketList.length];
        if (bucket.length > 0) diversified.push(bucket.shift());
        cursor++;
      }

      return diversified;
    }

    scoreEntry(entry, options) {
      let score = 1;

      if (options.labels.includes(entry.label)) score += 3.5;
      if (options.preferredSuggestions.includes(entry.suggestion)) score += options.suggestionWeight;
      if (options.preferredFine.includes(entry.fineCategory)) score += options.fineWeight;
      if (options.avoidFine.includes(entry.fineCategory)) score -= options.avoidFineWeight;

      options.keywords.forEach((keyword) => {
        if (entry.searchText.includes(keyword.toLowerCase())) score += options.keywordWeight;
      });

      options.avoidKeywords.forEach((keyword) => {
        if (entry.searchText.includes(keyword.toLowerCase())) score -= options.avoidKeywordWeight;
      });

      if (options.motionMax !== null && entry.motionScore <= options.motionMax) score += 1.1;
      if (options.durationMin !== null && entry.durationMs >= options.durationMin) score += 0.8;
      if (entry.confidence >= 0.9) score += 0.4;
      if (entry.name === (this.currentAsset && this.currentAsset.name)) score -= 2.8;
      if (this.recentAssets.includes(entry.name)) score -= 1.2;

      return score + Math.random() * 0.25;
    }

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    getPatrolLaneY() {
      return this.pageIndex === 1 ? 278 : 270;
    }

    rememberAsset(name) {
      if (!name) return;
      this.recentAssets = [name, ...this.recentAssets.filter((item) => item !== name)].slice(0, 48);
      if (this.currentAsset && this.currentAsset.label && this.recentAssetsByLabel[this.currentAsset.label]) {
        const bucket = this.recentAssetsByLabel[this.currentAsset.label];
        this.recentAssetsByLabel[this.currentAsset.label] = [
          name,
          ...bucket.filter((item) => item !== name)
        ].slice(0, 12);
      }
    }

    isRecentlyUsed(entry, recentLimit) {
      const globalRecent = this.recentAssets.slice(0, recentLimit);
      const labelRecent = (this.recentAssetsByLabel[entry.label] || []).slice(0, Math.max(4, Math.floor(recentLimit / 2)));
      return globalRecent.includes(entry.name) || labelRecent.includes(entry.name);
    }

    mapStateToSpeech(state) {
      if (state === 'sleep') return 'sleep';
      if (state === 'interact') return 'click';
      return 'normal';
    }

    isNightTime() {
      const hour = new Date().getHours();
      return hour >= 23 || hour < 6;
    }

    render() {
      if (!this.shell) return;
      this.shell.style.transform = `translate3d(${this.position.x}px, ${this.position.y}px, 0)`;
    }
  }

  window.DashboardPet = DashboardPet;
})();