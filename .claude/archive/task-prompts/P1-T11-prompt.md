## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§4.4「純度・テスト可能性」と DESIGN.md §1.6「占領ルール」§1.7「戦闘解決」§5.2「各ステップの責務」を厳密に守ること。

## 現在の状態
- M1（ゲーム表示）完了済み。M2 進行中。P1-T1〜T10 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
  - commit `335a662`: マップ JSON + 地形描画 — `packages/maps/`, `terrain.ts`, `cities.ts`
  - commit `efafc60`: ユニット生産 + 直線移動 — `constants.ts`, `init.ts`, `produce-units.ts`, `move-units.ts`, `units.ts`
  - commit `688d854`: 矩形選択 + 移動命令 — `input/selection.ts`, `input/commands.ts`, `apply-inputs.ts`, `selection-box.ts`
  - commit `d8441ec`: A* パスファインディング — `pathfinding/binary-heap.ts`, `astar.ts`, `recompute-paths.ts`, `move-units.ts` path追従版
  - commit `50d2e02`: レビュー修正（astar テスト強化 + export 統合）
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 63件 + maps 8件 + web 9件 = 合計 80件。
- `packages/core/src/sim/types.ts` に全型定義済み:
  - `Unit`: `id`, `owner`, `kind`, `homeCity`, `pos: Vec2`, `hp`, `path: Vec2[] | null`, `goal: Vec2 | null`, `attackCooldownTicks`
  - `City`: `id`, `pos`, `owner: PlayerId | null`, `production`, `produceCooldownTicks`, `captureProgressTicks`, `capturingPlayer: PlayerId | null`, `supplyUsed`
  - `GameResult`: `{ type: 'victory', winner, reason: 'domination' | 'annihilation' | 'timeout' } | { type: 'draw' }`
- `packages/core/src/sim/constants.ts`:
  - `TICK_RATE=30`, `SUPPLY_MAX=5`
  - `UNIT_STATS.light`: `speed=4, attack=1, hp=1, attackIntervalTicks=15, produceIntervalTicks=60`
  - `UNIT_STATS.heavy`: `speed=2, attack=3, hp=5, attackIntervalTicks=30, produceIntervalTicks=180`
  - **`attackRange` は未定義** — このタスクで追加が必要
- `packages/core/src/sim/steps/resolve-combat.ts` — **空実装**:
  ```ts
  export function resolveCombat(_state: GameState, _rng: Rng): void {}
  ```
- `packages/core/src/sim/steps/remove-dead.ts` — **空実装**:
  ```ts
  export function removeDead(_state: GameState): void {}
  ```
- `packages/core/src/sim/steps/update-city-capture.ts` — **空実装**:
  ```ts
  export function updateCityCapture(_state: GameState): void {}
  ```
- `packages/core/src/sim/tick.ts` — 処理順:
  1. `applyInputs(s, inputs)` — goal セット、path を null に
  2. `recomputePaths(s)` — A* パス計算（上限 8 件/tick）
  3. `moveUnits(s)` — path 追従版 + 直線フォールバック
  4. `resolveCombat(s, rng)` — ★空実装 → T11 で実装
  5. `removeDead(s)` — ★空実装 → T11 で実装
  6. `updateCityCapture(s)` — ★空実装 → T11 で実装
  7. `produceUnits(s, rng)` — 実装済み。`capturingPlayer !== null` で生産停止
  8. `evaluateGameEnd(s)` — 空実装（T12 で実装）
- `packages/core/src/sim/init.ts` — `createInitialState(map, players, seed)` 実装済み
- `apps/web/src/App.svelte` — P1-T9 で入力統合済み。ゲームループ (30Hz) + 描画 (RAF) 稼働中。右クリックで移動命令、ドラッグで矩形選択。描画は `terrain` + `grid` + `cities` + `units` + `selection-box`
- マップ `first-blood.json` — 64×36, 5都市, 中央に山脈
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T11: 戦闘・死亡処理・都市占領**

敵ユニット同士が接触したら戦闘し、HP 0 で消滅。都市マスにいる敵ユニットが一定時間滞在すると都市を占領できる。
戦闘の近傍検索には空間ハッシュを使い O(n) を O(k) に削減する。

### 仕様

#### 1. `packages/core/src/sim/spatial-hash.ts` — 空間ハッシュ（新規）

```ts
export class SpatialHash {
  constructor(cellSize: number, width: number, height: number);
  clear(): void;
  insert(id: EntityId, x: number, y: number): void;
  query(x: number, y: number, radius: number): EntityId[];
}
```

