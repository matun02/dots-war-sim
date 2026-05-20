# TASKS.md — War of Dots クローン 作業手順書

> 本書は **Claude Code（および人間開発者）が順番に着手するタスクを定義**する。
> 各タスクは **そのまま Claude Code へ貼り付けて指示できる粒度** で記述する。
> 上位文書: `CLAUDE.md`（規約） / `DESIGN.md`（設計）

---

## 0. 使い方

### 0.1 Claude Code への渡し方（推奨フロー）
1. **新しい Claude Code セッションを開く**
2. **冒頭で必ず `CLAUDE.md` と `DESIGN.md` を読ませる**
   ```
   @CLAUDE.md と @DESIGN.md を読んでください。これに従って作業します。
   ```
3. **このファイルから 1 タスクを抜き出して投入する**
4. **タスク完了後、PR 化 → レビュー → マージ**
5. **次のタスクへ**

### 0.2 タスク 1 件のフォーマット
- **ID**: `P{phase}-T{task#}`
- **目的**: 何を達成するか
- **入力**: 前提・関連ファイル
- **作業内容**: やること（箇条書き）
- **成果物**: 作るべきファイル
- **受け入れ基準**: 機械的に検証可能な完了条件
- **見積**: 概算工数
- **Claude Code への指示文サンプル**: そのままコピペ可

### 0.3 マイルストーン
- **M0**: スケルトン完成（P1-T1〜T3） — ✅ 全完了 (2026-05-19)
- **M1**: ゲーム表示できる（P1-T4〜T7）
- **M2**: AI と対戦できる（P1-T8〜T12）
- **M3**: 公開済み（P1-T13〜T15）
- **M4**: Phase2 完了（P2-T1〜T6）
- **M5**: マルチプレイ動作（P3-T1〜T7）

---

# Phase 1: シングルプレイ MVP

## P1-T1: リポジトリ初期化 ✅ 完了 (2026-05-19, commit `bcd442d`)

- **目的**: pnpm workspace 構成のスケルトンを作る
- **入力**: `CLAUDE.md` の章 3（ディレクトリ構成）
- **作業内容**:
  1. `pnpm init` でルート package.json
  2. `pnpm-workspace.yaml` に `apps/*` と `packages/*` を登録
  3. `apps/web`: Vite + Svelte 5 + TypeScript テンプレ
  4. `packages/core`: tsconfig + Vitest 設定済みの空 package
  5. ルート `tsconfig.base.json` + 各 package が extends
  6. ルートに ESLint (flat config) + Prettier
  7. `.gitignore`, `README.md`, `LICENSE`(MIT)
  8. GitHub Actions: `pnpm install && pnpm typecheck && pnpm test` を走らせる CI
- **成果物**:
  - `pnpm-workspace.yaml`
  - `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.ts`, `src/App.svelte`
  - `packages/core/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts`
  - `.github/workflows/ci.yml`
  - ルート設定一式
- **受け入れ基準**:
  - [x] `pnpm install` が成功
  - [x] `pnpm -r typecheck` が pass
  - [x] `pnpm -r test` が pass（テスト 0 件のパッケージは `vitest run --passWithNoTests` を使う）
  - [x] `pnpm --filter @war-of-dots/web dev` で localhost で "Hello War of Dots" が見える
- **見積**: 半日
- **実績**: 半日（環境セットアップ込み）
- **学び**: `SETUP.md` §3 参照。corepack ではなく `npm install -g pnpm` 推奨（Windows 権限問題）、PowerShell 実行ポリシー設定が必須、`apps/web` の vitest は `--passWithNoTests` 必須。
- **Claude Code への指示文サンプル**:

```text
@CLAUDE.md @DESIGN.md @SETUP.md を読みました。これに従って P1-T1 を実装します。

pnpm workspaces で以下のスケルトンを作ってください。

1. ルート: package.json, pnpm-workspace.yaml, tsconfig.base.json, .gitignore, README.md, LICENSE(MIT)
2. apps/web (= @war-of-dots/web): Vite + Svelte 5 + TypeScript（strict）、entry が "Hello War of Dots" を表示するだけ
3. packages/core (= @war-of-dots/core): TypeScript only ライブラリ、Vitest 設定済み、src/index.ts でダミー関数 export
4. ESLint flat config + Prettier をルートに
5. GitHub Actions: ci.yml で pnpm install → typecheck → test

完了基準:
- pnpm install が成功
- pnpm -r typecheck pass
- pnpm -r test pass（テスト 0 件のパッケージは vitest run --passWithNoTests）
- pnpm --filter @war-of-dots/web dev で表示できる

ファイルは UTF-8、改行 LF。
着手前に変更予定ファイルの一覧を提示してください。
```

