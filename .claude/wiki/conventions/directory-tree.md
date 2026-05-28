```
dots-war-sim/
├── apps/
│   ├── web/                 # @dots-war-sim/web — Svelte 5 + Vite + PixiJS
│   │   ├── src/
│   │   │   ├── ui/          # Svelteコンポーネント
│   │   │   ├── game/
│   │   │   │   ├── render/  # PixiJS描画
│   │   │   │   ├── input/   # 入力→Command変換
│   │   │   │   ├── ai/      # AIプレイヤー
│   │   │   │   ├── net/     # ネットワーク(Phase3)
│   │   │   │   └── loop.ts  # ゲームループ
│   │   │   ├── stores/      # Zustand(UIのみ)
│   │   │   └── main.ts
│   │   └── public/assets/
│   └── server/              # @dots-war-sim/server — CF Workers(Phase3)
├── packages/
│   ├── core/                # @dots-war-sim/core — sim・型・共通
│   │   └── src/
│   │       ├── sim/         # 純関数シミュレーション
│   │       ├── pathfinding/
│   │       ├── rng.ts
│   │       ├── replay.ts
│   │       └── types.ts
│   ├── maps/                # @dots-war-sim/maps — マップJSON
│   └── assets/              # @dots-war-sim/assets
├── tests/e2e/               # Playwright
├── .claude/                 # 規約・設計・wiki
│   ├── CLAUDE.md, DESIGN.md, TASKS.md, SETUP.md
│   ├── wiki/                # オンデマンド参照
│   ├── skills/              # 実行スキル
│   └── archive/             # 完了タスク・履歴
└── pnpm-workspace.yaml
```

★MUST: 全パッケージは`@dots-war-sim/<name>`スコープ。
`pnpm --filter @dots-war-sim/web dev` のようにフルネーム指定。
