# TASKS.md — War of Dots クローン 作業手順書

> 上位文書: `CLAUDE.md`（規約） / `DESIGN.md`（設計）
> 完了タスク詳細: `archive/completed-tasks.md`
> Phase 2〜5 概要: `archive/future-phases.md`
> テンプレート・トラブルシュート: `archive/templates-and-troubleshoot.md`

---

## マイルストーン

- **M0**: スケルトン完成（P1-T1〜T3） — ✅ 全完了 (2026-05-19)
- **M1**: ゲーム表示できる（P1-T4〜T7） — ✅ 全完了 (2026-05-20)
- **M2**: AI と対戦できる（P1-T8〜T12） — 進行中（P1-T11 まで完了）
- **M3**: 公開済み（P1-T13〜T15）
- **M4**: Phase2 完了（P2-T1〜T6）
- **M5**: マルチプレイ動作（P3-T1〜T7）

---

## 完了済みタスク（Phase 1: P1-T1〜T11）

| ID | タイトル | 完了日 | commit | テスト |
|---|---|---|---|---|
| P1-T1 | リポジトリ初期化 | 2026-05-19 | `bcd442d` | — |
| P1-T2 | 決定論 RNG (mulberry32) | 2026-05-19 | `9d6f2d9` | coverage 100% |
| P1-T3 | ゲーム状態の型定義 | 2026-05-19 | `b1f7fb7` | JSON round-trip |
| P1-T4 | 純関数 tick の骨格 | 2026-05-19 | `7488397` | 5 件 |
| P1-T5 | ゲームループ (30Hz) | 2026-05-20 | `12f1fab` | 6 件 |
| P1-T6 | PixiJS ステージ + グリッド | 2026-05-20 | `4b8f443` | 目視確認 |
| P1-T7 | マップ JSON + 地形描画 | 2026-05-20 | `335a662` | 8 件 |
| P1-T8 | ユニット生産 + 直線移動 | 2026-05-20 | `efafc60` | 17 件 (累計 53) |
| P1-T9 | 矩形選択 + 移動命令 | 2026-05-20 | `688d854` | 9 件 (累計 62) |
| P1-T10 | A* パスファインディング | 2026-05-21 | `d8441ec` | 18 件 (累計 80) |
| P1-T11 | 戦闘・死亡処理・都市占領 | 2026-05-21 | `eb5ef21` | 23 件 (累計 103) |

詳細（作業内容・学び・指示文サンプル）: `archive/completed-tasks.md`

---

## ★次タスク: P1-T12: 勝敗判定 + 結果画面

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

## 次々タスク: P1-T13: AI v0（ルールベース）

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

## 残タスク一覧（Phase 1 残り）

| ID | タイトル | 見積 |
|---|---|---|
| P1-T14 | リプレイ録画 / 再生 | 2 日 |
| P1-T15 | Cloudflare Pages デプロイ | 半日 |

Phase 2〜5 のタスク概要: `archive/future-phases.md`

★MUST: Phase 2 以降の作業に移る際は **入力・作業内容・成果物・受け入れ基準・見積** を詳細化してから着手すること。
