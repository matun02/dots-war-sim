## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§4.4「純度・テスト可能性」と DESIGN.md §7「パスファインディング」§5.2「各ステップの責務」を厳密に守ること。

## 現在の状態
- M1（ゲーム表示）完了済み。M2 進行中。P1-T1〜T9 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
  - commit `335a662`: マップ JSON + 地形描画 — `packages/maps/`, `terrain.ts`, `cities.ts`
  - commit `efafc60`: ユニット生産 + 直線移動 — `constants.ts`, `init.ts`, `produce-units.ts`, `move-units.ts`, `units.ts`
  - commit `688d854`: 矩形選択 + 移動命令 — `input/selection.ts`, `input/commands.ts`, `apply-inputs.ts`, `selection-box.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 45件 + maps 8件 + web 9件 = 合計 62件。
- `packages/core/src/sim/types.ts` に全型定義済み:
  - `Unit` に `goal: Vec2 | null`, `path: Vec2[] | null` フィールドあり
  - `MapDef` に `terrain: number[]` (`TERRAIN_INDEX`: plain=0, mountain=1, forest=2, water=3)
  - `UnitKind = 'light' | 'heavy'`
- `packages/core/src/sim/constants.ts`:
  - `TICK_RATE=30`, `SUPPLY_MAX=5`
  - `UNIT_STATS.light.speed=4`, `UNIT_STATS.heavy.speed=2`
- `packages/core/src/sim/steps/recompute-paths.ts` — **空実装**:
  ```ts
  export function recomputePaths(_state: GameState): void {}
  ```
- `packages/core/src/sim/steps/move-units.ts` — **直線移動版**（P1-T8 実装）:
  ```ts
  export function moveUnits(state: GameState): void {
    for (const unit of state.units) {
      if (unit.goal === null) continue;
      // dx/dy 計算 → dist < 0.05 で停止 → speed/TICK_RATE で直進
    }
  }
  ```
  - goal に向かって直進する。path は使っていない。
  - テスト 5 件あり（`move-units.test.ts`）
- `packages/core/src/sim/steps/apply-inputs.ts` — move コマンド時に `unit.goal = to`, `unit.path = null` をセット（P1-T9 実装済み）
- `packages/core/src/pathfinding/` — **ディレクトリ未作成**
- `packages/core/src/sim/tick.ts` — 処理順:
  1. `applyInputs(s, inputs)` — goal をセット、path を null に
  2. `recomputePaths(s)` — ★空実装 → T10 で実装
  3. `moveUnits(s)` — ★直線版 → T10 で path 追従版に差し替え
  4. resolveCombat, removeDead, updateCityCapture, produceUnits, evaluateGameEnd
- `apps/web/src/App.svelte` — P1-T9 で入力統合済み。右クリックで goal をセットし tick 内で apply-inputs → recomputePaths → moveUnits の順に処理される
- マップ `first-blood.json` — 64×36, 中央に山脈が帯状に配置。mountain セル多数あり、A* の迂回テストに適している
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T10: A* パスファインディング（地形回避）**

山を避けて目的地へ向かうパスファインディングを実装する。
recompute-paths.ts を実装して goal 変更時に A* でパスを再計算し、move-units.ts を path 追従版に差し替える。

### 仕様

#### 1. `packages/core/src/pathfinding/binary-heap.ts` — 優先度キュー

```ts
export class BinaryHeap<T> {
  constructor(comparator: (a: T, b: T) => number);
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  get size(): number;
}
```

- min-heap（comparator で最小を先頭に）
- A* の open リストに使用

#### 2. `packages/core/src/pathfinding/astar.ts` — A* パスファインディング

```ts
import type { MapDef, Vec2, UnitKind } from '../sim/types.js';

export function findPath(
  map: MapDef,
  start: Vec2,
  goal: Vec2,
  kind: UnitKind,
): Vec2[] | null;
```

- **8 方向移動**: 上下左右 + 斜め 4 方向
- **コスト**: ストレート=10, 対角=14（√2 を整数近似）
- **地形コスト**（DESIGN.md §7.2）:
  - light: plain=1, forest=2, mountain=3, water=∞(通行不可), city=1
  - heavy: plain=1, forest=∞, mountain=∞, water=∞, city=1
- **ヒューリスティック**: オクタイル距離（8 方向用のマンハッタン拡張）
- **tie-break**: 同 f スコアのときは `(y * width + x)` 昇順（決定論）
- **戻り値**: `[start, ..., goal]` の Vec2 配列。到達不能なら `null`
- **start/goal の座標**: 浮動小数を `Math.floor()` で整数セル座標に変換してからグリッド探索

#### 3. `packages/core/src/sim/steps/recompute-paths.ts` — パス再計算

```ts
import type { GameState } from '../types.js';

