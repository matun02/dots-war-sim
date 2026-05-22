## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§3.1「依存方向」と DESIGN.md §10「リプレイ」を厳密に守ること。

## 現在の状態
- M0〜M2 全完了。P1-T1〜T13 全て green。
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
  - commit `eb5ef21`: 戦闘・死亡処理・都市占領 — `spatial-hash.ts`, `resolve-combat.ts`, `remove-dead.ts`, `update-city-capture.ts`
  - commit `a316019`: 都市色の動的更新修正 — `cities.ts` を `createCityRenderer` パターンに
  - commit `e5be5aa`: 勝敗判定 + 結果画面 — `evaluate-game-end.ts`, `Title.svelte`, `ResultDialog.svelte`, `App.svelte` 画面遷移
  - commit `c617ac5`: AI v0（ルールベース） — `apps/web/src/game/ai/controller.ts`, `controller.test.ts`, `App.svelte` AI統合
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 95件 + maps 8件 + web 17件 = 合計 120件。
- `packages/core/src/sim/types.ts` に全型定義済み:
  - `Command`: `select | move | line` の union。各バリアントに `player: PlayerId` と `ids: EntityId[]` を持つ
  - `InputFrame`: `{ tick: number; commands: Command[] }`
  - `GameState`: `tick`, `seed`, `map`, `players`, `cities`, `units`, `nextEntityId`, `result` フィールド
  - `GameResult`: `{ type: 'victory'; winner: PlayerId; reason: 'domination' | 'annihilation' | 'timeout' } | { type: 'draw' }`
  - `Unit`: `id`, `owner`, `kind`, `homeCity`, `pos`, `hp`, `path`, `goal`, `attackCooldownTicks`
  - `City`: `id`, `pos`, `owner`, `production`, `produceCooldownTicks`, `captureProgressTicks`, `capturingPlayer`, `supplyUsed`
  - `Player`: `id`, `name`, `color`, `alive`
  - `MapDef`: `id`, `width`, `height`, `terrain`, `cities`, `spawns`
- `packages/core/src/sim/constants.ts`:
  - `TICK_RATE=30`, `SUPPLY_MAX=5`
  - `ATTACK_RANGE=1.5`, `CAPTURE_NEUTRALIZE_TICKS=60`, `CAPTURE_CLAIM_TICKS=30`, `POST_CAPTURE_COOLDOWN_TICKS=150`
  - `GAME_TIME_LIMIT_TICKS=36000`
  - `UNIT_STATS.light`: speed=4, attack=1, hp=1, attackIntervalTicks=15, produceIntervalTicks=60
  - `UNIT_STATS.heavy`: speed=2, attack=3, hp=5, attackIntervalTicks=30, produceIntervalTicks=180
- `packages/core/src/sim/tick.ts` — 処理順:
  1. `applyInputs(s, inputs)` — goal セット、path を null に
  2. `recomputePaths(s)` — A* パス計算（上限 8 件/tick）
  3. `moveUnits(s)` — path 追従版 + 直線フォールバック
  4. `resolveCombat(s, rng)` — 空間ハッシュ + 近傍戦闘
  5. `removeDead(s)` — hp<=0 除去 + supplyUsed 解放
  6. `updateCityCapture(s)` — 占領進捗
  7. `produceUnits(s, rng)` — ユニット生産
  8. `evaluateGameEnd(s)` — 勝敗判定（domination/annihilation/timeout/draw）
- `packages/core/src/index.ts` — export:
  - `Rng` (class), `tick`, `createInitialState`, 全型, 全定数, `SpatialHash`, `findPath`, `BinaryHeap`
- `packages/core/src/replay.ts` — **ファイル未作成**（このタスクで新規作成）
- `apps/web/src/App.svelte` — 画面遷移 (title → game → result → title/rematch) 実装済み:
  - `startGame()` でゲーム初期化（マップロード → Pixi セットアップ → ループ開始）
  - `onTick` 内で `humanCommands + aiCommands → InputFrame → tick()` → `cur` 更新
  - AI: `createAIController(1 as PlayerId, 'normal', new Rng(123))` — sim Rng(42) とは別
  - `onRender` 内で `cur.result !== null` → result 画面に遷移
- `apps/web/src/ui/ResultDialog.svelte` — Rematch / Title ボタンあり（ここに Replay ボタンを追加予定）
- `idb-keyval` — 技術スタックに記載あり（CLAUDE.md §2）だが **未インストール**
- マップ `first-blood.json` — 64×36, 5都市, 中央に山脈
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T14: リプレイ録画 / 再生**

試合中の全 InputFrame を記録し、試合終了後にリプレイとして保存・再生できるようにする。

### 仕様

#### 1. `packages/core/src/replay.ts` — Replay 型定義（新規）

```ts
import type { PlayerId, GameResult, InputFrame } from './sim/types.js';

export const REPLAY_VERSION = 1;

export interface ReplayPlayer {
  id: PlayerId;
  name: string;
  type: 'human' | 'ai';
}

export interface Replay {
  version: number;
  seed: number;
  mapId: string;
  players: ReplayPlayer[];
  inputs: InputFrame[];
  finalTick: number;
  result: GameResult;
  createdAt: number;         // Date.now() — sim 外なので OK
}
```

- `core/sim` 配下ではなく `core/src/replay.ts` に置く（型定義 + ユーティリティ）
- `core/src/index.ts` から export する

#### 2. `packages/core/src/sim/hash.ts` — 状態ハッシュ（新規）

DESIGN.md §10.3 準拠:

```ts
export function hashState(state: GameState): number;
```

