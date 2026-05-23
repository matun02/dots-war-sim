## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§4.6「Svelte レイヤー」と DESIGN.md §9.1「v0 AI」§9.3「難易度」§9.4「MUST NOT」を厳密に守ること。

## 現在の状態
- M1（ゲーム表示）完了済み。M2 進行中。P1-T1〜T12 全て green。
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
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 95件 + maps 8件 + web 9件 = 合計 112件。
- `packages/core/src/sim/types.ts` に全型定義済み:
  - `Command`: `select | move | line` の union。各バリアントに `player: PlayerId` と `ids: EntityId[]` を持つ
  - `InputFrame`: `{ tick: number; commands: Command[] }`
  - `GameState`: `tick`, `seed`, `map`, `players`, `cities`, `units`, `nextEntityId`, `result` フィールド
  - `Unit`: `id`, `owner`, `kind`, `homeCity`, `pos`, `hp`, `path`, `goal`, `attackCooldownTicks`
  - `City`: `id`, `pos`, `owner`, `production`, `produceCooldownTicks`, `captureProgressTicks`, `capturingPlayer`, `supplyUsed`
  - `Player`: `id`, `name`, `color`, `alive`
  - `Vec2`: `{ x: number; y: number }`
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
- `apps/web/src/game/input/commands.ts` — `createInputCollector(player: PlayerId)`:
  - `selectedIds`, `select(ids)`, `moveCommand(to)`, `flush(): Command[]`
  - AI も同じ `Command` 型を使って `InputFrame` 経由で tick に渡す
- `apps/web/src/game/ai/` — **ディレクトリ未作成**（このタスクで新規作成）
- `apps/web/src/App.svelte` — 画面遷移 (title → game → result → title/rematch) 実装済み:
  - `startGame()` でゲーム初期化（マップロード → Pixi セットアップ → ループ開始）
  - `onTick` 内で `inputCollector.flush()` → `tick()` → `cur` 更新
  - AI の Command は `onTick` 内で人間の Command と合流させて `InputFrame` に含める
  - `onRender` 内で `cur.result !== null` → result 画面に遷移
  - Player 1 (id=0) が人間、Player 2 (id=1) が AI になる
- マップ `first-blood.json` — 64×36, 5都市, 中央に山脈
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T13: AI v0（ルールベース）**

ルールベースの AI を実装し、人間プレイヤーが AI と対戦できるようにする。AI は `Command` を生成して通常の `InputFrame` として tick に渡す。

### 仕様

#### 1. `apps/web/src/game/ai/controller.ts` — AI コントローラー（新規）

```ts
import type { GameState, Command, PlayerId } from '@war-of-dots/core';

export type AIDifficulty = 'easy' | 'normal' | 'hard';

interface AIConfig {
  /** AI が思考する間隔（tick 単位）。Easy=90(3秒), Normal=30(1秒), Hard=1(毎tick) */
  thinkIntervalTicks: number;
  /** ユニット選択の精度（0〜1）。未選択ユニットをこの確率で派遣対象に含める */
  selectionAccuracy: number;
}

const DIFFICULTY_CONFIG: Record<AIDifficulty, AIConfig> = {
  easy:   { thinkIntervalTicks: 90, selectionAccuracy: 0.7 },
  normal: { thinkIntervalTicks: 30, selectionAccuracy: 0.85 },
  hard:   { thinkIntervalTicks: 1,  selectionAccuracy: 0.95 },
};

export interface AIController {
  /** 毎 tick 呼ばれる。思考タイミングでなければ空配列を返す */
  update(state: GameState): Command[];
}

export function createAIController(
  playerId: PlayerId,
  difficulty: AIDifficulty,
  rng: Rng,  // 決定論用 — Math.random 禁止
): AIController;
```

#### 2. AI ロジック（DESIGN.md §9.1 準拠）

