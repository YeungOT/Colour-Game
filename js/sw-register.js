        // ================================================================
        // 服務工作者註冊（離線快取由 sw.js + js/worker-runtime.js 提供）
        // ================================================================
        (function () {
            'use strict';
            if (!('serviceWorker' in navigator)) return;

            const hadController = !!navigator.serviceWorker.controller;

            window.addEventListener('load', function () {
                navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
                    .catch(function () { /* 註冊失敗不阻礙遊戲使用 */ });

                // 新版服務工作者接管時重新載入，讓使用者取得最新內容。
                // 首次安裝沒有舊版 controller，不觸發重載。
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function () {
                    if (!hadController || refreshing) return;
                    refreshing = true;
                    window.location.reload();
                });
            });
        })();