---

## P1-T2: 決定論 RNG 実装 ✅ 完了 (2026-05-19, commit `9d6f2d9`)

- **目的**: ゲーム全体の決定論基盤を作る
- **入力**: `DESIGN.md` 章 6
- **作業内容**:
  1. `packages/core/src/rng.ts` に `Rng` クラス（mulberry32）
  2. `next()`, `int(max)`, `state()`, `Rng.restore(state)` を実装
  3. `packages/core/src/rng.test.ts`:
     - 同 seed で 1000 個の乱数列が完全一致
     - `state()` 経由で復元可能
     - `int(10)` が [0, 9] の整数を返す
- **成果物**: `rng.ts`, `rng.test.ts`
- **受け入れ基準**:
  - [x] `pnpm --filter core test` が全 pass
  - [x] テストカバレッジ rng.ts 100%
- **見積**: 半日
- **実績**: 30 分
- **学び**: DESIGN.md §6.1 の `(r as any).a` は `any` 禁止規約に抵触するため、`restore()` は `new Rng(s)` で代替（`>>> 0` は冪等なので同一動作）。esbuild が `-2 ** 31` をパースできないため `-(2 ** 31)` に括弧が必要。`@vitest/coverage-v8` は vitest と同バージョンを指定する必要がある。
- **Claude Code への指示文サンプル**:

```text
P1-T2 を実装します。

packages/core/src/rng.ts に mulberry32 ベースの決定論 RNG を実装してください。

要件:
- class Rng with constructor(seed: number)
- next(): number → [0, 1)
- int(maxExclusive: number): number → [0, maxExclusive) の整数
- state(): number → 現在の内部状態を返す
- static restore(s: number): Rng → 状態から復元

DESIGN.md 章 6 のサンプル実装を参照。

テスト packages/core/src/rng.test.ts:
- 同 seed → 1000 個目までの乱数列が一致
- restore() で完全に同じ続きが取れる
- int() の境界（0, max-1）が出ること
- Math.random は一切使わない

完了したら pnpm --filter core test を走らせて結果を貼ってください。
```

---

## P1-T3: ゲーム状態の型定義 ✅ 完了 (2026-05-19, commit `b1f7fb7`)

- **目的**: 共有型を定める。実装前のスキーマ確定
- **入力**: `DESIGN.md` 章 3
- **作業内容**:
  1. `packages/core/src/sim/types.ts` に `DESIGN.md` の型を実装
  2. Branded ID は型レベルのみ（ランタイムコスト 0）
  3. `Vec2`, `Terrain`, `UnitKind`, `Player`, `City`, `Unit`, `MapDef`, `GameState`, `Command`, `InputFrame`, `GameResult`
  4. 全て **JSON シリアライズ可能**（クラス・関数を含まない）
  5. `index.ts` から re-export
- **成果物**: `types.ts`, `sim/index.ts`
- **受け入れ基準**:
  - [x] typecheck pass
  - [x] `JSON.stringify(emptyGameState)` が正しく動く（簡単なテストで確認）
- **見積**: 半日
- **実績**: 15 分
- **学び**: DESIGN.md では `MapDef.terrain` を `Uint8Array` としているが、`Uint8Array` は `JSON.stringify` で `{"0":0,"1":0,...}` になり非可搬。`number[]` に変更して JSON ラウンドトリップを保証した。`TERRAIN_INDEX` 定数を追加し terrain 列挙子と数値の対応を型安全に管理。
- **Claude Code への指示文サンプル**:

```text
P1-T3 を実装します。

DESIGN.md 章 3 の型定義を packages/core/src/sim/types.ts に書き起こしてください。

- Branded ID: EntityId, CityId, PlayerId
- Vec2, Terrain, UnitKind
- Player, City, Unit, MapDef, GameState
- Command, InputFrame, GameResult

注意:
- クラス禁止、関数禁止、interface または type のみ
- 全フィールド JSON シリアライズ可能（Date, Map, Set, Function 禁止）
- terrain は Uint8Array（width*height）

packages/core/src/sim/types.test.ts で:
- 空の GameState を作って JSON.stringify → JSON.parse でラウンドトリップできること
(Uint8Array は Array.from に変換するヘルパも用意)

完了したら typecheck と test を走らせて結果を貼ってください。
```

---

## P1-T4: 純関数 tick の骨格 ✅ 完了 (2026-05-19, commit `7488397`)

