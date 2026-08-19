# 顏色四肢反應遊戲

離線可用的顏色與四肢認知訓練遊戲（基本配對 / 順序記憶 / 斯特魯普），
視覺與格式與 `cognitive-training-pwa` 統一，可在 iPhone / iPad 安裝為 PWA。

## 在 iPhone / iPad 使用

1. 在 Safari 開啟已發布的連結。
2. 等待首次完整載入完成。
3. 點「分享」→「加入主畫面」。
4. 從主畫面開啟。

首次載入後可離線使用。

## 本地開發

```
npm run serve                # http://localhost:3000
npm run build:sw             # 更新 sw.js（勿手動編輯）
node tools/verify-offline.js # 離線快取驗證
node tools/generate-icons.js # 由 icon.svg 重新產生圖示 PNG
```