- `tick`, units の `(Math.round(pos.x*10), Math.round(pos.y*10), hp, owner)`, cities の `(owner, supplyUsed)` を整数化
- 32bit XOR フォールドで単一 number を返す
- **決定論的**: 同じ state → 同じ hash（ユニット・都市は id 昇順でソートしてから処理）
- `core/sim/index.ts` から export する

#### 3. `apps/web/src/game/replay/recorder.ts` — 録画（新規）

```ts
import type { InputFrame } from '@war-of-dots/core';

export interface ReplayRecorder {
  /** 毎 tick 呼ばれる。InputFrame を内部バッファに追加 */
  record(frame: InputFrame): void;
  /** 記録済み全フレームを返す */
  getFrames(): InputFrame[];
}

export function createReplayRecorder(): ReplayRecorder;
```

#### 4. `apps/web/src/game/replay/storage.ts` — IndexedDB 保存（新規）

```ts
import type { Replay } from '@war-of-dots/core';

/** リプレイを IndexedDB に保存。キーは createdAt */
export async function saveReplay(replay: Replay): Promise<void>;

/** 保存済みリプレイ一覧を取得（新しい順） */
export async function listReplays(): Promise<Replay[]>;

/** 指定キーのリプレイを取得 */
export async function getReplay(createdAt: number): Promise<Replay | undefined>;

/** 指定キーのリプレイを削除 */
export async function deleteReplay(createdAt: number): Promise<void>;
```

- `idb-keyval` を使用（`pnpm --filter @war-of-dots/web add idb-keyval` でインストール）
- ★MUST: `idb-keyval` は CLAUDE.md §2 に記載済みの採用技術

#### 5. `apps/web/src/game/replay/player.ts` — 再生エンジン（新規）

```ts
import type { GameState, Rng, InputFrame } from '@war-of-dots/core';
import type { Replay } from '@war-of-dots/core';

export interface ReplayPlayer {
  /** 現在の tick を返す */
  currentTick(): number;
  /** 1 tick 進める。ゲーム終了なら false */
  step(): boolean;
  /** 現在の GameState を返す */
  state(): GameState;
  /** 指定 tick まで一括進行 */
  seekTo(tick: number): void;
}

export function createReplayPlayer(replay: Replay): ReplayPlayer;
```

- `createInitialState` + `tick` + replay の `inputs` で状態を再構築
- `hashState` で各 tick 末の整合性を検証可能（オプション）

#### 6. App.svelte — 統合

- `onTick` 内で `recorder.record(frame)` を呼ぶ
- 試合終了後に `Replay` オブジェクトを構築し `saveReplay()` で保存
- `ResultDialog.svelte` に「Watch Replay」ボタンを追加
- 新画面: `replay` — ゲーム画面と同じ描画だが入力なし、再生エンジンで駆動
- 画面遷移: `title → game → result → (replay | title | rematch)`

#### 7. リプレイ再生 UI（MVP 最小限）

- 再生中は通常のゲームループ（30Hz tick + RAF render）で描画
- 一時停止/再開ボタン
- 速度変更は MVP では不要（1x 固定）
- 終了時に result 画面に戻る

### 実装要件
1. **`core/src/replay.ts` は DOM 依存禁止** — 型定義とユーティリティのみ（CLAUDE.md §3.1）
2. **`hash.ts` は `core/sim/` 配下** — 決定論ルール準拠（Math.random 禁止等）
3. **`hash.ts` 内で浮動小数の順序依存を避ける** — pos を整数化 (`Math.round(x*10)`) してから XOR
4. **IndexedDB 操作は `apps/web/` 配下** — `core/` からは触らない
5. **録画は既存の `onTick` に 1 行追加するだけ** — ループ構造を壊さない
6. **リプレイ再生中は入力を無視** — マウスイベントを登録しない or 無視する
7. **1 タスクで触るディレクトリは 2 つまで** — `packages/core` + `apps/web`（CLAUDE.md §7.2）

### テスト計画

#### `packages/core/src/sim/hash.test.ts`（新規）
- 同一 state → 同一 hash
- 異なる state（ユニット位置が違う）→ 異なる hash
- ユニット配列の順序が異なっても同一 hash（id ソート済みなので）
- 空ユニット・空都市でもクラッシュしない

#### `packages/core/src/replay.test.ts`（新規）
- Replay 型が正しく構築できる
- REPLAY_VERSION が 1 である

#### `apps/web/src/game/replay/recorder.test.ts`（新規）
- record() で InputFrame が蓄積される
- getFrames() が記録順に返す

#### `apps/web/src/game/replay/player.test.ts`（新規）
- step() で 1 tick 進む
- 同じ replay を再生すると同じ最終 state になる（決定論検証）
- seekTo(N) で N tick まで進む
- finalTick に達したら step() が false を返す

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を `core/sim/` 内で使用（`Date.now()` は `apps/web` の replay 保存時のみ許可）
* `core/sim` 内に IndexedDB / DOM 操作を入れる
* `Map`/`Set` のイテレーション順に依存するコード（`hash.ts` 内含む）
* `for...in` の使用
* 既存テスト（core 95件 + maps 8件 + web 17件 = 120件）を壊す

### 受け入れ基準
- [ ] 試合終了後にリプレイデータが IndexedDB に保存される
- [ ] ResultDialog に「Watch Replay」ボタンが表示される
- [ ] リプレイを再生すると同じ展開が再現される（目視確認）
- [ ] 再生中に一時停止/再開ができる
- [ ] 再生終了後に result 画面に戻る
- [ ] `hashState` が決定論的に動作する
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 120 件 + 新規テスト全て green）
- [ ] `pnpm --filter @war-of-dots/web dev` で録画→再生が目視確認できる

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(replay): add replay recording and playback (P1-T14)
```

[本文にリプレイ型・ハッシュ・録画・再生・UI 統合の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-task-completion.md` を参照）。