- **目的**: tick の orchestrator と空のステップ関数群
- **入力**: `DESIGN.md` 章 5
- **作業内容**:
  1. `packages/core/src/sim/tick.ts`
  2. `core/sim/steps/` に各ステップの空実装
     - `apply-inputs.ts`, `recompute-paths.ts`, `move-units.ts`, `resolve-combat.ts`, `remove-dead.ts`, `update-city-capture.ts`, `produce-units.ts`, `evaluate-game-end.ts`
  3. `tick(state, inputs, rng)` は state を deep clone してから各ステップを呼び、tick++ する
  4. テスト:
     - 空入力で 100 tick 回しても crash しない
     - tick 値がインクリメントされる
     - 同じ初期状態 + 同じ inputs で 1000tick 回すと **JSON.stringify が完全一致**
- **成果物**: `tick.ts`, `steps/*.ts`, `tick.test.ts`
- **受け入れ基準**:
  - [x] 決定論テスト pass
  - [x] 各ステップは空でも呼ばれていることをスパイで確認
- **見積**: 1 日
- **実績**: 30 分
- **学び**: vitest の `vi.spyOn` は ESM namespace import に対しても正常に動作する（vitest がモジュールを書き換え可能にするため）。`structuredClone` による deep clone で immutability を保証。`resolveCombat` と `produceUnits` のみ `Rng` 引数を取る設計（将来乱数を使うステップ）。
- **Claude Code への指示文サンプル**:

```text
P1-T4 を実装します。

packages/core/src/sim/tick.ts に純関数 tick を実装してください。

シグネチャ:
function tick(state: GameState, inputs: readonly InputFrame[], rng: Rng): GameState

実装:
1. const s = structuredClone(state); s.tick++;
2. 以下の順で steps/*.ts の関数を呼ぶ（中身は今は空で OK）
   - applyInputs(s, inputs)
   - recomputePaths(s)
   - moveUnits(s)
   - resolveCombat(s)
   - removeDead(s)
   - updateCityCapture(s)
   - produceUnits(s)
   - evaluateGameEnd(s)
3. return s

各 step は packages/core/src/sim/steps/<name>.ts に export。
中身は console.log なし、空でよい（後の T で埋める）。

テスト packages/core/src/sim/tick.test.ts:
- 空 state（空マップ・空プレイヤー・空ユニット）を作るヘルパ makeEmptyState() を用意
- tick を 100 回回しても throw しないこと
- state.tick が 100 になっていること
- 決定論性: 同 state + 同 inputs + 同 seed → 1000 tick 後の JSON.stringify が完全一致

★MUST NOT: Math.random, Date.now, setTimeout 等を使わない
```

---

## P1-T5: ゲームループ（クライアント側） ✅ 完了 (2026-05-20, commit `12f1fab`)

- **目的**: 30Hz tick + RAF render の骨格
- **入力**: `DESIGN.md` 章 4
- **作業内容**:
  1. `apps/web/src/game/loop.ts`
  2. `start()`, `stop()`, `pause()`, `resume()` API
  3. 内部で accumulator パターン
  4. tick 関数を引数で受け取る（依存逆転）
  5. render コールバックも引数
  6. テスト: 仮想時間で 1 秒分回したら tick が 30 回呼ばれること（vitest の fake timers）
- **成果物**: `loop.ts`, `loop.test.ts`
- **受け入れ基準**:
  - [x] 単体テスト pass
  - [x] 100ms 経過で 3 回 tick が呼ばれる（fake timer で検証）
- **見積**: 半日
- **実績**: 30 分
- **学び**: vitest の fake timers の `requestAnimationFrame` は 16ms 間隔で発火するため、テストでは手動 RAF モックで正確なタイムスタンプ制御が必要。IEEE 754 浮動小数点の tick 境界誤差（`100 - 2*(1000/30) < 1000/30`）は accumulator に 1e-6 epsilon ガードで対処。jsdom を `apps/web` の devDependency に追加し `vite.config.ts` で `test.environment: 'jsdom'` を設定。

```text
P1-T5 を実装します。

apps/web/src/game/loop.ts に固定 30Hz の game loop を実装してください。

API:
export interface LoopOptions {
  tickRateHz: number;
  onTick: () => void;     // 1 tick 分の処理
  onRender: (alpha: number) => void;
}
export function createLoop(opts: LoopOptions): {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
};

要件:
- accumulator パターン（DESIGN.md 章 4.2 参照）
- 1 frame で最大 5 tick まで（MAX_FRAME_DT = 250ms 相当）
- performance.now() を使うのは loop.ts 内部だけ（tick 関数の外）

テスト apps/web/src/game/loop.test.ts:
- vi.useFakeTimers() で仮想時間
- 1000ms 進めたら onTick が 30 回呼ばれる
- pause 中は onTick が呼ばれない
- resume で再開する

JSDOM 環境（vitest 設定）が必要なら設定追加して。
```

---

## P1-T6: PixiJS ステージ初期化と描画 ✅ 完了 (2026-05-20, commit `4b8f443`)

