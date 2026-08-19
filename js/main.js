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

        function goToMainMenu() {
            stopAllModes();
            hideAllScreens();
            mainMenu.classList.remove('hidden');
            slideMenu.classList.remove('open');
            syncTopBarCentering();
        }

        function showSettings(settingsId) {
            stopAllModes();
            hideAllScreens();
            document.getElementById(settingsId).classList.remove('hidden');
            syncTopBarCentering();
        }

        function showGame(gameId, initFn) {
            stopAllModes();
            hideAllScreens();
            document.getElementById(gameId).style.display = 'flex';
            initFn();
            syncTopBarCentering();
        }

        document.getElementById('gameBasicBtn').addEventListener('click', () => showSettings('basicSettings'));
        document.getElementById('gameSeqBtn').addEventListener('click', () => showSettings('seqSettings'));
        document.getElementById('gameStroopBtn').addEventListener('click', () => showSettings('stroopSettings'));

        document.getElementById('basicSettingsBackBtn').addEventListener('click', goToMainMenu);
        document.getElementById('seqSettingsBackBtn').addEventListener('click', goToMainMenu);
        document.getElementById('stroopSettingsBackBtn').addEventListener('click', goToMainMenu);

        document.getElementById('basicBackBtn').addEventListener('click', () => showSettings('basicSettings'));
        document.getElementById('seqBackBtn').addEventListener('click', () => showSettings('seqSettings'));
        document.getElementById('stroopBackBtn').addEventListener('click', () => showSettings('stroopSettings'));

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
        bgMusicBadge.textContent = '●';
        bgMusicBadge.style.color = '#42a5f5';
        sfxBadge.textContent = '●';
        sfxBadge.style.color = '#42a5f5';

        document.addEventListener('click', function initAudioOnClick() {
            if (bgMusicEnabled) {
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                bgAudio.play().catch(() => {});
            }
            document.removeEventListener('click', initAudioOnClick);
        }, { once: true });
        setTimeout(() => { if (bgMusicEnabled) bgAudio.play().catch(() => {}); }, 500);

        console.log('✅ 顏色四肢反應遊戲已載入，使用 ☰ 選單控制設定！');
