## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§4.6「Svelte レイヤー」と DESIGN.md §1.1「勝利条件」§5.2「各ステップの責務」§12.1「画面構成」を厳密に守ること。

## 現在の状態
- M1（ゲーム表示）完了済み。M2 進行中。P1-T1〜T11 全て green。
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
  - commit `7290bd5`: docs 更新（P1-T11 完了）
  - commit `a316019`: 都市色の動的更新修正 — `cities.ts` を `createCityRenderer` パターンに
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 86件 + maps 8件 + web 9件 = 合計 103件。
- `packages/core/src/sim/types.ts` に全型定義済み:
  - `GameResult`: `{ type: 'victory', winner: PlayerId, reason: 'domination' | 'annihilation' | 'timeout' } | { type: 'draw' }`
  - `GameState`: `result: GameResult | null` フィールドあり
  - `Player`: `alive: boolean` フィールドあり
- `packages/core/src/sim/constants.ts`:
  - `TICK_RATE=30`, `SUPPLY_MAX=5`
  - `ATTACK_RANGE=1.5`, `CAPTURE_NEUTRALIZE_TICKS=60`, `CAPTURE_CLAIM_TICKS=30`, `POST_CAPTURE_COOLDOWN_TICKS=150`
  - `UNIT_STATS.light/heavy` 定義済み
  - **`GAME_TIME_LIMIT_TICKS` は未定義** — このタスクで追加が必要（36000 = 20分 × 60秒 × 30Hz）
- `packages/core/src/sim/steps/evaluate-game-end.ts` — **空実装**:
  ```ts
  export function evaluateGameEnd(_state: GameState): void {}
  ```
- `packages/core/src/sim/tick.ts` — 処理順:
  1. `applyInputs(s, inputs)` — goal セット、path を null に
  2. `recomputePaths(s)` — A* パス計算（上限 8 件/tick）
  3. `moveUnits(s)` — path 追従版 + 直線フォールバック
  4. `resolveCombat(s, rng)` — 空間ハッシュ + 近傍戦闘
  5. `removeDead(s)` — hp<=0 除去 + supplyUsed 解放
  6. `updateCityCapture(s)` — 占領進捗
  7. `produceUnits(s, rng)` — ユニット生産
  8. `evaluateGameEnd(s)` — ★空実装 → T12 で実装
- `apps/web/src/App.svelte` — ゲームループ (30Hz) + 描画 (RAF) 稼働中。右クリックで移動命令、ドラッグで矩形選択。描画は `terrain` + `grid` + `cities` + `units` + `selection-box`。現在は Title/Result 画面なし。
- マップ `first-blood.json` — 64×36, 5都市, 中央に山脈
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T12: 勝敗判定 + 結果画面**

ゲーム終了条件を判定し、結果画面を表示する。タイトル画面 → ゲーム → 結果画面 → タイトル画面の遷移フローを構築する。

### 仕様

#### 1. `packages/core/src/sim/constants.ts` — 定数追加

```ts
export const GAME_TIME_LIMIT_TICKS = 36000;  // 20分 × 60秒 × 30Hz = 36000 tick
```

#### 2. `packages/core/src/sim/steps/evaluate-game-end.ts` — 勝敗判定

```ts
import type { GameState } from '../types.js';

export function evaluateGameEnd(state: GameState): void {
  // 既に結果が確定していたら何もしない
  if (state.result !== null) return;

  // 各プレイヤーの alive 判定:
  // - 都市を 1 つも所有しておらず（cities.filter(c => c.owner === pid).length === 0）
  // - ユニットも 1 体もいない（units.filter(u => u.owner === pid).length === 0）
  // → そのプレイヤーは脱落: player.alive = false

  // 勝利判定（3パターン）:

  // A) 制覇勝利 (domination):
  //    alive なプレイヤーが都市を全て所有している
  //    → state.result = { type: 'victory', winner, reason: 'domination' }

  // B) 殲滅勝利 (annihilation):
  //    alive なプレイヤーが 1 人だけ（他は全員 alive=false）
  //    → state.result = { type: 'victory', winner, reason: 'annihilation' }

  // C) タイムアウト (timeout):
  //    state.tick >= GAME_TIME_LIMIT_TICKS
  //    → 都市数が多いプレイヤーが勝利（reason: 'timeout'）
  //    → 都市数同数なら引き分け: state.result = { type: 'draw' }

  // 処理順: A → B → C（domination は annihilation より優先）
  // alive プレイヤーの走査は id 昇順（決定論）
}
```

- **脱落判定**: 都市 0 かつ ユニット 0 で alive=false。都市 0 でもユニットが残っていればまだ alive（奪い返す可能性がある）
- **domination**: 全都市を所有 = `state.cities.every(c => c.owner === pid)` かつ alive
- **annihilation**: alive プレイヤーが 1 人のみ
- **timeout**: `state.tick >= GAME_TIME_LIMIT_TICKS` で都市数比較。都市数同数なら draw
- **2プレイヤー前提**: MVP は 2 人固定。ただし N 人対応を意識したロジックにする

