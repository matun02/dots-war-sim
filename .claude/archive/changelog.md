# 変更履歴（CLAUDE.md + TASKS.md 統合）

> CLAUDE.md と TASKS.md の変更履歴を統合したアーカイブ。
> 本体からは最新 3 件のみ表示し、全履歴はここで管理する。

---

## CLAUDE.md 変更履歴

| 日付 | バージョン | 変更 |
|---|---|---|
| 2026-05-19 | 1.0.0 | 初版作成 |
| 2026-05-19 | 1.0.1 | P1-T1 完了。ディレクトリ構成に `@war-of-dots/*` スコープ・`.claude/` 配下を明記、§7.1 に SETUP.md 確認を追加、§10 に SETUP.md リンクを追加 |
| 2026-05-19 | 1.0.2 | P1-T2 完了（決定論 RNG）、P1-T3 完了（型定義）。M0 マイルストーン達成。GitHub リポジトリ `matun02/dots-war-sim` を開設 |
| 2026-05-19 | 1.0.3 | P1-T4 完了（tick orchestrator + 8 空ステップ関数）。`packages/core/src/sim/tick.ts` + `steps/` 配下 8 ファイル + テスト 5 件。決定論テスト・spy テスト・immutability テスト全 pass |
| 2026-05-20 | 1.0.4 | P1-T5 完了（ゲームループ）。`apps/web/src/game/loop.ts` — accumulator パターン + スパイク対策 + jsdom テスト環境。テスト 6 件全 pass |
| 2026-05-20 | 1.0.5 | Claude Code スキル追加。`.claude/skills/` に TASKS.md 更新・CLAUDE.md 更新・ドキュメント commit/push の 3 スキル |
| 2026-05-20 | 1.0.6 | P1-T6 完了（PixiJS ステージ + グリッド）。`apps/web/src/game/render/stage.ts` + `grid.ts` — PixiJS v8 非同期初期化・64×36 グリッド描画・リサイズ対応 |
| 2026-05-20 | 1.0.7 | P1-T7 完了（マップ JSON + 地形描画）。`packages/maps/` — valibot スキーマ + loadMap バリデーション + first-blood.json（64×36, 5都市, 山脈）。`terrain.ts` + `cities.ts` で地形・都市描画 |
| 2026-05-20 | 1.0.8 | P1-T8 完了（ユニット生産 + 直線移動）。`constants.ts` + `init.ts` + `produce-units.ts` + `move-units.ts` + `units.ts` レンダラー。ゲームループ統合。テスト 17 件追加（合計 53 件） |
| 2026-05-20 | 1.0.9 | P1-T9 完了（矩形選択 + 移動命令）。`apply-inputs.ts` + `input/selection.ts` + `input/commands.ts` + `selection-box.ts`。units.ts に選択リング追加。テスト 9 件追加（合計 62 件） |
| 2026-05-21 | 1.0.10 | P1-T10 完了（A* パスファインディング）。`pathfinding/binary-heap.ts` + `astar.ts` — 8方向・整数コスト・オクタイルh・決定論tie-break。`recompute-paths.ts` — 上限8件/tick。`move-units.ts` — path追従版+直線フォールバック。テスト 18 件追加（合計 80 件） |
| 2026-05-21 | 1.0.11 | P1-T11 完了（戦闘・死亡処理・都市占領）。`spatial-hash.ts` — 配列ベース空間ハッシュ。`resolve-combat.ts` — id昇順処理・ATTACK_RANGE=1.5・同時攻撃。`remove-dead.ts` — supplyUsed解放。`update-city-capture.ts` — 60tick中立化・30tick占領・POST_CAPTURE_COOLDOWN=150。テスト 23 件追加（合計 103 件） |
| 2026-05-22 | 1.0.12 | P1-T12 完了（勝敗判定 + 結果画面）。`evaluate-game-end.ts` — domination/annihilation/timeout/draw判定。`GAME_TIME_LIMIT_TICKS=36000`。`Title.svelte` + `ResultDialog.svelte` + App.svelte画面遷移。テスト 8 件追加（合計 112 件） |
| 2026-05-22 | 1.0.13 | P1-T13 完了（AI v0 ルールベース）。`apps/web/src/game/ai/controller.ts` — AIController factory + 難易度設定 + ターゲットスコアリング + 防衛ロジック。App.svelte統合（別Rngインスタンス）。テスト 8 件追加（合計 120 件）。M2完了 |
| 2026-05-22 | 1.0.14 | P1-T14 完了（リプレイ録画/再生）。`core/src/replay.ts` — Replay型 + REPLAY_VERSION。`core/sim/hash.ts` — 決定論的状態ハッシュ。`apps/web/src/game/replay/` — recorder + player + storage(idb-keyval)。ResultDialog + App.svelte UI統合。テスト 12 件追加（合計 132 件） |
| 2026-05-23 | 1.0.15 | P1-T15 完了（Cloudflare Pages デプロイ）。`vite.config.ts` manualChunks + `_redirects` SPA フォールバック。公開 URL: dots-war-sim.pages.dev。M3完了、Phase 1 全完了 |
| 2026-05-23 | 1.0.16 | P2-T1 完了（Heavy ユニット）。`constants.ts` supplyCost追加、`types.ts` set-production Command、`produce-units.ts`/`remove-dead.ts` 補給コスト差分、`commands.ts` setProductionCommand、`units.ts` heavy描画（radius 0.35）、`App.svelte` 都市クリックトグル。テスト 12 件追加（合計 144 件） |
| 2026-05-23 | 1.0.17 | P2-T2 完了（影響マップ）。`influence-map.ts` 新規作成 — computeInfluenceMap + computeInfluenceDiff 純関数。Int16Array、整数演算のみ、3回ガウシアン拡散。テスト 9 件追加（合計 153 件） |
| 2026-05-23 | 1.0.18 | P2-T3 完了（AI v1 影響マップベース）。`controller.ts` v1拡張 — 前線圧力検出(4セクター)・経済評価(ratio<0.4で中立優先)・heavy生産切替(都市3+&安定時)・影響マップ5tickキャッシュ。テスト 5 件追加（合計 158 件） |
| 2026-05-24 | 1.0.19 | P2-T4 完了（前線描画）。`frontline.ts` 新規作成 — マーチングスクエア法で影響マップ差分の0等高線を計算、PixiJS Graphics白半透明線(2px, alpha 0.3)。App.svelte統合（5tickキャッシュ、ゲーム+リプレイ）。テスト 8 件追加（合計 166 件） |
| 2026-05-24 | 1.0.20 | P2-T4 → T4.1 再設計タスク切り出し。ウェブテストで判明した問題（初期配置空、影響拡散狭、後方領土なし）の是正タスク。TASKS.md・DESIGN.md 設計見直し対象 |
| 2026-05-24 | 1.0.21 | P2-T4.1 完了（前線・領土システム再設計）。`init.ts` 初期ユニット配置(10体/プレイヤー、自陣半分、山回避、Rng決定論)。`influence-map.ts` 円形フォールオフ(R=10)+都市重み(300)+3回平滑化に刷新。テスト 11 件追加（合計 177 件） |
| 2026-05-24 | 1.0.22 | P2-T4.2 完了（隊形配置・衝突分離・HP/サイズ3倍）。`init.ts` 方向ベクトル隊形配置、`separate-units.ts` SpatialHash衝突分離(SEPARATION_DIST=0.6)、HP 3倍(light:3, heavy:15)、描画半径3倍(light:0.75, heavy:1.05)。テスト 9 件追加（合計 186 件） |
| 2026-05-25 | 1.0.23 | P2-T4.3 完了（中央配置・後方都市・中立削除・HP5倍）。`init.ts` 比率ベースオフセット(40%)、`first-blood.json` 後方都市4追加(計8)、`types.ts` City.ownerからnull排除、`update-city-capture.ts` 直接フリップ化(CAPTURE_TICKS=90)、HP 5倍(light:15, heavy:75)。テスト更新（合計 186 件） |
| 2026-05-30 | 1.0.24 | P2-T5 完了（新規マップ4枚+選択UI、ビューポートfit）。`packages/maps` に bridge/four-corners/strait/corridor.json 追加(平地連結性・対称性を生成時検証)、`index.ts` に MAP_CATALOG/getMapJson、`Title.svelte` マップ選択UI、`stage.ts` fitStageToWorld(均一スケール+中央寄せでビューポートfit)、`App.svelte`/`player.ts` で選択マップ受け渡し。maps テスト27件追加（合計 223 件） |
| 2026-05-31 | 1.0.25 | 新規マップ Veln Corridor 追加（`maps/src/data/veln-corridor.json` + `index.ts` の MAP_CATALOG/MAP_JSON 登録。非対称6都市/3対3、湖+山スパーで中央平野を幅6の咽喉に絞る設計）。初期ユニット種別指定機能 — `schema.ts`(SpawnSchema.kind + unitPositions[].kind)・`types.ts`(MapDef.spawns に kind)・`loader.ts`(passthrough)・`init.ts`(kind解決順 pos→spawn→既定light、heavyは平地のみ配置、supplyUsedをsupplyCost累積化)。既定light＝後方互換。core テスト +4(kind, 合計156)。maps テストに kind round-trip 追加＋veln-corridor 設計検証ブロックを現行レイアウト(6都市/3対3・森のlight専用都市id2・mixed-kind初期配置)へ更新(計43)。全テスト緑(core156/maps43/web36) |
| 2026-06-01 | 1.0.26 | コアバランス刷新（A1: flank過強対策）。速度半減(light4→2/heavy2→1)、hp/attack を ×100 スケール(決定論)、地形コスト再定義(`astar.ts`: mountain=全員壁/water=2/forest light1・heavy2)、新規 `TERRAIN_ATTACK_PCT`(攻撃側地形・heavy森水×0.75/light水×0.75)を `resolve-combat.ts` に適用(整数 round-half-up)。`init.ts` 通行可否を非mountainに簡素化。core テスト更新＋地形倍率3件(計159)。全テスト緑(core159/maps43/web36)。※既存マップ(Veln含む)は「water壁→通行可・mountain→壁」で前提が変わるため要再調整(後続) |
| 2026-06-02 | 1.0.27 | 地形による移動速度倍率を追加。新規 `TERRAIN_SPEED_PCT`(`constants.ts`: light`[100,100,100,50,100]`/heavy`[100,100,75,50,100]`)を `move-units.ts` で base速度に乗算(乗っているタイルの地形・交戦減速と乗算併用)。移動コスト(A*経路)・攻撃倍率・通行可否は不変＝コストとは別軸の実速度補正。move-units テスト+2(water50%/forest75%, 計161)。全テスト緑(core161/maps43/web36)。units.md/astar.md の「速度は地形非依存」を訂正 |
| 2026-06-02 | 1.0.28 | PR #4 Codex 指摘対応。`separate-units.ts` の `isImpassable` が water(3) を依然 壁扱いしていたのを mountain のみに修正（A*/init の地形ルールと統一。water 上で重なったユニットが分離できないバグ）。separate-units テスト +1(water 上で分離・計162)。全テスト緑(core162/maps43/web36) |