- **目的**: 画面に Pixi の Canvas + 背景 + グリッドを描く
- **入力**: なし（独立）
- **作業内容**:
  1. `pnpm --filter web add pixi.js@8`
  2. `apps/web/src/game/render/stage.ts` で Pixi Application 初期化
  3. `apps/web/src/game/render/grid.ts` でグリッド描画（64x36, 1セル=20px）
  4. `App.svelte` に Canvas をマウント
  5. リサイズ対応（autoDensity, resolution: window.devicePixelRatio）
- **成果物**: `stage.ts`, `grid.ts`, `App.svelte` 更新
- **受け入れ基準**:
  - [x] `pnpm --filter web dev` で起動し、暗背景 + 薄いグリッドが見える
  - [x] ウィンドウリサイズで追従する
- **見積**: 半日
- **実績**: 20 分
- **学び**: PixiJS v8 では `new Application()` 後に `await app.init(options)` を呼ぶ（v7 とは異なる非同期初期化）。Graphics API も v8 で変更あり: `setStrokeStyle()` + `moveTo/lineTo` + `stroke()` のチェーン。CLAUDE.md §4.5 の Pixi import 制約は `type` re-export（`export type { Application } from 'pixi.js'`）で render/ 外にも型だけ公開可能。

```text
P1-T6 を実装します。

pnpm --filter web add pixi.js@8 を実行してから:

1. apps/web/src/game/render/stage.ts
   - createStage(canvasEl: HTMLCanvasElement) で Pixi.Application v8 初期化
   - 背景色 #1a1a1a
   - autoDensity, resolution = devicePixelRatio
   - リサイズハンドラ

2. apps/web/src/game/render/grid.ts
   - drawGrid(app, width=64, height=36, cellPx=20)
   - 薄いグレー線 (#2a2a2a) で格子

3. apps/web/src/App.svelte 更新:
   - <canvas bind:this={el}/> をマウント
   - onMount で createStage + drawGrid
   - onDestroy で app.destroy()

★MUST: Pixi の import は render/ 配下のみ。Svelte からは createStage 経由で呼ぶ。

完了したら dev サーバを立てて目視確認した旨を報告してください。
```

---

## P1-T7: マップ JSON 定義と読み込み ✅ 完了 (2026-05-20, commit `335a662`)

- **目的**: 最初のテストマップを定義し、レンダリングで地形を表示
- **入力**: `DESIGN.md` 章 1.3, 3
- **作業内容**:
  1. `packages/maps/` パッケージを追加
  2. `maps/src/index.ts` で `MapDef` を export
  3. `maps/src/data/first-blood.json` を作成（64x36, 5 都市、山あり）
  4. `maps/src/loader.ts`: JSON → MapDef、terrain は number[] → Uint8Array
  5. zod or valibot でスキーマ検証
  6. `apps/web/src/game/render/terrain.ts` で地形タイルを色分け描画
- **成果物**: `packages/maps/*`, `terrain.ts`
- **受け入れ基準**:
  - [x] dev サーバでマップが見える（緑=平地、灰=山、青=水、深緑=森）
  - [x] スキーマ検証 pass
- **見積**: 1 日
- **実績**: 30 分
- **学び**: valibot v1 では `v.pipe()` でバリデーションチェーンを構築。JSON re-export は `export { default as name } from './data/file.json'` で可能（`resolveJsonModule: true` 前提）。PixiJS v8 の `Graphics.rect().fill()` で個別セルを塗る方式は 64x36 = 2304 セルでも問題なく動作。`svelte-check` はパッケージの内部パス（`@pkg/src/data/file.json`）を解決できないため、パッケージの公開 API 経由で re-export が必要。

```text
P1-T7 を実装します。

1. packages/maps パッケージを追加（pnpm-workspace.yaml に追加済みのはず）
   - src/loader.ts: loadMap(json: unknown): MapDef
   - src/data/first-blood.json: 64x36 マップ。RLE 圧縮はまだしない。普通に配列。
     都市 5 個（中央 1、四隅近くに 4）、山が中央に帯状、他は plain。
   - src/index.ts でエクスポート
   - valibot で型検証（または zod、どちらか軽い方）

2. apps/web/src/game/render/terrain.ts
   - drawTerrain(stage, map): セルごとに色塗り
     plain=#1e2d1e, forest=#0e3a0e, mountain=#3a3a3a, water=#0e2740
   - 都市は別レイヤーで白い円 + 所有色枠（所有なしならグレー）

3. apps/web/src/App.svelte で loadMap('first-blood') して terrain を描画

完了基準:
- map JSON のスキーマ違反でエラーになる
- 5 都市と山地が画面に見える
```

---

