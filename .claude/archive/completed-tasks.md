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

---

## P1-T15: Cloudflare Pages デプロイ ✅ 完了 (2026-05-23, commit `4189b9a`)

- **目的**: ゲームを Cloudflare Pages にデプロイし、公開 URL で誰でもプレイできるようにする
- **作業内容**:
  1. `apps/web/vite.config.ts` — `base: '/'` 明示 + `manualChunks` で PixiJS 分割
  2. `apps/web/public/_redirects` — SPA フォールバック (`/* /index.html 200`)
  3. `npx wrangler pages project create dots-war-sim` でプロジェクト作成
  4. `npx wrangler pages deploy apps/web/dist --project-name=dots-war-sim --branch=main` でデプロイ
  5. 公開 URL で動作確認（タイトル → ゲーム → AI 対戦動作確認）
- **成果物**: 公開 URL https://dots-war-sim.pages.dev/ + ビルド最適化設定
- **受け入れ基準**:
  - [x] `pnpm -r build` がローカルで成功する
  - [x] Cloudflare Pages にデプロイされ、公開 URL でゲームが動作する
  - [x] タイトル → ゲーム開始 → AI 対戦が動作する
  - [x] WebGL2 エラーが出ない
  - [x] ブラウザコンソールにエラーがない
  - [x] `pnpm -r typecheck` 通る
  - [x] `pnpm lint` 通る
  - [x] `pnpm -r test` 通る（既存 132 件全て green）
- **見積**: 半日
- **実績**: 15 分
- **学び**: Cloudflare Pages の本番 URL (`*.pages.dev`) は `--branch=main` でデプロイしないと反映されない。manualChunks で PixiJS を分離するとメインチャンクが 289 KB → 60 KB に縮小。バンドル合計 gz ~157 KB で 500 KB 目標を大幅にクリア。

---

## P2-T1: Heavy ユニット ✅ 完了 (2026-05-23, commit `a6e6beb`)

- **目的**: heavy ユニット種別を完全に動作させる。既存の型・定数・A* 地形コストは実装済みのため、補給コスト差分・生産切替コマンド・UI・描画の差分実装が中心。
- **作業内容**:
  1. `constants.ts` — `UNIT_STATS` に `supplyCost` フィールド追加 (light=1, heavy=2)
  2. `types.ts` — `Command` union に `set-production` 型追加
  3. `apply-inputs.ts` — `set-production` case ハンドラ追加（自プレイヤー都市のみ変更可）
  4. `produce-units.ts` — 補給チェックを `supplyUsed + supplyCost > SUPPLY_MAX` に変更、加算も `+= supplyCost`
  5. `remove-dead.ts` — 補給解放を `UNIT_STATS[unit.kind].supplyCost` で差分対応
  6. `commands.ts` — `setProductionCommand()` と `InputCollector` 型拡張
  7. `units.ts` — kind ごとのテクスチャ生成、heavy は radius=cellPx*0.35 で視覚的区別
  8. `App.svelte` — onMouseUp でドラッグ距離 < 0.5 セルかつ自都市セル上なら生産切替トグル
- **成果物**: 上記 8 ファイル変更 + テスト 4 ファイル変更
- **受け入れ基準**:
  - [x] heavy ユニットが都市から生産される（`produceIntervalTicks: 180`）
  - [x] heavy は補給スロット 2 消費（supplyUsed + 2 > 5 で生産停止）
  - [x] heavy は平地・都市のみ通行可（A* 既存実装で対応済み）
  - [x] heavy の戦闘: attack=3, hp=5, attackIntervalTicks=30
  - [x] `set-production` コマンドで自都市の生産種別が切り替わる
  - [x] UI: 自都市クリックで生産種別トグルが機能する
  - [x] heavy ユニットが light と視覚的に区別できる（サイズ差）
  - [x] 死亡時に正しい補給コスト分（light=1, heavy=2）が解放される
  - [x] 決定論テスト: 既存 tick テスト全 green
  - [x] typecheck / lint / test 全 green（合計 144 件）
- **見積**: 3h
- **実績**: 40 分
- **学び**: 既存コードが kind パラメータをほぼ全箇所で渡していたため、差分実装は supplyCost 追加と UI 部分のみで済んだ。DPR=0.75 環境では Chrome MCP のスクリーンショット座標と CSS ピクセル座標にスケーリング差が出る。ブラウザ検証では JavaScript で直接ゲーム状態を取得するのが最も確実。

