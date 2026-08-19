        // ================================================================
        // 顏色四肢反應遊戲 - 三種模式邏輯
        // ================================================================

        const COLOR_DEFS = [
            { key: 'red', name: '紅色', hex: '#d32f2f', shape: '●', darkText: false },
            { key: 'yellow', name: '黃色', hex: '#f9a825', shape: '■', darkText: true },
            { key: 'blue', name: '藍色', hex: '#1565c0', shape: '▲', darkText: false },
            { key: 'green', name: '綠色', hex: '#2e7d32', shape: '★', darkText: false }
        ];

        const COLOR_STORAGE = {
            basic: 'colorBasicSettings',
            seq: 'colorSeqSettings',
            stroop: 'colorStroopSettings'
        };

        const DEFAULT_BASIC = { mode: 'standard', count: 2, shapes: false, speed: 5 };
        const DEFAULT_SEQ = { length: 3, direction: 'forward', display: 'one', shapes: false, speed: 5 };
        const DEFAULT_STROOP = { rule: 'color', shapes: false, speed: 5 };

        function loadColorSettings(key, defaults) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return { ...defaults };
                return { ...defaults, ...JSON.parse(raw) };
            } catch (e) {
                return { ...defaults };
            }
        }

        function saveColorSettings(key, settings) {
            try {
                localStorage.setItem(key, JSON.stringify(settings));
            } catch (e) {}
        }

        function getColorInterval(speed) {
            const maxDelay = 6000;
            const minDelay = 1000;
            const factor = (speed - 1) / 9;
            return Math.round(maxDelay - factor * (maxDelay - minDelay));
        }

        function clampSpeed(value) {
            return Math.max(1, Math.min(10, value));
        }

        // DOM
        const basicModeSelect = document.getElementById('basicModeSelect');
        const basicCountSelect = document.getElementById('basicCountSelect');
        const basicCountLabel = document.getElementById('basicCountLabel');
        const basicShapesToggle = document.getElementById('basicShapesToggle');
        const basicSpeedDown = document.getElementById('basicSpeedDown');
        const basicSpeedUp = document.getElementById('basicSpeedUp');
        const basicSpeedDisplay = document.getElementById('basicSpeedDisplay');
        const basicPlayBtn = document.getElementById('basicPlayBtn');
        const basicGrid = document.getElementById('basicGrid');
        const basicPhaseLabel = document.getElementById('basicPhaseLabel');
        const basicQuestionText = document.getElementById('basicQuestionText');

        const seqLengthSelect = document.getElementById('seqLengthSelect');
        const seqDirectionSelect = document.getElementById('seqDirectionSelect');
        const seqDisplaySelect = document.getElementById('seqDisplaySelect');
        const seqShapesToggle = document.getElementById('seqShapesToggle');
        const seqSpeedDown = document.getElementById('seqSpeedDown');
        const seqSpeedUp = document.getElementById('seqSpeedUp');
        const seqSpeedDisplay = document.getElementById('seqSpeedDisplay');
        const seqPlayBtn = document.getElementById('seqPlayBtn');
        const seqReplayBtn = document.getElementById('seqReplayBtn');
        const seqStage = document.getElementById('seqStage');
        const seqGrid = document.getElementById('seqGrid');
        const seqAnswerScreen = document.getElementById('seqAnswerScreen');
        const seqQuestionText = document.getElementById('seqQuestionText');

        const stroopRuleSelect = document.getElementById('stroopRuleSelect');
        const stroopShapesToggle = document.getElementById('stroopShapesToggle');
        const stroopSpeedDown = document.getElementById('stroopSpeedDown');
        const stroopSpeedUp = document.getElementById('stroopSpeedUp');
        const stroopSpeedDisplay = document.getElementById('stroopSpeedDisplay');
        const stroopPlayBtn = document.getElementById('stroopPlayBtn');
        const stroopCard = document.getElementById('stroopCard');
        const stroopShape = document.getElementById('stroopShape');
        const stroopWord = document.getElementById('stroopWord');
        const stroopPhaseLabel = document.getElementById('stroopPhaseLabel');
        const stroopQuestionText = document.getElementById('stroopQuestionText');

        // ---- 共用卡面 ----
        function cardHtml(color, excluded, shapes, order) {
            const cls = 'color-card' +
                (excluded ? ' excluded' : '') +
                (color.darkText ? ' dark-text' : '');
            const shape = shapes ? `<span class="color-card-shape">${color.shape}</span>` : '';
            const number = order ? `<span class="color-card-number ${shapes ? 'corner' : 'center'}">${order}</span>` : '';
            const cross = excluded ? '<span class="color-card-x">❌</span>' : '';
            let meta = '';
            if (shapes && order) meta = `<span class="color-card-meta">${cross}${number}</span>`;
            else if (excluded) meta = `<span class="color-card-meta">${cross}</span>`;
            const centeredNumber = (!shapes && order) ? number : '';
            return `<div class="${cls}" style="background:${color.hex};">${shape}${centeredNumber}${meta}</div>`;
        }

        function syncShapesToggle(btn, on) {
            btn.classList.toggle('on', on);
            btn.textContent = on ? '開啟' : '關閉';
        }

        // ================================================================
        // 基本配對
        // ================================================================
        const basicState = {
            settings: loadColorSettings(COLOR_STORAGE.basic, DEFAULT_BASIC),
            sequence: [],
            currentIndex: -1,
            isPlaying: false,
            timer: null,
            token: 0
        };

        function sameColorKeys(a, b) {
            if (!a || !b || a.length !== b.length) return false;
            const keys = new Set(a.map(c => c.key));
            return b.every(c => keys.has(c.key));
        }

        function sameColorOrder(a, b) {
            if (!a || !b || a.length !== b.length) return false;
            return a.every((c, i) => c.key === b[i].key);
        }

        function createBasicTrial(previousColors) {
            const settings = basicState.settings;
            let colors = shuffle(COLOR_DEFS).slice(0, settings.count);
            if (previousColors) {
                let attempts = 0;
                while (attempts < 20) {
                    const repeatsSet = settings.count < COLOR_DEFS.length && sameColorKeys(colors, previousColors);
                    const repeatsOrder = settings.count === COLOR_DEFS.length && sameColorOrder(colors, previousColors);
                    if (!repeatsSet && !repeatsOrder) break;
                    colors = shuffle(COLOR_DEFS).slice(0, settings.count);
                    attempts++;
                }
            }
            return {
                mode: settings.mode,
                colors
            };
        }

        function appendBasicTrials(count) {
            for (let i = 0; i < count; i++) {
                const previous = basicState.sequence[basicState.sequence.length - 1];
                basicState.sequence.push(createBasicTrial(previous ? previous.colors : null));
            }
        }

        function renderBasicTrial() {
            const trial = basicState.sequence[basicState.currentIndex];
            if (!trial) return;
            basicGrid.className = 'color-grid count-' + trial.colors.length;
            basicGrid.innerHTML = trial.colors
                .map(c => cardHtml(c, trial.mode === 'exclusion', basicState.settings.shapes))
                .join('');
            basicPhaseLabel.classList.add('hidden');
            basicQuestionText.textContent = '基本配對';
            syncTopBarCentering();
        }

        function nextBasicTrial() {
            if (basicState.currentIndex + 1 >= basicState.sequence.length) appendBasicTrials(20);
            basicState.currentIndex++;
            renderBasicTrial();
        }

        function startBasicAutoPlay() {
            if (basicState.isPlaying) return;
            basicState.isPlaying = true;
            basicPlayBtn.classList.add('playing');
            basicState.token++;
            const token = basicState.token;
            basicState.timer = setInterval(() => {
                if (token !== basicState.token) return;
                nextBasicTrial();
            }, getColorInterval(basicState.settings.speed));
        }

        function stopBasicAutoPlay() {
            basicState.isPlaying = false;
            basicState.token++;
            if (basicState.timer) clearInterval(basicState.timer);
            basicState.timer = null;
            basicPlayBtn.classList.remove('playing');
        }

        function restartBasicAutoPlay() {
            if (!basicState.isPlaying) return;
            stopBasicAutoPlay();
            startBasicAutoPlay();
        }

        function toggleBasicAutoPlay() {
            if (basicState.isPlaying) stopBasicAutoPlay();
            else startBasicAutoPlay();
        }

        function buildBasicCountOptions() {
            const mode = basicState.settings.mode;
            const max = mode === 'exclusion' ? 2 : 4;
            basicCountSelect.innerHTML = '';
            for (let i = 1; i <= max; i++) {
                const opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = String(i);
                basicCountSelect.appendChild(opt);
            }
            basicCountSelect.value = String(Math.min(basicState.settings.count, max));
            basicCountLabel.textContent = mode === 'exclusion' ? '排除數目' : '顏色數目';
        }

        function readBasicSettings() {
            return {
                mode: basicModeSelect.value,
                count: parseInt(basicCountSelect.value, 10) || 2,
                shapes: basicShapesToggle.classList.contains('on'),
                speed: basicState.settings.speed
            };
        }

        function initBasicSettingsUI() {
            basicModeSelect.value = basicState.settings.mode;
            buildBasicCountOptions();
            syncShapesToggle(basicShapesToggle, basicState.settings.shapes);
            basicSpeedDisplay.textContent = basicState.settings.speed;
        }

        function initBasicGame() {
            stopBasicAutoPlay();
            basicState.settings = readBasicSettings();
            saveColorSettings(COLOR_STORAGE.basic, basicState.settings);
            basicState.sequence = [];
            basicState.currentIndex = -1;
            nextBasicTrial();
            basicSpeedDisplay.textContent = basicState.settings.speed;
            syncTopBarCentering();
        }

        basicModeSelect.addEventListener('change', function() {
            basicState.settings.mode = this.value;
            buildBasicCountOptions();
            saveColorSettings(COLOR_STORAGE.basic, basicState.settings);
        });
        basicCountSelect.addEventListener('change', function() {
            basicState.settings.count = parseInt(this.value, 10) || 2;
            saveColorSettings(COLOR_STORAGE.basic, basicState.settings);
        });
        basicShapesToggle.addEventListener('click', function() {
            basicState.settings.shapes = !basicState.settings.shapes;
            syncShapesToggle(this, basicState.settings.shapes);
            saveColorSettings(COLOR_STORAGE.basic, basicState.settings);
        });
        basicSpeedDown.addEventListener('click', function() {
            basicState.settings.speed = clampSpeed(basicState.settings.speed - 1);
            basicSpeedDisplay.textContent = basicState.settings.speed;
            saveColorSettings(COLOR_STORAGE.basic, basicState.settings);
            restartBasicAutoPlay();
        });
        basicSpeedUp.addEventListener('click', function() {
            basicState.settings.speed = clampSpeed(basicState.settings.speed + 1);
            basicSpeedDisplay.textContent = basicState.settings.speed;
            saveColorSettings(COLOR_STORAGE.basic, basicState.settings);
            restartBasicAutoPlay();
        });
        basicPlayBtn.addEventListener('click', toggleBasicAutoPlay);
        basicGrid.addEventListener('click', function() {
            if (!basicState.isPlaying) nextBasicTrial();
        });

        // ================================================================
        // 順序記憶
        // ================================================================
        const seqState = {
            settings: loadColorSettings(COLOR_STORAGE.seq, DEFAULT_SEQ),
            trials: [],
            currentTrial: -1,
            currentIndex: 0,
            phase: 'memory',
            allElapsed: 0,
            isPlaying: false,
            timer: null,
            token: 0
        };

        function createSeqTrial() {
            return shuffle(COLOR_DEFS).slice(0, seqState.settings.length);
        }

        function appendSeqTrials(count) {
            for (let i = 0; i < count; i++) seqState.trials.push(createSeqTrial());
        }

        function renderSeqTrial() {
            const trial = seqState.trials[seqState.currentTrial];
            if (!trial) return;
            const isAnswer = seqState.phase === 'answer';
            const reverse = seqState.settings.direction === 'reverse';
            seqQuestionText.textContent = reverse ? '記憶倒序' : '記憶順序';

            seqGrid.classList.toggle('hidden', isAnswer);
            seqAnswerScreen.classList.toggle('hidden', !isAnswer);
            seqAnswerScreen.textContent = '開始作答';
            seqReplayBtn.classList.toggle('hidden', seqState.settings.display === 'all');

            if (isAnswer) {
                seqGrid.innerHTML = '';
                syncTopBarCentering();
                return;
            }

            const count = seqState.settings.display === 'all' ? trial.length : 1;
            const colors = seqState.settings.display === 'all' ? trial : [trial[seqState.currentIndex]];
            seqGrid.className = 'color-grid count-' + count;
            seqGrid.innerHTML = colors
                .map((c, i) => cardHtml(
                    c,
                    false,
                    seqState.settings.shapes,
                    seqState.settings.display === 'all' ? i + 1 : seqState.currentIndex + 1
                ))
                .join('');
            syncTopBarCentering();
        }

        function finishSeqMemory() {
            stopSeqAutoPlay();
            seqState.phase = 'answer';
            renderSeqTrial();
        }

        function goToSeqTrial(index) {
            if (index < 0) index = 0;
            if (index >= seqState.trials.length) appendSeqTrials(20);
            stopSeqAutoPlay();
            seqState.currentTrial = index;
            seqState.currentIndex = 0;
            seqState.allElapsed = 0;
            seqState.phase = 'memory';
            renderSeqTrial();
        }

        function replaySeq() {
            stopSeqAutoPlay();
            seqState.currentIndex = 0;
            seqState.allElapsed = 0;
            seqState.phase = 'memory';
            renderSeqTrial();
        }

        function nextSeqStep() {
            if (seqState.phase === 'answer') {
                goToSeqTrial(seqState.currentTrial + 1);
                return;
            }
            const trial = seqState.trials[seqState.currentTrial];
            if (seqState.settings.display === 'one' && seqState.currentIndex < trial.length - 1) {
                seqState.currentIndex++;
                renderSeqTrial();
            } else {
                finishSeqMemory();
            }
        }

        function seqTick() {
            if (seqState.phase !== 'memory') {
                stopSeqAutoPlay();
                return;
            }
            if (seqState.settings.display === 'one') {
                const trial = seqState.trials[seqState.currentTrial];
                if (seqState.currentIndex < trial.length - 1) {
                    seqState.currentIndex++;
                    renderSeqTrial();
                } else {
                    finishSeqMemory();
                }
            } else {
                seqState.allElapsed++;
                if (seqState.allElapsed >= seqState.settings.length) finishSeqMemory();
            }
        }

        function startSeqAutoPlay() {
            if (seqState.phase === 'answer' || seqState.isPlaying) return;
            seqState.isPlaying = true;
            seqPlayBtn.classList.add('playing');
            seqState.token++;
            const token = seqState.token;
            seqState.timer = setInterval(() => {
                if (token !== seqState.token) return;
                seqTick();
            }, getColorInterval(seqState.settings.speed));
        }

        function stopSeqAutoPlay() {
            seqState.isPlaying = false;
            seqState.token++;
            if (seqState.timer) clearInterval(seqState.timer);
            seqState.timer = null;
            seqPlayBtn.classList.remove('playing');
        }

        function restartSeqAutoPlay() {
            if (!seqState.isPlaying) return;
            stopSeqAutoPlay();
            startSeqAutoPlay();
        }

        function toggleSeqAutoPlay() {
            if (seqState.isPlaying) stopSeqAutoPlay();
            else startSeqAutoPlay();
        }

        function readSeqSettings() {
            return {
                length: parseInt(seqLengthSelect.value, 10) || 3,
                direction: seqDirectionSelect.value,
                display: seqDisplaySelect.value,
                shapes: seqShapesToggle.classList.contains('on'),
                speed: seqState.settings.speed
            };
        }

        function initSeqSettingsUI() {
            seqLengthSelect.value = String(seqState.settings.length);
            seqDirectionSelect.value = seqState.settings.direction;
            seqDisplaySelect.value = seqState.settings.display;
            syncShapesToggle(seqShapesToggle, seqState.settings.shapes);
            seqSpeedDisplay.textContent = seqState.settings.speed;
        }

        function initSeqGame() {
            stopSeqAutoPlay();
            seqState.settings = readSeqSettings();
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
            seqState.trials = [];
            seqState.currentTrial = -1;
            seqState.currentIndex = 0;
            seqState.allElapsed = 0;
            seqState.phase = 'memory';
            goToSeqTrial(0);
            seqSpeedDisplay.textContent = seqState.settings.speed;
            syncTopBarCentering();
        }

        seqLengthSelect.addEventListener('change', function() {
            seqState.settings.length = parseInt(this.value, 10) || 3;
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
        });
        seqDirectionSelect.addEventListener('change', function() {
            seqState.settings.direction = this.value;
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
        });
        seqDisplaySelect.addEventListener('change', function() {
            seqState.settings.display = this.value;
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
        });
        seqShapesToggle.addEventListener('click', function() {
            seqState.settings.shapes = !seqState.settings.shapes;
            syncShapesToggle(this, seqState.settings.shapes);
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
        });
        seqSpeedDown.addEventListener('click', function() {
            seqState.settings.speed = clampSpeed(seqState.settings.speed - 1);
            seqSpeedDisplay.textContent = seqState.settings.speed;
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
            restartSeqAutoPlay();
        });
        seqSpeedUp.addEventListener('click', function() {
            seqState.settings.speed = clampSpeed(seqState.settings.speed + 1);
            seqSpeedDisplay.textContent = seqState.settings.speed;
            saveColorSettings(COLOR_STORAGE.seq, seqState.settings);
            restartSeqAutoPlay();
        });
        seqPlayBtn.addEventListener('click', toggleSeqAutoPlay);
        seqReplayBtn.addEventListener('click', replaySeq);
        seqStage.addEventListener('click', function() {
            if (!seqState.isPlaying) nextSeqStep();
        });

        // ================================================================
        // 斯特魯普
        // ================================================================
        const stroopState = {
            settings: loadColorSettings(COLOR_STORAGE.stroop, DEFAULT_STROOP),
            sequence: [],
            currentIndex: -1,
            isPlaying: false,
            timer: null,
            token: 0
        };

        function createStroopTrial() {
            const meaning = pickRandom(COLOR_DEFS);
            let ink = pickRandom(COLOR_DEFS);
            while (ink.key === meaning.key) ink = pickRandom(COLOR_DEFS);
            return { meaning, ink };
        }

        function appendStroopTrials(count) {
            for (let i = 0; i < count; i++) stroopState.sequence.push(createStroopTrial());
        }

        function renderStroopTrial() {
            const trial = stroopState.sequence[stroopState.currentIndex];
            if (!trial) return;
            const target = stroopState.settings.rule === 'color' ? trial.ink : trial.meaning;
            stroopWord.textContent = trial.meaning.name;
            stroopWord.style.color = trial.ink.hex;
            stroopPhaseLabel.classList.add('hidden');
            if (stroopState.settings.shapes) {
                stroopShape.textContent = target.shape;
                stroopShape.style.color = target.hex;
                stroopShape.classList.remove('hidden');
            } else {
                stroopShape.classList.add('hidden');
            }
            const ruleLabel = stroopState.settings.rule === 'color' ? '跟顏色' : '跟字義';
            const titleParts = [ruleLabel];
            if (stroopState.settings.shapes) titleParts.push('圖形');
            stroopQuestionText.textContent = titleParts.join(' · ');
            syncTopBarCentering();
        }

        function nextStroopTrial() {
            if (stroopState.currentIndex + 1 >= stroopState.sequence.length) appendStroopTrials(20);
            stroopState.currentIndex++;
            renderStroopTrial();
        }

        function startStroopAutoPlay() {
            if (stroopState.isPlaying) return;
            stroopState.isPlaying = true;
            stroopPlayBtn.classList.add('playing');
            stroopState.token++;
            const token = stroopState.token;
            stroopState.timer = setInterval(() => {
                if (token !== stroopState.token) return;
                nextStroopTrial();
            }, getColorInterval(stroopState.settings.speed));
        }

        function stopStroopAutoPlay() {
            stroopState.isPlaying = false;
            stroopState.token++;
            if (stroopState.timer) clearInterval(stroopState.timer);
            stroopState.timer = null;
            stroopPlayBtn.classList.remove('playing');
        }

        function restartStroopAutoPlay() {
            if (!stroopState.isPlaying) return;
            stopStroopAutoPlay();
            startStroopAutoPlay();
        }

        function toggleStroopAutoPlay() {
            if (stroopState.isPlaying) stopStroopAutoPlay();
            else startStroopAutoPlay();
        }

        function readStroopSettings() {
            return {
                rule: stroopRuleSelect.value,
                shapes: stroopShapesToggle.classList.contains('on'),
                speed: stroopState.settings.speed
            };
        }

        function initStroopSettingsUI() {
            stroopRuleSelect.value = stroopState.settings.rule;
            syncShapesToggle(stroopShapesToggle, stroopState.settings.shapes);
            stroopSpeedDisplay.textContent = stroopState.settings.speed;
        }

        function initStroopGame() {
            stopStroopAutoPlay();
            stroopState.settings = readStroopSettings();
            saveColorSettings(COLOR_STORAGE.stroop, stroopState.settings);
            stroopState.sequence = [];
            stroopState.currentIndex = -1;
            nextStroopTrial();
            stroopSpeedDisplay.textContent = stroopState.settings.speed;
            syncTopBarCentering();
        }

        stroopRuleSelect.addEventListener('change', function() {
            stroopState.settings.rule = this.value;
            saveColorSettings(COLOR_STORAGE.stroop, stroopState.settings);
            if (stroopState.currentIndex >= 0) renderStroopTrial();
        });
        stroopShapesToggle.addEventListener('click', function() {
            stroopState.settings.shapes = !stroopState.settings.shapes;
            syncShapesToggle(this, stroopState.settings.shapes);
            saveColorSettings(COLOR_STORAGE.stroop, stroopState.settings);
            if (stroopState.currentIndex >= 0) renderStroopTrial();
        });
        stroopSpeedDown.addEventListener('click', function() {
            stroopState.settings.speed = clampSpeed(stroopState.settings.speed - 1);
            stroopSpeedDisplay.textContent = stroopState.settings.speed;
            saveColorSettings(COLOR_STORAGE.stroop, stroopState.settings);
            restartStroopAutoPlay();
        });
        stroopSpeedUp.addEventListener('click', function() {
            stroopState.settings.speed = clampSpeed(stroopState.settings.speed + 1);
            stroopSpeedDisplay.textContent = stroopState.settings.speed;
            saveColorSettings(COLOR_STORAGE.stroop, stroopState.settings);
            restartStroopAutoPlay();
        });
        stroopPlayBtn.addEventListener('click', toggleStroopAutoPlay);
        stroopCard.addEventListener('click', function() {
            if (!stroopState.isPlaying) nextStroopTrial();
        });

        // ---- 初始化設定 ----
        initBasicSettingsUI();
        initSeqSettingsUI();
        initStroopSettingsUI();