---

## TASKS.md 変更履歴

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
| 2026-05-20 | 1.0.9 | P1-T9 完了マーク（commit `688d854`）。矩形選択 + 移動命令 + apply-inputs 実装 + 選択描画。新規テスト 9 件（合計 62 件）。M2 進行中 |
| 2026-05-21 | 1.0.10 | P1-T10 完了マーク（commit `d8441ec`）。A* パスファインディング（binary-heap + astar + recompute-paths + move-units path追従版）。新規テスト 18 件（合計 80 件）。M2 進行中 |
| 2026-05-21 | 1.0.11 | P1-T11 完了マーク（commit `eb5ef21`）。戦闘・死亡処理・都市占領（spatial-hash + resolve-combat + remove-dead + update-city-capture）。新規テスト 23 件（合計 103 件）。M2 進行中 |
| 2026-05-22 | 1.0.12 | P1-T12 完了マーク（commit `e5be5aa`）。勝敗判定 + 結果画面 + タイトル画面 + 画面遷移。新規テスト 8 件（合計 112 件）。M2 進行中 |
| 2026-05-22 | 1.0.13 | P1-T13 完了マーク（commit `c617ac5`）。AI v0 ルールベース + App.svelte統合。新規テスト 8 件（合計 120 件）。M2 完了 |
| 2026-05-23 | 1.0.16 | P2-T1 完了マーク（commit `a6e6beb`）。Heavy ユニット — supplyCost + set-production + 補給コスト差分 + 都市クリックトグル + heavy描画。新規テスト 12 件（合計 144 件）。M4 進行中 |
| 2026-05-23 | 1.0.17 | P2-T2 完了マーク（commit `ff1390f`）。影響マップ — computeInfluenceMap + computeInfluenceDiff + Int16Array拡散。新規テスト 9 件（合計 153 件）。M4 進行中 |
| 2026-05-23 | 1.0.18 | P2-T3 完了マーク（commit `dc97deb`）。AI v1 影響マップベース — 前線圧力検出・経済評価・heavy生産切替・5tickキャッシュ。新規テスト 5 件（合計 158 件）。M4 進行中 |
| 2026-05-24 | 1.0.19 | P2-T4 完了マーク（commit `41c8257`）。前線描画 — マーチングスクエア法 + PixiJS Graphics半透明線 + App.svelte統合（ゲーム+リプレイ）。新規テスト 8 件（合計 166 件）。M4 進行中 |
| 2026-05-24 | 1.0.21 | P2-T4.1 完了マーク（commit `1816f95`）。前線・領土システム再設計 — init.ts初期配置 + influence-map.ts円形フォールオフ刷新 + 都市重み。新規テスト 11 件（合計 177 件）。M4 進行中 |
| 2026-05-24 | 1.0.22 | P2-T4.2 完了マーク（commit `803b10c`）。隊形配置・衝突分離・HP/サイズ3倍 — init.ts方向ベクトル隊形 + separate-units.ts衝突分離 + HP/描画3倍。新規テスト 9 件（合計 186 件）。M4 進行中 |
| 2026-05-25 | 1.0.23 | P2-T4.3 完了マーク（commit `7c496ff`）。中央配置・後方都市・中立削除・HP5倍 — init.ts比率オフセット(40%) + first-blood.json後方都市4追加(計8) + City.ownerからnull排除 + 直接フリップ化 + HP5倍。テスト更新（合計 186 件）。M4 進行中 |
| 2026-05-30 | 1.0.24 | P2-T5 完了マーク（commit `ae87cd0`）。マップ追加(計5枚) + マップ選択UI + ビューポートfit — bridge/four-corners/strait/corridor.json + MAP_CATALOG/getMapJson + Title.svelteマップ選択 + stage.tsフィットスケール + App.svelte/player.ts受け渡し。mapsテスト27件追加（合計 223 件）。M4 進行中 |