## P1-T8: ユニット生成と直線移動（戦闘前） ✅ 完了 (2026-05-20, commit `efafc60`)

- **目的**: 都市が時間経過でユニットを生み出し、目標地点へ直線移動するだけの状態
- **入力**: `DESIGN.md` 章 1.5, 5
- **作業内容**:
  1. `core/sim/steps/produce-units.ts` を実装
     - `produceCooldownTicks` が 0 になったら新 unit を追加
     - 補給枠超過時は生産しない
     - 占領クールダウン中は生産しない
  2. `core/sim/steps/move-units.ts` の **直線版**
     - `unit.goal` があれば、速度 * TICK_DT で goal へ直進
     - goal に十分近づいたら停止
  3. `core/sim/init.ts` で MapDef → 初期 GameState を作るヘルパ
  4. `apps/web/src/game/render/units.ts`
     - 全ユニットを所有色の小円で描画（補間あり）
     - PixiJS の `ParticleContainer` を使う
- **成果物**: `produce-units.ts`, `move-units.ts`, `init.ts`, `units.ts`
- **受け入れ基準**:
  - [x] dev で起動するとプレイヤー0/1 の都市から数秒ごとに dot が湧く
  - [x] 各 unit の goal を一時的にハードコードで中央に向ければ移動して停止する
  - [x] 単体テスト: 補給上限を超えて生産しないこと、クールダウン中は生産しないこと
- **見積**: 1〜2 日
- **実績**: 30 分
- **学び**: PixiJS v8 の `generateTexture` は `Texture` を返し `RenderTexture` ではない（型が変更された）。`structuredClone` で prev/cur の immutability パターンは tick.ts と同じ。クールダウンのオフバイワン: cooldown=60 は「60 回デクリメント後に初めて 0 になる」ので、初回生産から次の生産まで 62 呼び出し（初回生産 + 60 デクリメント + 次の 0 チェックで生産）。Sprite プールパターンで可変数のユニットを効率的に描画。

```text
P1-T8 を実装します。

【sim 側】
1. core/sim/steps/produce-units.ts:
   - 各 city について、所有プレイヤーがいて produceCooldownTicks <= 0 で
     supplyUsed < 5 なら 1 ユニット生成。
   - 速度や HP は kind = light のデフォルト値（DESIGN.md 1.4）
   - 生成後、produceCooldownTicks = produceIntervalTicks にリセット
   - 占領中（capturingPlayer != null かつ進行中）は生産停止

2. core/sim/steps/move-units.ts（直線版・パスファインディングは P1-T10 で導入）:
   - unit.goal があれば、現在位置から goal へ単位ベクトル × speed × (TICK_DT_MS/1000)
   - 距離 < 0.05 セルで停止（goal = null, path = null）

3. core/sim/init.ts:
   - createInitialState(map: MapDef, players: Player[], seed: number): GameState
   - players[i] に対応する spawn city を所有設定
   - 全 unit array 空、tick=0

【client 側】
4. apps/web/src/game/render/units.ts:
   - drawUnits(app, prevState, curState, alpha):
     ユニットの x = lerp(prev.pos.x, cur.pos.x, alpha) * cellPx
     PIXI.Graphics or ParticleContainer + Texture（Graphics.circle を一度 RenderTexture 化）
   - 所有プレイヤーで色分け

5. game/loop.ts に sim と render を組み込む
   tick: () => { state = tickFn(state, [], rng) }
   render: (alpha) => { drawTerrain; drawCities(state); drawUnits(prev, cur, alpha) }
   prev/cur は loop 内で保持

テスト:
- produce-units.test.ts: 5 ユニット達成後は増えない
- produce-units.test.ts: クールダウンの間隔通り
- move-units.test.ts: 1 秒で speed セル進む
```

---

## P1-T9: 入力（矩形選択 + 移動命令）

- **目的**: マウスでユニットを選択して移動命令を出せる
- **入力**: `DESIGN.md` 章 12.2
- **作業内容**:
  1. `apps/web/src/game/input/selection.ts`
     - 矩形ドラッグ開始/更新/終了
     - canvas 座標 → world 座標 → セル座標
     - 選択結果は EntityId[]
  2. `apps/web/src/game/input/commands.ts`
     - 右クリック → `Command { type:"move", ids, to }` を InputFrame に積む
  3. `apps/web/src/stores/selection.ts`（Zustand or Svelte store）
     - 現在選択中の ID 集合（UI 描画用のみ）
  4. `core/sim/steps/apply-inputs.ts`:
     - Command を読んで該当 unit の `goal` を更新
- **成果物**: `selection.ts`, `commands.ts`, `selection store`, `apply-inputs.ts`
- **受け入れ基準**:
  - [ ] ドラッグで複数選択、右クリックで全員が直線移動
  - [ ] 選択中ユニットの周りに枠が表示される