- グリッド分割の空間ハッシュ。セル幅 = 1 セル（TASKS.md の指示通り）
- `insert`: ユニットの浮動小数点座標を `Math.floor` でセルに割り当て
- `query`: 指定座標から radius 内のセルを走査し、EntityId のリストを返す
- `query` の結果は **id 昇順** にソートして返す（決定論のため）
- 内部ストレージは配列ベース（Map/Set 不可、CLAUDE.md §4.3）

#### 2. `packages/core/src/sim/constants.ts` — 定数追加

```ts
export const ATTACK_RANGE = 1.5;                    // セル単位の攻撃範囲
export const CAPTURE_NEUTRALIZE_TICKS = 60;          // 2秒 × 30Hz = 60 tick で中立化
export const CAPTURE_CLAIM_TICKS = 30;               // 1秒 × 30Hz = 30 tick で占領
export const POST_CAPTURE_COOLDOWN_TICKS = 150;      // 占領直後 5秒間の生産クールダウン
```

#### 3. `packages/core/src/sim/steps/resolve-combat.ts` — 戦闘解決

```ts
import type { GameState } from '../types.js';
import type { Rng } from '../../rng.js';

export function resolveCombat(state: GameState, _rng: Rng): void {
  // 1. SpatialHash を構築（全ユニットを insert）
  // 2. 各ユニットについて:
  //    - attackCooldownTicks > 0 なら decrement して skip
  //    - ATTACK_RANGE 内の敵ユニットを query
  //    - 最寄りの敵を選ぶ（距離同値なら id 昇順 tie-break）
  //    - target.hp -= attacker.attack (UNIT_STATS[kind].attack)
  //    - attacker.attackCooldownTicks = UNIT_STATS[kind].attackIntervalTicks
  // 3. ユニット処理順は id 昇順（決定論のため）
}
```

- **処理順**: `state.units` は id 昇順であることを前提とする（produce-units が id 昇順で追加するため）。念のため処理前にソートしてもよい
- **同時攻撃**: このティックで HP が 0 以下になったユニットも、removeDead が後に実行されるため、**このティック内ではまだ攻撃可能**。つまり相打ちが発生する
- **_rng は未使用**: 現時点ではランダム要素なし。シグネチャは tick.ts との整合のため維持

#### 4. `packages/core/src/sim/steps/remove-dead.ts` — 死亡処理

```ts
import type { GameState } from '../types.js';

export function removeDead(state: GameState): void {
  // 1. hp <= 0 のユニットを特定
  // 2. 該当ユニットの homeCity の supplyUsed を 1 減らす
  //    (city は state.cities から id で検索)
  // 3. state.units から hp <= 0 を除去（filter で新配列、または splice）
}
```

- **supplyUsed の解放**: 各死亡ユニットの `homeCity` に対応する City の `supplyUsed` を 1 減算
- **City が見つからないケースは想定不要**: homeCity は生産時に必ずセットされる
- **補給スロット消費は全 kind が 1**: MVP は light のみ（cost=1）。heavy は Phase2 で cost=2 に拡張

#### 5. `packages/core/src/sim/steps/update-city-capture.ts` — 都市占領

```ts
import type { GameState } from '../types.js';

export function updateCityCapture(state: GameState): void {
  // 各都市について:
  // 1. 都市マス（city.pos と同じ整数座標）にいるユニットを陣営別にカウント
  //    - Math.floor(unit.pos.x) === city.pos.x && Math.floor(unit.pos.y) === city.pos.y
  // 2. 占領ロジック（DESIGN.md §1.6）:
  //
  //    a) 都市に敵のみが居る場合:
  //       - city.owner が存在し、その owner と異なる単一陣営のユニットのみが居る
  //       - city.capturingPlayer がその陣営と同じ → captureProgressTicks++
  //       - city.capturingPlayer が異なる → capturingPlayer をリセットし進捗を 0 に
  //       - captureProgressTicks >= CAPTURE_NEUTRALIZE_TICKS → city.owner = null（中立化）
  //         captureProgressTicks をリセット
  //
  //    b) 中立都市にユニットが居る場合:
  //       - 単一陣営のユニットのみが居る
  //       - captureProgressTicks++
  //       - captureProgressTicks >= CAPTURE_CLAIM_TICKS →
  //         city.owner = その陣営, capturingPlayer = null, captureProgressTicks = 0
  //         city.produceCooldownTicks = POST_CAPTURE_COOLDOWN_TICKS
  //
  //    c) 複数陣営が混在 → captureProgressTicks をリセット（進行停止）
  //
  //    d) ユニットが居ない → captureProgressTicks をリセット
}
```