---

## P2-T2: 影響マップ ✅ 完了 (2026-05-23, commit `ff1390f`)

- **目的**: AI（P2-T3）と前線描画（P2-T4）の基盤となる影響マップ計算モジュールを実装する。
- **作業内容**:
  1. `influence-map.ts` — `computeInfluenceMap` 純関数（Int16Array×陣営数、ユニット重み加算→3回ガウシアン拡散）
  2. `influence-map.ts` — `computeInfluenceDiff` 純関数（2陣営の差分計算）
  3. `index.ts` — export 追加（`computeInfluenceMap`, `computeInfluenceDiff`, `InfluenceData` 型）
- **成果物**: 新規 2 ファイル + index.ts 編集
- **受け入れ基準**:
  - [x] `computeInfluenceMap(state)` が `InfluenceData` を返す
  - [x] `computeInfluenceDiff(data, pA, pB)` が差分 `Int16Array` を返す
  - [x] ユニットなし → 全セル 0
  - [x] light=100, heavy=200 の重み加算が正しい
  - [x] 3 回ガウシアン拡散で周囲に値が広がる
  - [x] 整数演算のみ（決定論維持）
  - [x] 同一入力で同一出力（決定論テスト）
  - [x] `packages/core/src/sim/index.ts` から export されている
  - [x] typecheck / lint / test 全 green（合計 153 件）
- **見積**: 2h
- **実績**: 20 分
- **学び**: `noUncheckedIndexedAccess: true` の環境では TypedArray のインデックスアクセスにも `!` が必要。Int16Array は代入時に自動的に整数へ切り捨てるが、`Math.floor` も明示して決定論を担保。拡散ループでは `next` バッファのコピーで `new Int16Array(next)` を使い、元配列への参照を切る必要がある。

## P2-T3: AI v1（影響マップベース） ✅ 完了 (2026-05-23, commit `dc97deb`)

- **目的**: 影響マップを使って戦略的に行動する AI v1 を実装。v0 のルールベースを拡張し、前線圧力検出・押し返し・経済/軍事バランス評価を追加。
- **作業内容**:
  1. `controller.ts` — v1 ロジック追加: `handleFrontlinePush`（4セクター圧力検出→敵都市方向ユニット投入）、`handleEconomyExpansion`（ratio<0.4で中立都市優先）、`handleHeavyProduction`（都市3+&前線安定でheavy切替）
  2. `controller.ts` — 影響マップ5tickキャッシュ（`getInfluence`）、`selectUnits` ヘルパー抽出
  3. `controller.test.ts` — v1 用テスト 5 件追加（前線押し返し、経済判断、生産切替、防衛優先、決定論）
- **成果物**: 既存 2 ファイル編集（controller.ts +264行, controller.test.ts +116行）
- **受け入れ基準**:
  - [x] AI v1 が影響マップを使って前線を分析する
  - [x] 押し込まれたセクターにユニットを投入する
  - [x] 都市数が不利な場合、中立都市を優先的に狙う
  - [x] 前線安定時に heavy 生産へ切替（set-production コマンド発行）
  - [x] v0 の防衛ロジック（脅威都市への呼び戻し）が維持される
  - [x] 影響マップは 5tick ごとにキャッシュ再計算
  - [x] 全難易度で動作する
  - [x] 決定論テスト通過
  - [x] typecheck / lint / test 全 green（合計 158 件）
- **見積**: 3h
- **実績**: 1.5h
- **学び**: Chrome拡張のスクリーンショットではWebGL Canvas内容が映らない。ウェブテストは `globalThis` にデバッグフックを仕込んで JS から状態を検証する方式が有効。本家 War of Dots には中立都市が存在しないため、economy expansion モードは将来的に不要になる可能性がある。

## P2-T4: 前線描画 ✅ 完了 (2026-05-24, commit `41c8257`)

- **目的**: 影響マップの差分から 0 等高線をマーチングスクエア法で計算し、PixiJS Graphics で半透明線として描画する。
- **作業内容**:
  1. `frontline.ts` 新規作成 — `marchingSquares()` 純関数（16ケーステーブル + 線形補間）+ `createFrontlineRenderer()` ファクトリ（Graphics 描画: 白, 2px, alpha 0.3）
  2. `frontline.test.ts` 新規作成 — 8 テスト（全同符号, 単一境界, 水平/垂直直線境界, 補間精度, 0除算回避）
  3. `App.svelte` — ゲームモード・リプレイモード両方に frontlineRenderer 統合。5tick ごとの影響マップキャッシュ。z-order: 都市の後、ユニットの前に addChild
