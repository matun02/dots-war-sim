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