- **見積**: 1〜1.5 日

---

## P1-T10: A* パスファインディング（地形回避）

- **目的**: 山を避けて目的地へ向かう
- **入力**: `DESIGN.md` 章 7
- **作業内容**:
  1. `packages/core/src/pathfinding/binary-heap.ts`（自前 min-heap）
  2. `packages/core/src/pathfinding/astar.ts`
     - `findPath(map, start, goal, kind): Vec2[] | null`
     - 8 方向、対角コスト √2（int で 14 / 10）
     - light/heavy の通行コスト差を反映
     - tie-break: `(y * width + x)` 昇順
  3. `core/sim/steps/recompute-paths.ts`:
     - `unit.goal` が変わっていれば再計算（dirty フラグ管理）
     - 1 tick あたり最大 8 経路まで（公平性のため shuffle はせず id 昇順）
  4. `move-units.ts` を path 追従版に差し替え
- **成果物**: heap, astar, recompute-paths 改修, move-units 改修, テスト
- **受け入れ基準**:
  - [ ] 山を迂回する
  - [ ] 同 start/goal で 100 回呼んで結果が完全一致（決定論）
  - [ ] 到達不能で null を返す
  - [ ] 性能: 64x36 上で 1 経路 < 2ms
- **見積**: 2 日

```text
P1-T10: A* パスファインディングを実装します。

参照: DESIGN.md 章 7

1. packages/core/src/pathfinding/binary-heap.ts
   - class BinaryHeap<T> with custom comparator
   - push, pop, size, peek
   - テスト: ランダム100要素を入れて pop が昇順

2. packages/core/src/pathfinding/astar.ts
   export function findPath(
     map: MapDef,
     start: Vec2,
     goal: Vec2,
     kind: UnitKind
   ): Vec2[] | null;
   
   - 8 方向、対角コスト = ストレートの √2 を整数化して 14 / 10
   - 通行コスト（light/heavy で異なる、DESIGN.md 7.2）
   - heuristic: オクタイル
   - 同 f スコアのときは (y * w + x) 昇順で取り出す（決定論）
   - return: [start, ..., goal] の Vec2 配列 (start 含む)、到達不能 null

3. テスト packages/core/src/pathfinding/astar.test.ts:
   - 障害物なしで直線
   - 山を迂回（壁マップを定義）
   - 到達不能で null（島マップ）
   - 同入力で 100 回呼んで JSON.stringify 一致
   - heavy が水を通れない

4. core/sim/steps/recompute-paths.ts:
   - unit.goal != null && (unit.path == null || lastGoal !== goal) なら再計算
   - 1 tick あたり最大 8 件まで（id 昇順）

5. core/sim/steps/move-units.ts を path 追従版に差し替え:
   - path[0] を target としてそこへ進む、到達したら shift
   - path 空なら停止 (goal=null)

完了基準: 上記テスト pass + 既存の決定論テスト（tick）が壊れていないこと
```

---

## P1-T11: 戦闘・死亡処理・都市占領

- **目的**: 敵接触で減衰、都市が奪える
- **入力**: `DESIGN.md` 章 1.6, 1.7
- **作業内容**:
  1. `core/sim/spatial-hash.ts`:
     - グリッド分割の空間ハッシュ（セル幅 = 1 cell）
     - 近傍検索 O(1) 平均
  2. `core/sim/steps/resolve-combat.ts`:
     - 各 unit が `attackRange` 内で最寄りの敵を選ぶ（id 昇順 tie-break）
     - `attackCooldownTicks <= 0` なら 1 攻撃
     - 攻撃: target.hp -= attacker.attack; cooldown = attackIntervalTicks
  3. `core/sim/steps/remove-dead.ts`:
     - hp <= 0 を units から除去
     - 該当 unit の homeCity.supplyUsed -= cost
  4. `core/sim/steps/update-city-capture.ts`:
     - 都市マスにいる unit を陣営別にカウント
     - 仕様: DESIGN.md 1.6（2秒中立化、1秒で占領）
- **成果物**: spatial-hash + 各 step + テスト
- **受け入れ基準**:
  - [ ] 2 ユニットが接触すると 1秒ほどで両方死ぬ（HP=1, attack=1, 0.5s 間隔）
  - [ ] 中立都市にユニットが 30 tick（1 秒）滞在で占領される
  - [ ] 敵都市は 60 + 30 tick で奪える
  - [ ] 単体テスト: 占領進捗のリセット（敵が混在したら止まる）
- **見積**: 2 日

---

## P1-T12: 勝敗判定 + 結果画面

