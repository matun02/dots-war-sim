# DESIGN.md — War of Dots アーキテクチャ設計

> ゲームルール・数値仕様・アルゴリズム詳細は `wiki/` 参照。本書はアーキテクチャのみ。

---

## 1. アーキテクチャ概要

### 1.1 レイヤー図

```
┌────────────────────────────────────────────────────────┐
│                    UI (Svelte 5)                       │
│   メニュー / HUD / ポーズ / 結果画面 / 設定             │
└──────────────────────┬─────────────────────────────────┘
                       │ (props / store)
┌──────────────────────▼─────────────────────────────────┐
│                  Game Loop（loop.ts）                  │
│   30Hz tick + RAF render + 入力バッファ                 │
└─────┬──────────────┬───────────┬─────────────┬────────┘
      │              │           │             │
      ▼              ▼           ▼             ▼
┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│  Input   │  │  Render  │  │   AI    │  │   Net    │
│ (mouse,  │  │ (PixiJS) │  │(local)  │  │  (WS、    │
│  touch)  │  │          │  │         │  │  Phase3) │
└─────┬────┘  └────▲─────┘  └────┬────┘  └────┬─────┘
      │            │             │            │
      │ Commands   │ read state  │ Commands   │ Inputs
      ▼            │             ▼            ▼
┌────────────────────────────────────────────────────┐
│           packages/core/sim (純TS、決定論)         │
│  GameState | tick(state, inputs, rng) -> nextState │
└────────────────────────────────────────────────────┘
```

### 1.2 データフロー（一方向）

```
Input ──► Commands ──► InputFrame ──► tick() ──► GameState ──► Render(read-only)
```

★MUST: Render / Svelte UI / AI は GameState を **読み取り専用** で扱う。

### 1.3 モジュール依存表

| モジュール | 依存可能 | 依存禁止 |
|---|---|---|
| `core/sim` | なし | DOM, Pixi, Svelte, Node, fetch |
| `core/pathfinding` | `core/sim/types` | 同上 |
| `core/rng` | なし | 同上 |
| `core/replay` | `core/sim`, `core/rng` | 同上 |
| `apps/web/game/render` | `core/*`, `pixi.js` | Svelte 内部 API |
| `apps/web/game/input` | `core/sim/types` | Pixi 直接操作禁止 |
| `apps/web/game/ai` | `core/sim`, `core/pathfinding` | Pixi, DOM |
| `apps/web/game/net` | `core/sim` | DOM |
| `apps/web/src/ui` | Svelte, stores | Pixi 直接 import 禁止 |

---

## 2. 主要データ構造

実装: `packages/core/src/sim/types.ts`（truth source）。

主要型: `GameState`, `Unit`, `City`, `Player`, `MapDef`, `Command`, `InputFrame`, `GameResult`
Branded ID: `EntityId`, `CityId`, `PlayerId`（型レベルのみ、ランタイムコスト 0）

設計注意:
- GameState 全体は JSON シリアライズ可能（リプレイ・送信用）
- Unit / City は plain object（クラスではない）
- 大量データ対応時は SoA へのリファクタ余地を残す

---

## 3. ゲームループ詳細

実装: `apps/web/src/game/loop.ts`（truth source）。

- TICK_DT = 1000/30 ≈ 33.33ms（30Hz）
- accumulator パターン: MAX_FRAME_DT = 250ms
- tick ごとに `prev = cur; cur = tick(cur, inputs, rng)`
- render: prev/cur を `alpha = acc / TICK_DT_MS` で線形補間
- 戦闘エフェクト・占領バーは cur のみ参照

---

## 4. Wiki 索引

詳細仕様は `.claude/wiki/index.md` 参照。

---

## 5. 変更履歴

| 日付 | バージョン | 変更 |
|---|---|---|
| 2026-05-24 | 1.2.0 | P2-T4.1: 初期ユニット配置追記。影響マップ円形フォールオフ刷新。前線描画仕様明確化 |
| 2026-05-23 | 1.1.0 | 勝利条件を80%都市支配+全ユニット殲滅に変更。影響マップに都市パワー投射追記 |
| 2026-05-28 | 2.0.0 | LLM Wiki 3層化: §1,§5-§20 を wiki/ に分散。本書はアーキテクチャのみに圧縮 |
