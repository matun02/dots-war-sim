## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.5（Pixi レイヤー規約）、§7.2（2ディレクトリ制限）と DESIGN.md §8.3（前線描画）を厳密に守ること。

## 現在の状態
- M3 完了。Phase 1 全完了。P2-T1〜T3 完了。
  - commit `{P2-T1のcommit}`: heavy ユニット実装
  - commit `{P2-T2のcommit}`: 影響マップ実装 — `packages/core/src/sim/influence-map.ts`
  - commit `{P2-T3のcommit}`: AI v1 実装 — `apps/web/src/game/ai/controller.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: 合計 {P2-T3完了後の件数} 件。

### 前線描画関連の既存実装状態

- `packages/core/src/sim/influence-map.ts`（P2-T2 で実装済み）:
  - `computeInfluenceMap(state): InfluenceData`
  - `computeInfluenceDiff(data, playerA, playerB): Int16Array`

- `apps/web/src/game/render/` 配下の既存レンダラ:
  - `stage.ts`: `createStage(canvas)` — PixiJS Application 生成
  - `terrain.ts`: `drawTerrain(app, map, cellPx)` — 地形グリッド
  - `grid.ts`: `drawGrid(app, width, height, cellPx)` — グリッド線
  - `cities.ts`: `createCityRenderer(app, cellPx)` — 都市の動的描画
  - `units.ts`: `createUnitRenderer(app, cellPx)` — ユニット描画 + 補間
  - `selection-box.ts`: `createSelectionRenderer(app, cellPx)` — 選択矩形
  - ★ `frontline.ts` は存在しない → 本タスクで新規作成

- `apps/web/src/App.svelte`:
  - ゲームループ内で `cityRenderer.update()`, `unitRenderer.update()` を呼び出し
  - ★ 前線レンダラの統合が必要

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T4: 前線描画**

影響マップの差分から 0 等高線をマーチングスクエア法で計算し、PixiJS Graphics で半透明線として描画する。

### 仕様

#### 1. `frontline.ts` — 新規作成

ファイル: `apps/web/src/game/render/frontline.ts`

```ts
import { Container, Graphics } from 'pixi.js';
import type { InfluenceData, PlayerId } from '@dots-war-sim/core';

export function createFrontlineRenderer(cellPx: number): {
  update(data: InfluenceData, playerA: PlayerId, playerB: PlayerId): void;
  container: Container;
};
```

#### 2. マーチングスクエア法

影響マップの差分 `diff = infl[A] - infl[B]` の **0 等高線** を計算:

```
for each cell (x, y) in grid:
  // 2×2 セルの 4 頂点の diff 値を取得
  v0 = diff[y * width + x]           // 左上
  v1 = diff[y * width + (x+1)]       // 右上
  v2 = diff[(y+1) * width + (x+1)]   // 右下
  v3 = diff[(y+1) * width + x]       // 左下

  // 各頂点が正(A優勢)か負(B優勢)かで 4bit ケースインデックスを決定
  caseIdx = (v0 > 0 ? 8 : 0) | (v1 > 0 ? 4 : 0) | (v2 > 0 ? 2 : 0) | (v3 > 0 ? 1 : 0)

  // 16 パターンのルックアップテーブルで線分を生成
  // 線形補間で等高線の正確な通過位置を計算
```

**16 ケーステーブル**:
- case 0, 15: 線分なし（全同）
- case 1, 14: 左下と下辺
- case 2, 13: 右下と下辺
- ...（標準マーチングスクエアテーブル）

**線形補間**:
```
// 辺上の等高線通過点: threshold=0 なので
t = v0 / (v0 - v1)  // 0 除算回避: v0 === v1 なら skip
point = lerp(corner0, corner1, t)
```

#### 3. PixiJS 描画

```ts
const g = new Graphics();
g.clear();
for (const segment of segments) {
  g.moveTo(segment.x0 * cellPx, segment.y0 * cellPx);
  g.lineTo(segment.x1 * cellPx, segment.y1 * cellPx);
}
g.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
```

- 色: 白（`0xffffff`）、alpha=0.3（半透明）
- 幅: 2px
- 地形グリッドと都市の上、ユニットの下に描画（z-order）

#### 4. `App.svelte` — 統合

```ts
// ゲーム開始時
const frontlineRenderer = createFrontlineRenderer(cellPx);
app.stage.addChild(frontlineRenderer.container);
// ★ 都市の上、ユニットの下に挿入

// 影響マップのキャッシュ（5tick ごと更新）
let cachedInfluence: InfluenceData | null = null;
let lastInfluenceTick = -1;

// onRender 内
if (cur.tick - lastInfluenceTick >= 5) {
  cachedInfluence = computeInfluenceMap(cur);
  lastInfluenceTick = cur.tick;
}
if (cachedInfluence) {
  frontlineRenderer.update(cachedInfluence, 0 as PlayerId, 1 as PlayerId);
}
```

### 実装要件
1. **Pixi レイヤー規約** — `apps/web/src/game/render/` のみが PixiJS を import（CLAUDE.md §4.5）
2. **一方向データフロー** — レンダラは GameState / InfluenceData を読み取り専用（CLAUDE.md §2.2）
3. **1 ディレクトリ制限** — `apps/web` のみ（CLAUDE.md §7.2）
4. **パフォーマンス** — 64×36 マップで 5tick ごと再計算。マーチングスクエアは軽量
5. **ゲームループ破綻回避** — render 内で重い計算をしない（影響マップ計算は onTick 側で）

### テスト計画

#### `apps/web/src/game/render/frontline.test.ts`（新規）

マーチングスクエアのロジック部分（純関数）をテスト:

- **全セル同符号**: 線分が生成されない
- **単一セル境界**: 1 セルだけ符号が異なる → 2 線分が生成される
- **直線境界**: 横一列で符号が変わる → 連続する線分が生成される
- **線形補間**: 値の比率に応じた正しい位置に線が通る
- **0 除算回避**: 隣接セルの diff 値が等しい場合にクラッシュしない

★ PixiJS の Graphics 描画自体は目視確認（ブラウザでの動作確認）。

### 禁止事項
* `core/sim/` のロジックを変更する
* `packages/core/` に PixiJS を import する
* `packages/maps/` を変更する
* 既存テストを壊す
* マーチングスクエアの計算で浮動小数に依存する順序問題を起こす

### 受け入れ基準
- [ ] 前線（影響マップ差分の 0 等高線）が白い半透明線で描画される
- [ ] 5tick ごとに更新される（影響マップと同期）
- [ ] ユニットが移動すると前線も動的に変化する
- [ ] ユニットがいない領域では前線が表示されない
- [ ] z-order: 地形 > 前線 > ユニット（前線はユニットの下）
- [ ] パフォーマンス: 60 FPS を維持（64×36 マップ）
- [ ] マーチングスクエアの線分計算テストが通る
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(render): add frontline drawing with marching squares (P2-T4)
```

[本文に変更要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。