- **目的**: 勝ち負けが決まる
- **入力**: `DESIGN.md` 章 1.1
- **作業内容**:
  1. `core/sim/steps/evaluate-game-end.ts`:
     - 都市数 0 && unit 数 0 で死亡
     - 勝利側が 1 名なら `state.result = { type:"victory", ... }`
     - 制限時間（36000 tick = 20 分）到達で都市数比較
  2. `apps/web/src/ui/ResultDialog.svelte`:
     - state.result が出たら表示
     - "Rematch" / "Title" ボタン
  3. `apps/web/src/ui/Title.svelte`:
     - シンプルなタイトル → スタートで対戦開始
- **成果物**: evaluate-game-end + Title + ResultDialog + ルーティング
- **受け入れ基準**:
  - [ ] AI 抜きでも、片方の都市・ユニットを全部消す疑似テストで結果が出ること
  - [ ] タイトル → ゲーム → 結果 → タイトル の遷移
- **見積**: 1 日

---

## P1-T13: AI v0（ルールベース）

- **目的**: AI と試合になる
- **入力**: `DESIGN.md` 章 9.1
- **作業内容**:
  1. `apps/web/src/game/ai/controller.ts`:
     - `AIController { update(state: GameState): Command[] }`
     - 仕様（DESIGN 9.1）通り、ターゲット選定 + 派遣
  2. AI の出力 Command は普通の InputFrame として tick に渡す
  3. Easy/Normal/Hard の難易度パラメータ
- **成果物**: AI Controller + テスト（中立都市があるなら必ず派遣する等の不変条件）
- **受け入れ基準**:
  - [ ] 起動 → AI 相手にプレイできる
  - [ ] Easy なら人間が勝ちやすい、Hard で苦戦する程度のバランス
- **見積**: 2 日

---

## P1-T14: リプレイ録画 / 再生

- **目的**: 試合をリプレイできる
- **入力**: `DESIGN.md` 章 10
- **作業内容**:
  1. `packages/core/src/replay.ts`:
     - `Replay` 型, `record()`, `playback()`
  2. tick ループ内で InputFrame を append（受信側でも）
  3. ローカル保存: idb-keyval で 20 件まで
  4. UI: 結果画面に "Save Replay" / "Watch Replay"
  5. 再生時は AI/人間入力をブロックして、Replay の inputs を流す
- **成果物**: replay.ts, idb store, UI ボタン, テスト（記録→再生で final state ハッシュ完全一致）
- **見積**: 2 日

---

## P1-T15: Cloudflare Pages デプロイ

- **目的**: URL を持つ
- **入力**: 公開済み Cloudflare アカウント
- **作業内容**:
  1. `pnpm --filter web build` で出力先 `apps/web/dist`
  2. `wrangler.toml` で Pages プロジェクト
  3. GitHub Actions `deploy.yml`:
     - main push でビルド → `cloudflare/wrangler-action` で Pages deploy
  4. README にプレイURL記載
- **成果物**: deploy.yml + README 更新
- **受け入れ基準**:
  - [ ] main に push すると 5 分以内に *.pages.dev で遊べる
  - [ ] FPS 60 安定、初回ロード < 5 秒
- **見積**: 半日

---

# Phase 2: AI 改善 / Heavy / 複数マップ

## P2-T1: Heavy ユニット
- light に加えて heavy を実装。地形通行制限を A* に反映。
- 補給スロット消費 2、生産時間 6 秒、HP 5, 攻撃 3。
- 都市の `production` で切り替え可能に。
- UI: 都市クリックで生産種別を切り替えるトグル。

## P2-T2: 影響マップ
- `core/sim/influence-map.ts` を実装（5tick ごと更新）
- 各陣営の `Int16Array` + ガウシアン拡散
- AI が利用、前線描画にも利用

## P2-T3: AI v1（影響マップベース）
- 押し込まれている境界を検出 → 押し返し
- 経済 / 軍事のバランス評価
- 難易度パラメータの再調整

## P2-T4: 前線描画
- マーチングスクエアで等高線生成
- PixiJS Graphics で薄い半透明線

## P2-T5: マップ追加（合計 5 枚）
- バリエーション: 中央橋、4 隅都市、海峡、回廊、ランダム生成例

## P2-T6: チュートリアル
- 最初の起動時のみ、操作説明オーバーレイ

---

# Phase 3: マルチプレイ（Lockstep）

## P3-T1: apps/server の追加
- Cloudflare Workers + Durable Objects プロジェクト
- `wrangler.toml`, `tsconfig`, ローカル `wrangler dev`

## P3-T2: WebSocket Echo
- DO で WS 受付 → broadcast の最小実装
- クライアントから接続できる

## P3-T3: マッチメイキング v0（合言葉ロビー）
- 4桁コードでロビー作成 / 参加
- KV で短時間保持

