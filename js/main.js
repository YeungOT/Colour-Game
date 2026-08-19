        // ================================================================
        // 顏色四肢反應遊戲 - 主選單與畫面切換
        // ================================================================

        const mainMenu = document.getElementById('mainMenu');
        const basicSettings = document.getElementById('basicSettings');
        const seqSettings = document.getElementById('seqSettings');
        const stroopSettings = document.getElementById('stroopSettings');
        const basicGame = document.getElementById('basicGame');
        const seqGame = document.getElementById('seqGame');
        const stroopGame = document.getElementById('stroopGame');

        const gameContainers = [basicGame, seqGame, stroopGame];
        const settingsOverlays = [basicSettings, seqSettings, stroopSettings];

        function hideAllScreens() {
            settingsOverlays.forEach(el => el.classList.add('hidden'));
            gameContainers.forEach(el => { el.style.display = 'none'; });
            mainMenu.classList.add('hidden');
        }

        function stopAllModes() {
            stopBasicAutoPlay();
            stopSeqAutoPlay();
            stopStroopAutoPlay();
        }

        // ---- 畫面切換動畫（與 cognitive-training-pwa 相同：淡入淡出）----
        const TRANSITION_MS = 200;
        let transitionTimer = null;

        function findVisibleScreen() {
            const screens = document.querySelectorAll('.app-screen');
            for (let i = 0; i < screens.length; i++) {
                const el = screens[i];
                if (!el.classList.contains('hidden') && el.style.display !== 'none') return el;
            }
            return null;
        }

        function clearTransitionClasses() {
            document.body.classList.remove('cognitive-screen-transition', 'screen-forward', 'screen-back', 'screen-home');
            document.querySelectorAll('.app-screen.screen-from, .app-screen.screen-to')
                .forEach(el => el.classList.remove('screen-from', 'screen-to'));
        }

        function transitionTo(targetEl, direction) {
            clearTimeout(transitionTimer);
            const fromEl = findVisibleScreen();
            if (fromEl === targetEl) {
                clearTransitionClasses();
                return;
            }
            clearTransitionClasses();

            // 先切換底層可見性；動畫類別會以 !important 覆寫為兩者同時可見。
            if (fromEl) {
                fromEl.classList.add('hidden');
                fromEl.style.display = 'none';
            }
            targetEl.classList.remove('hidden');
            targetEl.style.display = 'flex';

            document.body.classList.add('cognitive-screen-transition', direction);
            if (fromEl) fromEl.classList.add('screen-from');
            targetEl.classList.add('screen-to');

            transitionTimer = setTimeout(function () {
                clearTransitionClasses();
                transitionTimer = null;
            }, TRANSITION_MS);
        }

        function goToMainMenu() {
            stopAllModes();
            slideMenu.classList.remove('open');
            transitionTo(mainMenu, 'screen-home');
            syncTopBarCentering();
        }

        function showSettings(settingsId, direction) {
            stopAllModes();
            transitionTo(document.getElementById(settingsId), direction || 'screen-forward');
            syncTopBarCentering();
        }

        function showGame(gameId, initFn, direction) {
            stopAllModes();
            transitionTo(document.getElementById(gameId), direction || 'screen-forward');
            initFn();
            syncTopBarCentering();
        }

        document.getElementById('gameBasicBtn').addEventListener('click', () => showSettings('basicSettings'));
        document.getElementById('gameSeqBtn').addEventListener('click', () => showSettings('seqSettings'));
        document.getElementById('gameStroopBtn').addEventListener('click', () => showSettings('stroopSettings'));

        document.getElementById('basicSettingsBackBtn').addEventListener('click', goToMainMenu);
        document.getElementById('seqSettingsBackBtn').addEventListener('click', goToMainMenu);
        document.getElementById('stroopSettingsBackBtn').addEventListener('click', goToMainMenu);

        document.getElementById('basicBackBtn').addEventListener('click', () => showSettings('basicSettings', 'screen-back'));
        document.getElementById('seqBackBtn').addEventListener('click', () => showSettings('seqSettings', 'screen-back'));
        document.getElementById('stroopBackBtn').addEventListener('click', () => showSettings('stroopSettings', 'screen-back'));

        document.getElementById('basicStartBtn').addEventListener('click', () => showGame('basicGame', initBasicGame));
        document.getElementById('seqStartBtn').addEventListener('click', () => showGame('seqGame', initSeqGame));
        document.getElementById('stroopStartBtn').addEventListener('click', () => showGame('stroopGame', initStroopGame));

        // ---- 初始化 ----
        hideAllScreens();
        mainMenu.classList.remove('hidden');

        const themeBadge = document.getElementById('themeBadge');
        const bgMusicBadge = document.getElementById('bgMusicBadge');
        const sfxBadge = document.getElementById('sfxBadge');
        renderThemeBadge(currentTheme() === 'dark');
        bgMusicBadge.classList.add('on');
        sfxBadge.classList.add('on');

        document.addEventListener('click', function initAudioOnClick() {
            if (bgMusicEnabled) {
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                bgAudio.play().catch(() => {});
            }
            document.removeEventListener('click', initAudioOnClick);
        }, { once: true });
        setTimeout(() => { if (bgMusicEnabled) bgAudio.play().catch(() => {}); }, 500);

        console.log('✅ 顏色四肢反應遊戲已載入，使用 ☰ 選單控制設定！');