- **成果物**: 新規 2 ファイル、既存 1 ファイル編集
- **受け入れ基準**:
  - [x] 前線が白い半透明線で描画される
  - [x] 5tick ごとに更新される
  - [x] z-order: 地形 > 都市 > 前線 > ユニット
  - [x] マーチングスクエアのテスト 8 件通過
  - [x] typecheck / lint / test 全 green（合計 166 件）
- **見積**: 2h
- **学び**: マーチングスクエアの 16 ケーステーブルでは、ambiguous case（5, 10）でサドルポイントの向きを決定する必要があるが、影響マップの拡散特性上問題にならない。テストの期待値は等値の ±100 だと中点（0.5）に補間される点に注意。

---

## P2-T4.1: 前線・領土システム再設計 ✅ 完了 (2026-05-24, commit `1816f95`)

- **目的**: P2-T4 ウェブテストで判明した3つの問題を解決し、前線を両軍の境界線として正しく表示する。
  1. 初期ユニット配置が空 → ゲーム開始時からユニットを配置
  2. 影響マップ拡散が狭すぎ → 円形フォールオフに刷新
  3. 後方領土の概念がない → 都市重みで自陣領土を確立
- **作業内容**:
  1. `init.ts` — 初期ユニット配置ロジック追加。各プレイヤー10体のlightユニットを自陣半分にRng(seed)で決定論的に配置。山地形回避、1セル1ユニット制限、supplyUsed追跡
  2. `influence-map.ts` — アルゴリズム全面刷新。点シーディング+10回boxブラー → 円形フォールオフ(R=10, 線形減衰: `weight*(R²-d²)/R²`) + 3回平滑化。city_weight=300で所有都市の影響圏を追加
  3. `init.test.ts` — 5→12テストに拡充（配置制約、決定論、山回避、supplyUsed等）
  4. `influence-map.test.ts` — 9→13テストに拡充（都市重み、距離拡散、対称零等高線等）
  5. `controller.test.ts` — heavy生産テスト更新（都市重みによるenemyPressure変化に対応）
  6. `DESIGN.md` — §1.2初期配置、§8.1円形フォールオフ、§8.3前線動作仕様、§21変更履歴を更新
- **成果物**: 既存 6 ファイル編集
- **受け入れ基準**:
  - [x] ゲーム開始直後にユニットがマップ上に配置されている
  - [x] 前線（白い半透明線）が両軍の間に境界線として見える
  - [x] ユニットをドラッグ選択→右クリック移動→前線が動的にシフトする
  - [x] 後方（自陣側）に前線リングが出ない
  - [x] typecheck / lint / test 全 green（合計 177 件）
- **実績**: 約2h
- **学び**:
  - boxブラー+Math.floorのエネルギー損失問題: 整数truncationで毎反復セルあたり平均0.5失われ、10回反復で全値が0に。解決策は反復拡散に頼らず円形フォールオフで直接形状を生成すること
  - 影響マップに都市重みを入れるとAIの`enemyPressure`判定に影響する。既存テストは敵都市の重みを圧倒するだけのAIユニット数が必要
  - テストのマップサイズは円形フォールオフ半径(R=10)より十分大きい必要がある（8x6→32x24等）

---

## P2-T4.2: 隊形配置・衝突分離・HP/サイズ 3 倍 ✅ 完了 (2026-05-24, commit `803b10c`)

- **目的**: ウェブテストでのユーザーフィードバック4点を実装し、ゲームの見た目と操作感を改善する。
- **作業内容**:
  1. `init.ts` — ランダム散布を方向ベクトル隊形配置に置換。spawn都市→敵spawn方向の直交方向にFORMATION_SPACING=1.5間隔で配列。侵入不可地形スキップ、Rngフォールバック
  2. `separate-units.ts` — 新規ステップ。SpatialHash(cellSize=1)で近傍検索、SEPARATION_DIST=0.6未満のペアを反対方向に押し出し。距離0時はid小→+x,id大→-xの決定論タイブレーク。マップ境界・侵入不可地形チェック
  3. `tick.ts` — パイプラインにseparateUnitsをmoveUnitsの後に挿入
  4. `constants.ts` — HP 3倍（light: 1→3, heavy: 5→15）
  5. `units.ts` — UNIT_RADIUS 3倍（light: 0.25→0.75, heavy: 0.35→1.05）
  6. `resolve-combat.test.ts` — HP変更に伴うテスト名・ループ回数更新
  7. `init.test.ts` — 隊形配置テスト3件追加、ランダム前提テスト削除
  8. `separate-units.test.ts` — 新規テスト8件（分離・タイブレーク・境界・地形・決定論）
