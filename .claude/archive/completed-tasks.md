# 完了タスク詳細アーカイブ

> TASKS.md から分離した完了済みタスクの全文。
> 指示文サンプル・学び・実績を含む。必要時のみ参照。

---

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
- **学び**: DESIGN.md §6.1 の `(r as any).a` は `any` 禁止規約に抵触するため、`restore()` は `new Rng(s)` で代替。esbuild が `-2 ** 31` をパースできないため `-(2 ** 31)` に括弧が必要。`@vitest/coverage-v8` は vitest と同バージョンを指定する必要がある。

---

## P1-T3: ゲーム状態の型定義 ✅ 完了 (2026-05-19, commit `b1f7fb7`)

- **目的**: 共有型を定める。実装前のスキーマ確定
- **入力**: `DESIGN.md` 章 3
- **作業内容**:
  1. `packages/core/src/sim/types.ts` に `DESIGN.md` の型を実装
  2. Branded ID は型レベルのみ（ランタイムコスト 0）
  3. `Vec2`, `Terrain`, `UnitKind`, `Player`, `City`, `Unit`, `MapDef`, `GameState`, `Command`, `InputFrame`, `GameResult`
  4. 全て **JSON シリアライズ可能**
  5. `index.ts` から re-export
- **成果物**: `types.ts`, `sim/index.ts`
- **受け入れ基準**:
  - [x] typecheck pass
  - [x] `JSON.stringify(emptyGameState)` が正しく動く
- **見積**: 半日
- **実績**: 15 分
- **学び**: `MapDef.terrain` を `Uint8Array` → `number[]` に変更して JSON ラウンドトリップを保証。`TERRAIN_INDEX` 定数を追加。

---

## P1-T4: 純関数 tick の骨格 ✅ 完了 (2026-05-19, commit `7488397`)

- **目的**: tick の orchestrator と空のステップ関数群
- **入力**: `DESIGN.md` 章 5
- **作業内容**:
  1. `packages/core/src/sim/tick.ts`
  2. `core/sim/steps/` に各ステップの空実装（8 ファイル）
  3. `tick(state, inputs, rng)` は state を deep clone してから各ステップを呼び、tick++ する
- **成果物**: `tick.ts`, `steps/*.ts`, `tick.test.ts`
- **受け入れ基準**:
  - [x] 決定論テスト pass
  - [x] 各ステップは空でも呼ばれていることをスパイで確認
- **見積**: 1 日
- **実績**: 30 分
- **学び**: `vi.spyOn` は ESM namespace import に対しても正常に動作。`structuredClone` による deep clone で immutability を保証。

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
- **成果物**: `loop.ts`, `loop.test.ts`
- **受け入れ基準**:
  - [x] 単体テスト pass
  - [x] 100ms 経過で 3 回 tick が呼ばれる（fake timer で検証）
- **見積**: 半日
- **実績**: 30 分
- **学び**: vitest fake timers の RAF は 16ms 間隔。IEEE 754 浮動小数点 tick 境界誤差は 1e-6 epsilon ガードで対処。jsdom を devDependency に追加。

---

## P1-T6: PixiJS ステージ初期化と描画 ✅ 完了 (2026-05-20, commit `4b8f443`)

- **目的**: 画面に Pixi の Canvas + 背景 + グリッドを描く
- **入力**: なし（独立）
- **作業内容**:
  1. `pnpm --filter web add pixi.js@8`
  2. `apps/web/src/game/render/stage.ts` で Pixi Application 初期化
  3. `apps/web/src/game/render/grid.ts` でグリッド描画（64x36, 1セル=20px）
  4. `App.svelte` に Canvas をマウント
  5. リサイズ対応
- **成果物**: `stage.ts`, `grid.ts`, `App.svelte` 更新
- **受け入れ基準**:
  - [x] `pnpm --filter web dev` で起動し、暗背景 + 薄いグリッドが見える
  - [x] ウィンドウリサイズで追従する
- **見積**: 半日
- **実績**: 20 分
- **学び**: PixiJS v8 では `new Application()` 後に `await app.init(options)` を呼ぶ。Graphics API も v8 で変更あり。

---

## P1-T7: マップ JSON 定義と読み込み ✅ 完了 (2026-05-20, commit `335a662`)

- **目的**: 最初のテストマップを定義し、レンダリングで地形を表示
- **入力**: `DESIGN.md` 章 1.3, 3
- **作業内容**:
  1. `packages/maps/` パッケージを追加
  2. `maps/src/index.ts` で `MapDef` を export
  3. `maps/src/data/first-blood.json` を作成（64x36, 5 都市、山あり）
  4. `maps/src/loader.ts`: JSON → MapDef
  5. valibot でスキーマ検証
  6. `apps/web/src/game/render/terrain.ts` で地形タイルを色分け描画
- **成果物**: `packages/maps/*`, `terrain.ts`
- **受け入れ基準**:
  - [x] dev サーバでマップが見える
  - [x] スキーマ検証 pass
