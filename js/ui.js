        // ---- 主題切換（使用 CognitiveSettingsStore 持久化）----
        function currentTheme() {
            try {
                const store = window.CognitiveSettingsStore;
                return store ? store.load(store.keys.theme).theme : 'light';
            } catch (e) {
                return 'light';
            }
        }

        function renderThemeBadge(dark) {
            const btn = document.getElementById('slideThemeBtn');
            if (!btn) return;
            btn.innerHTML = (dark ? '☀️ 淺色模式' : '🌑 深色模式') +
                ' <span class="state-badge' + (dark ? ' on' : '') + '" id="themeBadge"></span>';
        }

        function toggleTheme() {
            const next = currentTheme() === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            const store = window.CognitiveSettingsStore;
            if (store) store.save(store.keys.theme, { theme: next });
            renderThemeBadge(next === 'dark');
        }

        function syncTopBarCentering() {
            document.querySelectorAll('.top-bar').forEach(bar => {
                const left = bar.querySelector('.left-group');
                const right = bar.querySelector('.right-group');
                const text = bar.querySelector('.question-text, .gng-rules-text');
                if (!left || !right || !text) return;
                if (bar.clientWidth <= 0) return;
                const leftRect = left.getBoundingClientRect();
                const rightRect = right.getBoundingClientRect();
                const textRect = text.getBoundingClientRect();
                const barRect = bar.getBoundingClientRect();
                const textW = text.offsetWidth;
                const sameRow = Math.abs(textRect.top - leftRect.top) < 2 &&
                                Math.abs(textRect.top - rightRect.top) < 2;
                const gap = 4;
                const available = rightRect.left - leftRect.right - gap * 2;
                const singleLine = sameRow && available >= textW;
                let extra = 0;
                if (singleLine) {
                    const currentCenter = (leftRect.right + rightRect.left) / 2;
                    const targetCenter = barRect.left + bar.clientWidth / 2;
                    const textLeft = currentCenter - textW / 2;
                    const textRight = currentCenter + textW / 2;
                    const minExtra = leftRect.right + gap - textLeft;
                    const maxExtra = rightRect.left - gap - textRight;
                    extra = Math.max(minExtra, Math.min(targetCenter - currentCenter, maxExtra));
                }
                bar.style.setProperty('--top-extra', extra + 'px');
                bar.classList.toggle('wrapped', !singleLine);
            });
        }

        // ---- 側滑選單 ----
        const slideMenu = document.getElementById('slideMenu');

        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.hamburger-btn');
            if (btn) {
                e.stopPropagation();
                slideMenu.classList.toggle('open');
            }
        });

        document.addEventListener('click', function(e) {
            if (slideMenu.classList.contains('open') &&
                !slideMenu.contains(e.target) &&
                !e.target.closest('.hamburger-btn')) {
                slideMenu.classList.remove('open');
            }
        });

        document.getElementById('slideThemeBtn').addEventListener('click', toggleTheme);
        document.getElementById('slideBgMusicBtn').addEventListener('click', toggleBgMusic);
        document.getElementById('slideSfxBtn').addEventListener('click', toggleSfx);
        document.getElementById('slideHomeBtn').addEventListener('click', function() {
            slideMenu.classList.remove('open');
            goToMainMenu();
        });

        // ---- 直向鎖定（橫向使用）----
        function updatePortraitLock() {
            const overlay = document.getElementById('portraitLock');
            if (!overlay) return;
            const portrait = window.matchMedia && window.matchMedia('(orientation: portrait)');
            const active = portrait ? portrait.matches : window.innerHeight > window.innerWidth;
            overlay.classList.toggle('active', active);
        }

        // ---- 通用按壓動畫（與 cognitive-training-pwa 相同：按住期間保持按壓）----
        const pressSelectors = 'button, [role="button"], .category-btn, .menu-item';
        const pressedByPointer = new Map();

        function isPressDisabled(target) {
            return target.disabled || target.classList.contains('disabled');
        }

        function releasePressed(e) {
            const target = pressedByPointer.get(e.pointerId);
            if (!target) return;
            pressedByPointer.delete(e.pointerId);
            target.classList.remove('pressed');
        }

        document.addEventListener('pointerdown', function(e) {
            const target = e.target.closest(pressSelectors);
            if (!target || isPressDisabled(target)) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            pressedByPointer.set(e.pointerId, target);
            target.classList.add('pressed');
        });

        document.addEventListener('pointerout', function(e) {
            const target = pressedByPointer.get(e.pointerId);
            if (!target) return;
            const related = e.relatedTarget;
            if (!related || !target.contains(related)) target.classList.remove('pressed');
        });

        document.addEventListener('pointerover', function(e) {
            const target = pressedByPointer.get(e.pointerId);
            if (target && target.contains(e.target)) target.classList.add('pressed');
        });

        document.addEventListener('pointerup', releasePressed);
        document.addEventListener('pointercancel', releasePressed);
        document.addEventListener('lostpointercapture', releasePressed);

        window.addEventListener('resize', function () {
            syncTopBarCentering();
            updatePortraitLock();
        });
        if (window.ResizeObserver) {
            const topBarObserver = new ResizeObserver(syncTopBarCentering);
            document.querySelectorAll('.top-bar').forEach(bar => {
                topBarObserver.observe(bar);
                bar.querySelectorAll('.left-group, .right-group, .question-text, .gng-rules-text')
                    .forEach(el => topBarObserver.observe(el));
            });
        } else {
            syncTopBarCentering();
        }
        updatePortraitLock();