- **成果物**: 新規 2 ファイル、既存 6 ファイル編集
- **受け入れ基準**:
  - [x] 初期ユニットが隊形（縦・横・斜め）で密集配置される
  - [x] 侵入不可地形にユニットが配置されない
  - [x] ユニット同士に衝突分離が働き、重なりが解消される
  - [x] light HP = 3, heavy HP = 15
  - [x] light 描画半径 = 0.75, heavy 描画半径 = 1.05
  - [x] typecheck / lint / test 全 green（合計 186 件）
- **実績**: 約1h
- **学び**:
  - 隊形配置はRngを使わず純粋な幾何計算で実装可能。方向ベクトルの直交ベクトル(perpX=-dirY, perpY=dirX)で隊列方向を自動判定
  - 衝突分離のペア重複処理は pairKey = min*100000+max でO(1)判定。処理済みSetを使わないと各ペアが2回処理される
  - HP変更は既存テストの大半がUNIT_STATS定数参照なので影響が最小限。直接リテラルを使うテスト（hp:1で即死テスト等）はテスト固有値として残せる

---

## P2-T4.3: 中央配置・後方都市・中立削除・HP 5 倍 ✅ 完了 (2026-05-25, commit `7c496ff`)

- **目的**: ウェブテストで判明した残課題（ユニット配置が端すぎる、後方都市不足、中立都市の不要性、HP不足）を一括解消。3ディレクトリ例外タスク。
- **作業内容**:
  1. `init.ts` — FORMATION_OFFSET固定値(5)を比率ベース(FORMATION_OFFSET_RATIO=0.4)に変更。spawn間距離の40%地点にユニットを配置し中央付近で対峙
  2. `first-blood.json` — 中央都市(32,17)削除、後方都市4つ追加(id=4〜7, 各プレイヤー2都市)。計8都市(4/プレイヤー: spawn+front+2rear)
  3. `types.ts` — City.ownerを`PlayerId | null`から`PlayerId`に変更。MapDef.citiesにoptional owner追加
  4. `constants.ts` — CAPTURE_NEUTRALIZE_TICKS(60)+CAPTURE_CLAIM_TICKS(30)をCAPTURE_TICKS(90)に統合。HP 5倍(light:3→15, heavy:15→75)
  5. `update-city-capture.ts` — 2段階(中立化→占領)を直接フリップ(enemy→captureProgress→owner変更)に簡略化
  6. `produce-units.ts`, `influence-map.ts`, `hash.ts` — null ownerガード削除
  7. `cities.ts`(render) — NEUTRAL_COLOR削除、null checks削除
  8. `controller.ts`(AI) — NEUTRAL_WEIGHT・handleEconomyExpansion削除、scoreTargets簡略化
  9. `schema.ts`, `loader.ts`(maps) — owner optional field追加
  10. テスト7ファイル更新(evaluate-game-end, produce-units, influence-map, update-city-capture, init, controller, loader)
- **成果物**: 既存 20 ファイル編集
- **受け入れ基準**:
  - [x] 初期ユニットがマップ中央付近で対峙する
  - [x] first-bloodマップに8都市（各プレイヤー4都市）
  - [x] City.ownerがnon-nullable（コンパイル時保証）
  - [x] 占領が直接フリップ（中間null状態なし）
  - [x] light HP=15, heavy HP=75
  - [x] typecheck / lint / test 全 green（合計 186 件）
- **実績**: 約2h
- **学び**:
  - 中立都市削除はCity.owner型変更が全パッケージに波及するため3ディレクトリ例外が必要。型駆動で漏れなく修正箇所を特定できる
  - 2段階占領→直接フリップ化でコード量が大幅削減(43行→25行程度)。ゲームプレイ上も中間null状態がなくなりシンプルに
  - annihilation勝利条件は2プレイヤー+null都市なし環境では到達不能(全都市がどちらかの所有→相手の都市0=自分が全都市所有→domination)。テストをdomination期待に変更