- **見積**: 1 日
- **実績**: 30 分
- **学び**: valibot v1 では `v.pipe()` でバリデーションチェーン。`svelte-check` はパッケージの内部パスを解決できないため公開 API 経由で re-export が必要。

---

## P1-T8: ユニット生成と直線移動（戦闘前） ✅ 完了 (2026-05-20, commit `efafc60`)

- **目的**: 都市が時間経過でユニットを生み出し、目標地点へ直線移動する
- **入力**: `DESIGN.md` 章 1.5, 5
- **作業内容**:
  1. `core/sim/steps/produce-units.ts` を実装
  2. `core/sim/steps/move-units.ts` の直線版
  3. `core/sim/init.ts` で MapDef → 初期 GameState
  4. `apps/web/src/game/render/units.ts` — ユニット描画
- **成果物**: `produce-units.ts`, `move-units.ts`, `init.ts`, `units.ts`
- **受け入れ基準**:
  - [x] dev で起動するとプレイヤー0/1 の都市から dot が湧く
  - [x] 移動して停止する
  - [x] 補給上限・クールダウンのテスト
- **見積**: 1〜2 日
- **実績**: 30 分
- **学び**: PixiJS v8 の `generateTexture` は `Texture` を返す。クールダウンのオフバイワンに注意。Sprite プールパターンで効率的描画。

---

## P1-T9: 入力（矩形選択 + 移動命令） ✅ 完了 (2026-05-20, commit `688d854`)

- **目的**: マウスでユニットを選択して移動命令を出せる
- **入力**: `DESIGN.md` 章 12.2
- **作業内容**:
  1. `apps/web/src/game/input/selection.ts` — 矩形ドラッグ
  2. `apps/web/src/game/input/commands.ts` — 右クリック → Command
  3. `apps/web/src/stores/selection.ts`
  4. `core/sim/steps/apply-inputs.ts`
- **成果物**: `selection.ts`, `commands.ts`, `selection store`, `apply-inputs.ts`
- **受け入れ基準**:
  - [x] ドラッグで複数選択、右クリックで移動
  - [x] 選択中ユニットの周りに枠が表示される
- **見積**: 1〜1.5 日
- **実績**: 30 分
- **学び**: 選択状態は InputCollector 内に保持で十分。apply-inputs は in-place 変更。

---

## P1-T10: A* パスファインディング（地形回避） ✅ 完了 (2026-05-21, commit `d8441ec`)

- **目的**: 山を避けて目的地へ向かう
- **入力**: `DESIGN.md` 章 7
- **作業内容**:
  1. `packages/core/src/pathfinding/binary-heap.ts`（自前 min-heap）
  2. `packages/core/src/pathfinding/astar.ts` — 8方向、整数コスト、オクタイル h
  3. `core/sim/steps/recompute-paths.ts` — 1 tick あたり最大 8 経路
  4. `move-units.ts` を path 追従版に差し替え
- **成果物**: heap, astar, recompute-paths 改修, move-units 改修, テスト
- **受け入れ基準**:
  - [x] 山を迂回する
  - [x] 決定論（同入力で 100 回一致）
  - [x] 到達不能で null
  - [x] 性能: 64x36 で 1 経路 < 2ms
- **見積**: 2 日
- **実績**: 30 分
- **学び**: 整数コスト演算で非決定論を回避。TypedArray で高速。対角移動時は隣接 2 セルチェックが必要。

---

## P1-T11: 戦闘・死亡処理・都市占領 ✅ 完了 (2026-05-21, commit `eb5ef21`)

- **目的**: 敵接触で減衰、都市が奪える
- **入力**: `DESIGN.md` 章 1.6, 1.7
- **作業内容**:
  1. `core/sim/spatial-hash.ts` — 空間ハッシュ（セル幅 1）
  2. `core/sim/steps/resolve-combat.ts` — 最寄り敵攻撃、id 昇順 tie-break
  3. `core/sim/steps/remove-dead.ts` — hp <= 0 除去 + supplyUsed 解放
  4. `core/sim/steps/update-city-capture.ts` — 60tick 中立化 + 30tick 占領
- **成果物**: spatial-hash + 各 step + テスト
- **受け入れ基準**:
  - [x] 2 ユニット接触で両方死ぬ
  - [x] 中立都市 30 tick で占領
  - [x] 敵都市は 60 + 30 tick で奪える
  - [x] 占領進捗リセット
- **見積**: 2 日
- **実績**: 30 分
- **学び**: `noUncheckedIndexedAccess` で `T | undefined` 型。空間ハッシュは `EntityId[][]` で実装（Map/Set 不可）。

---

## P1-T12: 勝敗判定 + 結果画面 ✅ 完了 (2026-05-22, commit `e5be5aa`)