- **都市マスの判定**: `Math.floor(unit.pos.x) === city.pos.x && Math.floor(unit.pos.y) === city.pos.y`
- **占領直後の生産クールダウン**: `produceCooldownTicks = POST_CAPTURE_COOLDOWN_TICKS` (150 tick = 5秒)
- **自陣のユニットのみが居る場合**: 占領進行しない（自分の都市を占領はしない）

### 実装要件
1. **`core/sim` 内は決定論厳守** — ユニット処理順は id 昇順。距離の tie-break も id 昇順（CLAUDE.md §4.3）
2. **`Array.sort` は全順序の比較関数** — 同値の場合は ID で tie-break（CLAUDE.md §4.3）
3. **Map/Set のイテレーション順に依存しない** — spatial-hash の内部は配列ベースで実装（CLAUDE.md §4.3）
4. **`core/sim` 内で副作用禁止** — console.log, DOM, fetch 等（CLAUDE.md §4.3）
5. **浮動小数点の距離比較** — 距離の二乗で比較し `Math.sqrt` を避けることも可。ただし決定論さえ保たれれば `Math.sqrt` も許容
6. **既存の produce-units.ts は変更不要** — `capturingPlayer !== null` で生産停止する機構は既に実装済み
7. **tick.ts は変更不要** — 空実装の 3 関数を埋めるだけで tick の処理順は既に正しい

### テスト計画

#### `packages/core/src/sim/spatial-hash.test.ts`（新規）
- 空のハッシュから query すると空配列
- insert した要素が query で取得できる
- radius 外の要素は query に含まれない
- 同セルに複数要素を insert して全て取得できる
- query 結果が id 昇順でソートされている

#### `packages/core/src/sim/steps/resolve-combat.test.ts`（新規）
- 攻撃範囲内の敵に攻撃し HP が減る
- 攻撃範囲外の敵には攻撃しない
- attackCooldownTicks がセットされ、クールダウン中は攻撃しない
- クールダウンが 0 になったら再攻撃する
- 同陣営のユニットには攻撃しない
- 複数の敵が範囲内にいる場合、最寄りを選ぶ（距離同値なら id 昇順）
- 相打ち: 同ティック内で両者が攻撃可能

#### `packages/core/src/sim/steps/remove-dead.test.ts`（新規）
- hp <= 0 のユニットが除去される
- 除去されたユニットの homeCity の supplyUsed が 1 減る
- hp > 0 のユニットは残る
- 複数ユニットが同時に死亡した場合、全て除去される

#### `packages/core/src/sim/steps/update-city-capture.test.ts`（新規）
- 敵ユニットのみが都市マスに 60 tick 滞在で中立化
- 中立都市にユニットが 30 tick 滞在で占領
- 占領後に produceCooldownTicks が 150 にセットされる
- 複数陣営が混在すると進捗がリセットされる
- ユニットが都市マスを離れると進捗がリセットされる
- 自陣のユニットのみの場合は占領が進行しない

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を sim 内で使用
* `Map`/`Set` のイテレーション順に依存するコード（spatial-hash 含む）
* `Array.sort` の不安定ソートに依存（比較関数で全順序を保証する）
* `for...in` の使用
* `core/sim` 内で `async/await`、`Promise`、`setTimeout`
* 既存テスト（core 63件 + maps 8件 + web 9件 = 80件）を壊す

### 受け入れ基準
- [ ] 2 ユニットが接触すると 1 秒ほどで両方死ぬ（HP=1, attack=1, attackInterval=0.5s → 15 tick で攻撃 → light 同士は 1 発で相打ち）
- [ ] 中立都市にユニットが 30 tick（1 秒）滞在で占領される
- [ ] 敵都市は 60 + 30 tick で奪える（中立化 + 占領）
- [ ] 占領進捗は敵が混在したらリセットされる
- [ ] 死亡ユニットの補給枠が解放される
- [ ] `pnpm --filter @war-of-dots/web dev` で戦闘・死亡・占領が目視確認できる
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 80 件 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(sim): add combat, death, and city capture (P1-T11)
```

[本文に spatial-hash・resolve-combat・remove-dead・update-city-capture の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