#### 3. `apps/web/src/ui/Title.svelte` — タイトル画面（新規）

```svelte
<!-- シンプルなタイトル画面 -->
<!-- "War of Dots" タイトルテキスト -->
<!-- "Start Game" ボタン → クリックで on:start ディスパッチ -->
```

- 中央配置のシンプルなレイアウト
- 背景色 `#1a1a1a`（ゲームと統一）
- タイトルテキスト: 白、大きめフォント
- スタートボタン: プレイヤー色（#4488ff）ベース
- Svelte 5 のイベント: `createEventDispatcher` または props callback で `on:start` を通知

#### 4. `apps/web/src/ui/ResultDialog.svelte` — 結果画面（新規）

```svelte
<!-- state.result が出たら表示するオーバーレイ -->
<!-- 勝敗テキスト: "Victory!" / "Defeat!" / "Draw!" -->
<!-- 勝利理由: "Domination" / "Annihilation" / "Timeout" -->
<!-- ボタン:
     - "Rematch" → 同マップで再戦（on:rematch）
     - "Title" → タイトル画面へ（on:title）
-->
```

- 半透明の黒背景オーバーレイ（ゲーム画面の上に被せる）
- 結果テキストは大きく中央配置
- 勝者のプレイヤー色で装飾
- Player 1（id=0）視点で "Victory!" / "Defeat!" を表示
- draw の場合は中立色で "Draw!"
- ボタンは 2 つ横並び

#### 5. `apps/web/src/App.svelte` — 画面遷移ロジック

```ts
// 画面状態: 'title' | 'game' | 'result'
// Title.svelte: start → 'game' に遷移、ゲームを初期化
// ゲーム中: state.result !== null → 'result' に遷移
// ResultDialog.svelte:
//   rematch → 'game' に遷移（ゲーム再初期化）
//   title → 'title' に遷移（ゲーム破棄）
```

- 既存のゲーム初期化ロジックを関数化して再利用可能にする
- 画面遷移時に PixiJS のステージやリスナーを適切にクリーンアップ
- result 検出は `onRender` 内で `cur.result !== null` をチェック

### 実装要件
1. **`core/sim` 内は決定論厳守** — プレイヤー走査は id 昇順（CLAUDE.md §4.3）
2. **Svelte コンポーネントは `apps/web/src/ui/` 配下** — Pixi を直接 import しない（CLAUDE.md §4.6）
3. **App.svelte が UI とゲームの橋渡し** — screen state で条件分岐
4. **既存の cities.ts レンダラー（createCityRenderer パターン）は変更不要**
5. **tick.ts は変更不要** — 空実装の `evaluateGameEnd` を埋めるだけ
6. **GameResult 型は既に定義済み** — types.ts の変更不要

### テスト計画

#### `packages/core/src/sim/steps/evaluate-game-end.test.ts`（新規）

- 都市 0 + ユニット 0 のプレイヤーが alive=false になる
- 都市 0 でもユニットありなら alive のまま
- 全都市を 1 プレイヤーが所有 → domination 勝利
- 全敵プレイヤー脱落 → annihilation 勝利
- タイムアウト（tick >= 36000）で都市数多い方が timeout 勝利
- タイムアウトで都市数同数 → draw
- result が既にセット済みなら何もしない
- ゲーム開始直後（両者都市・ユニットあり）で result が null のまま

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を sim 内で使用
* `Map`/`Set` のイテレーション順に依存するコード
* `for...in` の使用
* `core/sim` 内で `async/await`、`Promise`、`setTimeout`
* Svelte コンポーネント内で `pixi.js` を直接 import
* 既存テスト（core 86件 + maps 8件 + web 9件 = 103件）を壊す

### 受け入れ基準
- [ ] 片方のプレイヤーの都市・ユニットが全て消えると勝敗が確定する
- [ ] 全都市占領で domination 勝利が発生する
- [ ] 20分（36000 tick）到達で timeout 勝利 or draw が発生する
- [ ] result 確定後に result が上書きされない
- [ ] タイトル画面で "Start Game" → ゲーム開始
- [ ] ゲーム終了 → 結果画面（Victory/Defeat/Draw + 理由）表示
- [ ] "Rematch" で同マップ再戦
- [ ] "Title" でタイトル画面に戻る
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 103 件 + 新規テスト全て green）
- [ ] `pnpm --filter @war-of-dots/web dev` でタイトル → ゲーム → 結果 → タイトルの遷移が目視確認できる

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(sim,ui): add game end evaluation and result screen (P1-T12)
```

[本文に evaluate-game-end・Title・ResultDialog・画面遷移の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