- **目的**: 勝ち負けが決まる + タイトル画面から結果画面への遷移フロー構築
- **入力**: `DESIGN.md` 章 1.1
- **作業内容**:
  1. `packages/core/src/sim/constants.ts` — `GAME_TIME_LIMIT_TICKS = 36000` 追加
  2. `packages/core/src/sim/steps/evaluate-game-end.ts` — domination/annihilation/timeout/draw 判定
  3. `apps/web/src/ui/Title.svelte` — タイトル画面
  4. `apps/web/src/ui/ResultDialog.svelte` — 結果オーバーレイ（Victory/Defeat/Draw）
  5. `apps/web/src/App.svelte` — 画面遷移ロジック（title → game → result → title/rematch）
- **成果物**: evaluate-game-end + Title + ResultDialog + 画面遷移 + テスト 8 件
- **受け入れ基準**:
  - [x] 片方のプレイヤーの都市・ユニットが全て消えると勝敗が確定する
  - [x] 全都市占領で domination 勝利が発生する
  - [x] 20分（36000 tick）到達で timeout 勝利 or draw が発生する
  - [x] result 確定後に result が上書きされない
  - [x] タイトル画面で "Start Game" → ゲーム開始
  - [x] ゲーム終了 → 結果画面表示
  - [x] "Rematch" で同マップ再戦
  - [x] "Title" でタイトル画面に戻る
  - [x] typecheck / lint / test 全 green
- **見積**: 1 日
- **実績**: 30 分
- **学び**: Svelte 5 では `createEventDispatcher` ではなく props callback でイベントを通知。`bind:this` の canvas は `$state` 不要（warning は無害）。テストで domination/annihilation テストケースを作る際、都市所有状態に注意（全都市所有で意図せず domination が発火する）。

---

## P1-T13: AI v0（ルールベース） ✅ 完了 (2026-05-22, commit `c617ac5`)

- **目的**: AI と試合になる
- **入力**: `DESIGN.md` 章 9.1, 9.3, 9.4
- **作業内容**:
  1. `apps/web/src/game/ai/controller.ts` — AIController factory + 難易度設定（easy/normal/hard）
  2. `apps/web/src/game/ai/controller.test.ts` — 8 テストケース
  3. `apps/web/src/App.svelte` — AI 統合（別 Rng インスタンス + onTick でコマンド合流）
- **成果物**: AI controller + テスト + App.svelte 統合
- **受け入れ基準**:
  - [x] 起動 → AI 相手にプレイできる
  - [x] AI が中立都市を狙ってユニットを派遣する
  - [x] AI が自都市を防衛しようとする
  - [x] AI のコマンドが InputFrame 経由で正しく tick に渡される
  - [x] 決定論テスト: 同一条件で同じ AI 行動
  - [x] typecheck / lint / test 全 green（合計 120 件）
- **見積**: 2 日
- **実績**: 20 分
- **学び**: AI の Rng は sim 用 Rng と別インスタンスにする（AI の思考は sim 外）。`import type` と `import` の使い分け — 型としてのみ使う場合は `import type` を使わないと `isolatedModules` 違反になる可能性あり。ターゲットスコアの sort で tie-break に city.id を使い全順序を保証。

---

## P1-T14: リプレイ録画 / 再生 ✅ 完了 (2026-05-22, commit `44ded2a`)

- **目的**: 試合中の全 InputFrame を記録し、試合終了後にリプレイとして保存・再生できるようにする
- **作業内容**:
  1. `packages/core/src/replay.ts` — Replay 型定義 + REPLAY_VERSION
  2. `packages/core/src/sim/hash.ts` — hashState() 決定論的 32bit 状態ハッシュ（XOR フォールド、id ソート済み）
  3. `apps/web/src/game/replay/recorder.ts` — ReplayRecorder（InputFrame バッファ）
  4. `apps/web/src/game/replay/player.ts` — ReplayPlayer（createInitialState + tick で状態再構築、seekTo 対応）
  5. `apps/web/src/game/replay/storage.ts` — IndexedDB 保存（idb-keyval、createdAt キー）
  6. `apps/web/src/App.svelte` — recorder 統合 + replay 画面 + 一時停止/再開
  7. `apps/web/src/ui/ResultDialog.svelte` — "Watch Replay" ボタン追加
- **成果物**: replay.ts + hash.ts + recorder + player + storage + UI 統合 + テスト 12 件
- **受け入れ基準**:
  - [x] 試合終了後にリプレイデータが IndexedDB に保存される
  - [x] ResultDialog に「Watch Replay」ボタンが表示される
  - [x] リプレイを再生すると同じ展開が再現される（決定論テスト）
  - [x] 再生中に一時停止/再開ができる
  - [x] 再生終了後に result 画面に戻る
  - [x] hashState が決定論的に動作する
  - [x] typecheck / lint / test 全 green（合計 132 件）
- **見積**: 2 日
- **実績**: 30 分
- **学び**: strict モードでは配列の `for (let i=0; ...)` インデックスアクセスが `possibly undefined` になる。`for...of` で回避。Rng クラスに reset メソッドがないため seekTo では新インスタンス生成で対応。idb-keyval の createStore で DB 名とストア名を分離指定。