## P3-T4: Lockstep プロトコル
- DESIGN.md 章 11.2
- 入力中継 + 2 tick 遅延適用

## P3-T5: 決定論検証強化
- `core/sim/hash.ts` の実装
- 30tick ごとに hash 送信 → DO で照合
- 不一致で全員に desync イベント

## P3-T6: 切断 / 再接続
- 連続入力なし N tick で AI 代行 or 敗北
- 短時間（10秒）の再接続を許可

## P3-T7: Anti-cheat 基本
- 入力の妥当性チェック（自分の unit しか操作できない）
- レート制限

---

# Phase 4: ランキング / リプレイ共有 / 観戦

## P4-T1: 認証（匿名 UUID + Auth.js OAuth）
## P4-T2: D1 でランキング（Glicko-2）
## P4-T3: R2 にリプレイアップロード + 共有 URL
## P4-T4: リプレイ閲覧 UI（再生・倍速・早送り）
## P4-T5: ライブ観戦（read-only WS）
## P4-T6: マップエディタ v0

---

# Phase 5: 本番運用

## P5-T1: Sentry 統合
## P5-T2: PostHog 統合
## P5-T3: Cloudflare Web Analytics
## P5-T4: パフォーマンスプロファイリング
## P5-T5: Server-side replay validation（anti-cheat 強化）
## P5-T6: 利用規約 / プライバシーポリシー

---

# 付録 A: タスク投入時のテンプレ

```text
@CLAUDE.md @DESIGN.md @TASKS.md を読みました。

これから {TASK_ID}: {TITLE} を実装します。

[TASKS.md の該当セクションをそのまま貼る]

着手前に:
1. 変更予定ファイル一覧
2. テスト計画
3. 想定される影響範囲

を提示してください。承認したら実装に進んでください。
```

---

# 付録 B: PR 提出時のテンプレ

```md
## TASK
{TASK_ID}: {TITLE}

## 何をするPRか


## なぜ必要か


## 動作確認
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] 手動: ...

## 影響範囲


## スクショ / 動画


## DoD
- [ ] TASKS.md の受け入れ基準を満たす
- [ ] CLAUDE.md 規約に違反していない
- [ ] core/sim を変更した場合は決定論テストを更新 or 維持
```

---

# 付録 C: トラブルシュート

| 症状 | 確認 |
|---|---|
| 決定論テストが落ちる | sim 内で Math.random / Date.now / Map iteration / Set iteration / Array.sort の不安定性が無いか |
| マルチプレイで desync | hash がいつから不一致か → 該当 tick の入力差を特定 |
| パスファインダーが重い | キャッシュ有無、heap の比較関数、再計算頻度 |
| FPS が出ない | ParticleContainer 使用、不要な clone、devtools profiler |
| バンドルが大きい | vite build --report、tree shaking、code split |

---

## 変更履歴

| 日付 | バージョン | 変更 |
|---|---|---|
| 2026-05-19 | 1.0.0 | 初版作成 |
| 2026-05-19 | 1.0.1 | P1-T1 完了マーク、`--filter` を `@war-of-dots/web` フルネームに統一、vitest `--passWithNoTests` の注記追加、SETUP.md 参照を指示文サンプルに追加 |
| 2026-05-19 | 1.0.2 | P1-T2 完了マーク（commit `9d6f2d9`）、P1-T3 完了マーク（commit `b1f7fb7`）、M0 マイルストーン全完了 |
| 2026-05-19 | 1.0.3 | P1-T4 完了マーク（commit `7488397`）。tick orchestrator + 8 空ステップ + テスト 5 件。M1 進行中 |
| 2026-05-20 | 1.0.4 | P1-T5 完了マーク（commit `12f1fab`）。ゲームループ（accumulator パターン + スパイク対策）+ テスト 6 件 + jsdom 環境設定 |
| 2026-05-20 | 1.0.5 | Claude Code スキル 3 件追加（`skill-update-tasks.md`, `skill-update-claude.md`, `skill-doc-commit.md`） |
| 2026-05-20 | 1.0.6 | P1-T6 完了マーク（commit `4b8f443`）。PixiJS v8 ステージ初期化 + グリッド描画 + リサイズ対応 |
| 2026-05-20 | 1.0.7 | P1-T7 完了マーク（commit `335a662`）。maps パッケージ + valibot バリデーション + 地形・都市描画 + テスト 8 件。M1 進行中 |
| 2026-05-20 | 1.0.8 | P1-T8 完了マーク（commit `efafc60`）。ユニット生産・直線移動・ユニット描画 + ゲームループ統合。constants.ts + init.ts + 新規テスト 17 件（合計 53 件）。M1 完了、M2 進行中 |