```
毎思考 tick で:
1. 自陣営ユニットを収集（state.units.filter(u => u.owner === playerId && ...）
2. 「待機」（goal === null）と「移動中」（goal !== null）に分類
3. ターゲット都市リストを生成:
   - 中立都市（owner === null）
   - 敵都市（owner !== playerId && owner !== null）
   - 価値スコア = (1 / 距離) * 重み。距離は自都市からの平均距離
4. 待機ユニットのうち selectionAccuracy の割合を、上位ターゲットへ派遣
   - 派遣 = Command { type: 'move', player: playerId, ids: [...], to: city.pos }
5. 防衛: 自都市に敵ユニットが近い（captureProgressTicks > 0）→ 近隣ユニットを呼び戻し

距離計算は Math.hypot(dx, dy) でよい（sim 外なので浮動小数 OK）
ユニット選択に Rng を使う（selectionAccuracy の確率判定）
```

#### 3. `apps/web/src/App.svelte` — AI 統合

```ts
// startGame() 内で:
// 1. AIController を生成（playerId=1, difficulty='normal', rng は別シードか同一 Rng）
// 2. onTick 内で:
//    const aiCommands = aiController.update(cur);
//    const humanCommands = inputCollector.flush();
//    const frame: InputFrame = {
//      tick: cur.tick,
//      commands: [...humanCommands, ...aiCommands],
//    };
//    cur = tick(prev, [frame], rng);
```

- AI 用の Rng は **sim 用 Rng とは別インスタンス**にする（AI の思考は sim 外）
- 難易度選択 UI は MVP では不要（デフォルト `normal`、後で Title 画面に追加可能）

### 実装要件
1. **AI は sim の state を書き換えない** — `Command` 経由のみ（DESIGN.md §9.4）
2. **AI 内で `Math.random()` 禁止** — `Rng` 経由（DESIGN.md §9.4、CLAUDE.md §4.3）
3. **AI は `apps/web/src/game/ai/` 配下** — `core/sim` には入れない（CLAUDE.md §3.1）
4. **AI の Command は既存の `Command` union 型に準拠** — 新しい Command バリアントを追加しない
5. **1 タスクで触るディレクトリは 2 つまで** — `apps/web` のみ（CLAUDE.md §7.2）
6. **tick.ts は変更不要** — AI の出力は InputFrame に混ぜるだけ

### テスト計画

#### `apps/web/src/game/ai/controller.test.ts`（新規）

- 中立都市がある場合、待機ユニットが派遣される（move コマンドが生成される）
- 全ユニットが移動中なら新たな派遣コマンドは出ない
- 思考間隔（thinkIntervalTicks）以外の tick では空配列を返す
- Easy の selectionAccuracy=0.7 で、一部ユニットのみ派遣される
- 自都市が脅威下（captureProgressTicks > 0）のとき防衛コマンドが出る
- ゲーム結果が確定済み（state.result !== null）なら空配列を返す
- AI は自分の playerId に対応する Command のみ生成する
- 決定論テスト: 同じ state + 同じ Rng seed → 同じ Command 列

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を AI 内で使用（Rng 経由）
* AI が `GameState` を直接変更する（Command 経由のみ）
* `core/sim` 内に AI ロジックを置く
* `Map`/`Set` のイテレーション順に依存するコード
* `for...in` の使用
* 既存テスト（core 95件 + maps 8件 + web 9件 = 112件）を壊す

### 受け入れ基準
- [ ] 起動 → AI 相手にプレイできる
- [ ] AI が中立都市を狙ってユニットを派遣する
- [ ] AI が自都市を防衛しようとする
- [ ] AI のコマンドが `InputFrame` 経由で正しく tick に渡される
- [ ] 決定論テスト: 同一条件で同じ AI 行動
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 112 件 + 新規テスト全て green）
- [ ] `pnpm --filter @war-of-dots/web dev` で AI が動いている様子が目視確認できる

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(ai): add rule-based AI controller v0 (P1-T13)
```

[本文に AI ロジック・難易度設定・App.svelte 統合の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-task-completion.md` を参照）。