export function recomputePaths(state: GameState): void {
  // unit.goal != null かつ unit.path == null のユニットに対して A* を実行
  // 1 tick あたり最大 8 経路まで（id 昇順で処理、公平性のため）
  // findPath の結果を unit.path にセット
  // path が null（到達不能）の場合は unit.goal も null にリセット
}
```

- apply-inputs で move コマンドが来ると `goal = to, path = null` になる
- recomputePaths は `path == null && goal != null` のユニットだけ再計算
- 1 tick あたり最大 8 件（id 昇順）で制限

#### 4. `packages/core/src/sim/steps/move-units.ts` — path 追従版に差し替え

```ts
export function moveUnits(state: GameState): void {
  for (const unit of state.units) {
    if (unit.path === null || unit.path.length === 0) {
      // path がなく goal もあれば直線移動（フォールバック、1tick内にpathが来なかった場合）
      // goal も null なら何もしない
      continue;
    }
    // path[0] をターゲットとしてそこへ進む
    // ターゲットセルの中心に十分近づいたら path.shift()
    // path が空になったら goal = null
  }
}
```

- path 追従: `path[0]` のセル中心（x+0.5, y+0.5）へ向かって移動
- セル中心に距離 < 0.3 で到達とみなし `path.shift()`
- path が空になったら `goal = null, path = null`
- path がまだ来ていない（goal はあるが path == null）場合は、直線移動をフォールバックとして維持

#### 5. `packages/core/src/pathfinding/index.ts` — re-export

```ts
export { findPath } from './astar.js';
export { BinaryHeap } from './binary-heap.js';
```

`packages/core/src/index.ts` からも `findPath` を re-export する。

### 実装要件
1. **`core/sim` 内は決定論厳守** — A* の tie-break は `(y * width + x)` 昇順。Map/Set のイテレーション順依存禁止（CLAUDE.md §4.3）
2. **`core/pathfinding` は `core/sim/types` のみに依存** — DOM, Pixi, Node 禁止（DESIGN.md §2.3）
3. **浮動小数の順序依存を避ける** — コストは整数演算（10/14）で行う（CLAUDE.md §4.3）
4. **既存の move-units テストとの互換** — path 追従版でも「goal に向かって移動する」「到達で停止する」の基本動作は維持。既存テストを更新してよいが、同等の動作検証は残す
5. **1 tick あたり再計算上限 8 件** — id 昇順で処理（DESIGN.md §7.1）
6. **Array.sort は全順序の比較関数を使う** — 同値の場合は ID で tie-break（CLAUDE.md §4.3）

### テスト計画

#### `packages/core/src/pathfinding/binary-heap.test.ts`
- push/pop で最小値が先に出る
- 空の heap から pop すると undefined
- ランダム 100 要素を入れて pop が昇順
- size が正しく増減する

#### `packages/core/src/pathfinding/astar.test.ts`
- 障害物なしで直線的なパスを返す
- 山を迂回するパスを返す（壁マップ定義）
- 完全に囲まれた到達不能で null を返す
- 同入力で 100 回呼んで JSON.stringify が完全一致（決定論）
- heavy ユニットが forest/mountain を通れない
- start == goal で [start] を返す（or 空配列）
- 対角移動が正しく使われる

#### `packages/core/src/sim/steps/recompute-paths.test.ts`
- goal があり path が null のユニットにパスが計算される
- goal が null のユニットは無視される
- path が既にあるユニットは再計算されない
- 1 tick あたり最大 8 件の制限が守られる（9 件目は次 tick に持ち越し）
- 到達不能な goal の場合、goal が null にリセットされる

#### `packages/core/src/sim/steps/move-units.test.ts`（既存テストの更新）
- path に沿って移動する
- path の各ウェイポイントに到達したら次に進む
- path 完了後に goal と path が null になる
- goal はあるが path がまだない場合の動作（直線フォールバック or 停止）

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を sim 内で使用
* `Map`/`Set` のイテレーション順に依存するコード
* `Array.sort` の不安定ソートに依存（比較関数で全順序を保証する）
* `for...in` の使用
* `core/pathfinding` から DOM, Pixi, Node API を import する
* `core/sim` 内で `async/await`、`Promise`、`setTimeout`
* 既存テスト（core 45件 + maps 8件 + web 9件）を壊す

### 受け入れ基準
- [ ] 移動命令で山を迂回してユニットが目的地に到達する
- [ ] 同 start/goal で 100 回 findPath を呼んで結果が完全一致（決定論テスト）
- [ ] 到達不能で null を返す
- [ ] 性能: 64×36 マップ上で 1 経路 < 2ms
- [ ] `pnpm --filter @war-of-dots/web dev` で迂回移動が確認できる
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 62 件 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(pathfinding): add A* with terrain avoidance (P1-T10)
```

[本文に binary-heap・astar・recompute-paths・move-units 改修の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
