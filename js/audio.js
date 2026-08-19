        // ---- 音效 ----
        let audioCtx = null;
        const bgAudio = new Audio('background.mp3');
        bgAudio.loop = true;
        bgAudio.volume = 0.3;
        let bgMusicEnabled = true;
        let sfxEnabled = true;

        function initAudio() {
            if (!audioCtx) audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            return audioCtx;
        }

        function playTone(freq, duration, type = 'sine', volume = 0.25) {
            if (!sfxEnabled) return;
            try {
                const ctx = initAudio();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.value = volume;
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (e) {}
        }

        function playCorrectSound() { playTone(880, 0.12, 'sine', 0.2);
            setTimeout(() => playTone(1100, 0.12, 'sine', 0.2), 130); }

        function playWrongSound() { playTone(300, 0.3, 'sawtooth', 0.12); }

        // ---- 側滑選單音效控制 ----
        function toggleBgMusic() {
            bgMusicEnabled = !bgMusicEnabled;
            const btn = document.getElementById('slideBgMusicBtn');
            if (bgMusicEnabled) {
                btn.innerHTML = '🔊 背景音樂 <span class="state-badge on" id="bgMusicBadge"></span>';
                bgAudio.play().catch(() => {});
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            } else {
                btn.innerHTML = '🔇 背景音樂 <span class="state-badge" id="bgMusicBadge"></span>';
                bgAudio.pause();
            }
        }

        function toggleSfx() {
            sfxEnabled = !sfxEnabled;
            const btn = document.getElementById('slideSfxBtn');
            if (sfxEnabled) {
                btn.innerHTML = '🔊 音效 <span class="state-badge on" id="sfxBadge"></span>';
            } else {
                btn.innerHTML = '🔇 音效 <span class="state-badge" id="sfxBadge"></span>';
            }
        }
