> truth source: `apps/web/src/game/replay/storage.ts`

ローカル(IndexedDB via idb-keyval):
- `settings`: 音量、キーバインド
- `recentReplays`: 直近20件
- `playerProfile`: 匿名UUID, 表示名

サーバ(Phase4以降):
- D1(SQLite): ランキング, レーティング履歴
- R2: リプレイファイル(gzip JSON)
- KV: マッチング用一時データ
