## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §3「ディレクトリ構成」§4.5「Pixi / DOM レイヤー」と DESIGN.md §3「主要データ構造」を厳密に守ること。

## 現在の状態
- M0（スケルトン）完了済み。P1-T1〜T6 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- `packages/core/src/sim/types.ts` に `MapDef`, `City`, `Terrain`, `TERRAIN_INDEX` 等の型・定数が定義済み。
  - `MapDef.terrain` は `number[]`（P1-T3 で `Uint8Array` から変更済み。JSON ラウンドトリップのため）。
  - `TERRAIN_INDEX`: `{ plain: 0, mountain: 1, forest: 2, water: 3 }`
- `apps/web/src/game/render/` に `stage.ts`（PixiJS v8 初期化）と `grid.ts`（格子描画）が存在。
- `apps/web/src/App.svelte` は canvas + PixiJS ステージ + グリッド描画のみ。
- `packages/maps/` はまだ存在しない（`pnpm-workspace.yaml` に `packages/*` は登録済み）。
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T7: マップ JSON 定義と読み込み**

最初のテストマップを定義し、マップデータの読み込み・バリデーション・地形描画を実装する。

### 仕様

#### 1. `packages/maps/` パッケージの新規作成

```
packages/maps/
├── package.json          # @war-of-dots/maps
├── tsconfig.json         # extends ../../tsconfig.base.json
├── vitest.config.ts
├── src/
│   ├── index.ts          # re-export
│   ├── loader.ts         # JSON → MapDef 変換 + バリデーション
│   ├── schema.ts         # valibot スキーマ定義
│   └── data/
│       └── first-blood.json  # 最初のテストマップ
```

- `package.json` の `name` は `@war-of-dots/maps`
- `@war-of-dots/core` に依存（`MapDef` 型を参照）
- バリデーションライブラリは **valibot**（軽量、zod より小さい）
- `pnpm --filter @war-of-dots/maps add valibot`
- `pnpm --filter @war-of-dots/maps add @war-of-dots/core --workspace`

#### 2. `packages/maps/src/schema.ts`
```ts
// valibot でマップ JSON のスキーマを定義
// - id: string (non-empty)
// - width: number (1〜256)
// - height: number (1〜256)
// - terrain: number[] (長さ = width * height, 各値 0〜3)
// - cities: array of { id, pos: {x, y}, production: "light" | "heavy" }
// - spawns: array of { player, cityId }
```

#### 3. `packages/maps/src/loader.ts`
```ts
import type { MapDef } from '@war-of-dots/core';

export function loadMap(json: unknown): MapDef {
  // 1. valibot で parse & validate
  // 2. terrain の各値が TERRAIN_INDEX の範囲内であることを確認
  // 3. cities の pos がマップ範囲内であることを確認
  // 4. spawns の cityId が cities に存在することを確認
  // 5. バリデーション失敗時は具体的なエラーメッセージを throw
  // 6. 検証済みの MapDef を返す
}
```

#### 4. `packages/maps/src/data/first-blood.json`
64×36 マップ。以下のレイアウト:
- 基本地形: plain (0)
- 中央に横に帯状の山脈 (mountain = 1): y=16〜19 の行に x=20〜43 あたり
- 山脈の左右に通路あり（ユニットが迂回できる）
- 左下と右下に小さな森エリア (forest = 2)
- 都市 5 個:
  - City 0: (10, 8) — Player 0 のスポーン都市
  - City 1: (54, 28) — Player 1 のスポーン都市
  - City 2: (32, 5) — 中立（上部中央）
  - City 3: (32, 30) — 中立（下部中央）
  - City 4: (32, 17) — 中立（山脈の隙間、戦略的要衝）
- spawns: Player 0 → City 0, Player 1 → City 1

#### 5. `apps/web/src/game/render/terrain.ts`
```ts
import type { Application } from 'pixi.js';
import type { MapDef } from '@war-of-dots/core';

export function drawTerrain(
  app: Application,
  map: MapDef,
  cellPx: number,
): Container {
  // 各セルを地形に応じた色で塗る
  // plain:    #1e2d1e (暗い緑)
  // forest:   #0e3a0e (深い緑)
  // mountain: #3a3a3a (灰色)
  // water:    #0e2740 (暗い青)
  // Container を返す
}
```

#### 6. `apps/web/src/game/render/cities.ts`
```ts
import type { Application } from 'pixi.js';
import type { City } from '@war-of-dots/core';

export function drawCities(
  app: Application,
  cities: readonly City[],
  cellPx: number,
): Container {
  // 各都市を白い円で描画
  // owner がいれば所有色の枠、なければグレー枠
  // Container を返す
}
```

#### 7. `apps/web/src/App.svelte` の更新
- `@war-of-dots/maps` から `loadMap` と `firstBlood` JSON を import
- `onMount` で:
  1. `createStage(canvas)`
  2. `loadMap(firstBloodJson)` でマップデータ取得
  3. `drawTerrain(app, map, 20)` で地形を描画
  4. `drawGrid(app, map.width, map.height, 20)` でグリッド（地形の上に重ねる）
  5. `drawCities(app, cities, 20)` で都市を描画
- 都市データは `MapDef.cities` から初期 `City[]` を組み立てる（owner は spawns に従い設定）

### 実装要件
1. **`packages/maps` は `core` のみに依存**。DOM, Pixi, Svelte を import しない
2. **valibot を使用**: zod より軽量。`pnpm --filter @war-of-dots/maps add valibot`
3. **terrain は `number[]`**: types.ts で定義済みの形式をそのまま使う
4. **Pixi の import は `render/` 配下のみ** — CLAUDE.md §4.5 の規約
5. **`first-blood.json` は手動で全セルを書くのではなく、生成スクリプト or 初期化関数で作成してよい**。ただし最終的には JSON ファイルとして保存する
6. **`apps/web` に `@war-of-dots/maps` への依存を追加**: `pnpm --filter @war-of-dots/web add @war-of-dots/maps --workspace`

### テスト計画
- `packages/maps/src/loader.test.ts`:
  - 正しい JSON で `loadMap` が `MapDef` を返す
  - `first-blood.json` が正常にロードできる
  - terrain の長さが width*height と不一致でエラー
  - terrain に範囲外の値 (例: 99) があるとエラー
  - cities の pos がマップ外でエラー
  - spawns の cityId が存在しない cityId でエラー
  - 必須フィールド欠落でエラー
- `pnpm -r typecheck` が通ること
- `pnpm lint` が通ること
- `pnpm -r test` で既存テスト（core 22件 + loop 6件）が壊れていないこと
- **dev サーバ起動**で目視確認:
  - 地形が色分けされて表示される（plain=暗緑、mountain=灰、forest=深緑）
  - 都市が白い円で表示され、Player 0/1 のスポーン都市は色付き
  - グリッド線が地形の上に薄く重なっている

### 禁止事項
* `core/sim` への変更（型は既に定義済み）
* Pixi の import を `render/` 以外に置く
* `Math.random()` / `Date.now()`
* `packages/maps` で DOM や Pixi を使う

### 受け入れ基準
- [ ] `packages/maps` パッケージが作成され、`pnpm install` が成功する
- [ ] `first-blood.json` が `loadMap()` で正常にロードできる
- [ ] バリデーションエラーのテストが 5 件以上 pass
- [ ] `pnpm --filter @war-of-dots/web dev` で地形 + 都市 + グリッドが見える
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存テスト壊していないこと）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(maps): add first-blood map with terrain rendering (P1-T7)
```

[本文にマップパッケージ・バリデーション・地形描画の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
