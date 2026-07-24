class EnhancedPomodoroTimer {
  constructor() {
    this.modes = {
      work: { duration: 25, label: '专注待开始' },
      short: { duration: 5, label: '短休息' },
      long: { duration: 15, label: '长休息' }
    };

    this.currentMode = 'work';
    this.timeLeft = this.modes.work.duration * 60;
    this.totalTime = this.modes.work.duration * 60;
    this.isRunning = false;
    this.isPaused = false;
    this.sessionCount = 0;
    this.completedPomodoros = this.getTodayPomodoros();
    this.totalFocusTime = parseInt(localStorage.getItem('totalFocusTime') || '0');
    this.interruptionCount = parseInt(localStorage.getItem('todayInterruptions') || '0');
    this.tasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');

    this.initializeElements();
    this.bindEvents();
    this.updateDisplay();
    this.updateStats();
    this.renderTasks();
    this.emitStateChange('init');

    // Tauri SMTC media key bridge
    if (window.tauriBridge && window.tauriBridge.available) {
      window.tauriBridge.onSmtcCommand((cmd) => {
        if (cmd === 'play')  this.start();
        if (cmd === 'pause') this.pause();
        if (cmd === 'stop')  this.reset();
      });
    }
  }

  emitStateChange(reason) {
    document.dispatchEvent(new CustomEvent('pomodoro:statechange', {
      detail: {
        reason,
        mode: this.currentMode,
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        sessionCount: this.sessionCount,
        completedPomodoros: this.completedPomodoros,
        interruptionCount: this.interruptionCount,
        timeLeft: this.timeLeft,
        totalTime: this.totalTime
      }
    }));

    // Push state to Tauri SMTC
    if (window.tauriBridge && window.tauriBridge.available) {
      window.tauriBridge.updateSmtc({
        mode: this.currentMode,
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        timeLeft: this.timeLeft,
        totalTime: this.totalTime,
        sessionCount: this.sessionCount,
        completedPomodoros: this.completedPomodoros
      });
    }
  }

  initializeElements() {
    this.timerTime = document.getElementById('timer-time');
    this.timerLabel = document.getElementById('timer-label');
    this.timerSession = document.getElementById('timer-session');
    this.startBtn = document.getElementById('start-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.skipBreakBtn = document.getElementById('skip-break-btn');
    this.progressRing = document.querySelector('.progress-ring-progress');

    console.log('Elements found:', {
      timerTime: !!this.timerTime,
      startBtn: !!this.startBtn,
      pauseBtn: !!this.pauseBtn,
      resetBtn: !!this.resetBtn,
      progressRing: !!this.progressRing
    });

    // Force ensure elements are interactive
    if (this.startBtn) {
      this.startBtn.style.pointerEvents = 'auto';
      this.startBtn.style.zIndex = '100';
      this.startBtn.style.position = 'relative';
    }
    if (this.resetBtn) {
      this.resetBtn.style.pointerEvents = 'auto';
      this.resetBtn.style.zIndex = '100';
      this.resetBtn.style.position = 'relative';
    }

    if (this.progressRing) {
      this.circumference = 2 * Math.PI * 160;
      this.progressRing.style.strokeDasharray = this.circumference + ' ' + this.circumference;
      this.progressRing.style.strokeDashoffset = this.circumference;
    }
  }

  bindEvents() {
    // Mode buttons
    document.querySelectorAll('.mode-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.mode && btn.dataset.mode !== 'custom' && btn.dataset.mode !== 'custom2') {
          this.switchMode(btn.dataset.mode);
        }
        document.querySelectorAll('.mode-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Control buttons
    if (this.startBtn) {
      console.log('Binding start button...');
      this.startBtn.addEventListener('click', (e) => {
        console.log('Start button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        this.start();
      });

      // Add test click handler
      this.startBtn.addEventListener('mousedown', () => {
        console.log('Start button mousedown detected!');
      });
    } else {
      console.error('Start button not found!');
    }

    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => {
        console.log('Pause button clicked!');
        this.pause();
      });
    }
    if (this.resetBtn) {
      console.log('Binding reset button...');
      this.resetBtn.addEventListener('click', (e) => {
        console.log('Reset button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        this.reset();
      });

      // Add test click handler
      this.resetBtn.addEventListener('mousedown', () => {
        console.log('Reset button mousedown detected!');
      });
    } else {
      console.error('Reset button not found!');
    }
    if (this.skipBreakBtn) {
      this.skipBreakBtn.addEventListener('click', () => this.recordInterruption());
    }

    // Add task button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => this.addTask());
    }
  }

  switchMode(mode) {
    this.stop();
    this.currentMode = mode;
    this.timeLeft = this.modes[mode].duration * 60;
    this.totalTime = this.modes[mode].duration * 60;
    this.updateDisplay();
    this.emitStateChange('switch-mode');
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.startBtn.style.display = 'none';
    this.pauseBtn.style.display = 'block';

    if (this.currentMode !== 'work') {
      this.skipBreakBtn.style.display = 'block';
    }

    this.emitStateChange('start');

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      this.emitStateChange('tick');

      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    this.isPaused = true;
    this.startBtn.style.display = 'block';
    this.pauseBtn.style.display = 'none';
    this.skipBreakBtn.style.display = 'none';
    clearInterval(this.timer);
    this.emitStateChange('pause');
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.startBtn.style.display = 'block';
    this.pauseBtn.style.display = 'none';
    this.skipBreakBtn.style.display = 'none';
    clearInterval(this.timer);
    this.emitStateChange('stop');
    // Clear SMTC on stop
    if (window.tauriBridge && window.tauriBridge.available) {
      window.tauriBridge.clearSmtc();
    }
  }

  reset() {
    this.stop();
    this.timeLeft = this.modes[this.currentMode].duration * 60;
    this.totalTime = this.modes[this.currentMode].duration * 60;
    this.updateDisplay();
    this.emitStateChange('reset');
    // Clear SMTC on reset
    if (window.tauriBridge && window.tauriBridge.available) {
      window.tauriBridge.clearSmtc();
    }
  }

  complete() {
    this.stop();

    if (this.currentMode === 'work') {
      this.completedPomodoros++;
      this.sessionCount++;
      this.totalFocusTime += this.modes.work.duration;
      this.saveTodayPomodoros();
      localStorage.setItem('totalFocusTime', this.totalFocusTime.toString());
      this.updateStats();

      this.playSound();
      // Native notification on work completion
      if (window.tauriBridge && window.tauriBridge.available) {
        window.tauriBridge.notify('番茄钟完成', '工作完成，休息一下吧！');
      }
      this.emitStateChange('complete-work');

      // Auto switch to break
      const nextMode = (this.sessionCount % 4 === 0) ? 'long' : 'short';
      setTimeout(() => this.switchMode(nextMode), 1000);
    } else {
      this.emitStateChange('complete-break');
      // Break completed, switch back to work
      setTimeout(() => this.switchMode('work'), 1000);
    }
  }

  recordInterruption() {
    this.interruptionCount++;
    localStorage.setItem('todayInterruptions', this.interruptionCount.toString());
    this.updateStats();
    this.emitStateChange('interruption');
    this.switchMode('work');
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    this.timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.timerLabel.textContent = this.modes[this.currentMode].label;
    this.timerSession.textContent = `已完成 ${this.sessionCount}/4 番茄`;

    // Update progress ring
    const progress = (this.totalTime - this.timeLeft) / this.totalTime;
    const offset = this.circumference - (progress * this.circumference);
    this.progressRing.style.strokeDashoffset = offset;
  }

  updateStats() {
    document.getElementById('completed-pomodoros').textContent = this.completedPomodoros;
    document.getElementById('focus-time').textContent = this.totalFocusTime + '分钟';
    document.getElementById('average-focus').textContent = this.completedPomodoros > 0 ?
      Math.round(this.totalFocusTime / this.completedPomodoros) + '分钟' : '0分钟';
    document.getElementById('interruption-count').textContent = this.interruptionCount;
  }

  getTodayPomodoros() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('pomodoroDate');
    if (savedDate !== today) {
      localStorage.setItem('pomodoroDate', today);
      localStorage.setItem('todayPomodoros', '0');
      localStorage.setItem('todayInterruptions', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('todayPomodoros') || '0');
  }

  saveTodayPomodoros() {
    localStorage.setItem('todayPomodoros', this.completedPomodoros.toString());
  }

  addTask() {
    const taskText = prompt('请输入任务名称：');
    if (taskText && taskText.trim()) {
      const task = {
        id: Date.now(),
        text: taskText.trim(),
        completed: false,
        pomodoros: 0
      };
      this.tasks.push(task);
      this.saveTasks();
      this.renderTasks();
    }
  }

  saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
  }

  renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    this.tasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = 'task-item';
      taskEl.innerHTML = `
        <div class="task-content">
          <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
          <span class="task-pomodoros">${task.pomodoros}🍅</span>
        </div>
        <div class="task-actions">
          <button onclick="pomodoroTimer.toggleTask(${task.id})" class="task-btn">
            ${task.completed ? '✓' : '○'}
          </button>
          <button onclick="pomodoroTimer.deleteTask(${task.id})" class="task-btn">×</button>
        </div>
      `;
      taskList.appendChild(taskEl);
    });
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasks();
    this.renderTasks();
  }

  playSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (e) {
      console.log('Audio not supported');
    }
  }
}