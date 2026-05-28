> truth source: 計測で検証

| 指標 | 目標 | 計測方法 |
|---|---|---|
| 初回ロード(cold) | <3秒(4G) | Lighthouse |
| ゲーム中FPS | 60安定 | stats.js / devtools |
| 同時ユニット | 200まで60FPS, 500まで30FPS | profiler |
| Tick処理時間 | <5ms/tick(200unit) | performance.now() |
| メモリ | <200MB | devtools |
| バンドル(gz) | <500KB | vite build --report |
