# TASKS.md — War of Dots クローン 作業手順書

> 上位文書: `CLAUDE.md`（規約） / `DESIGN.md`（設計）
> 完了タスク詳細: `archive/completed-tasks.md`
> Phase 2〜5 概要: `archive/future-phases.md`
> テンプレート・トラブルシュート: `archive/templates-and-troubleshoot.md`

---

## マイルストーン

- **M0**: スケルトン完成（P1-T1〜T3） — ✅ 全完了 (2026-05-19)
- **M1**: ゲーム表示できる（P1-T4〜T7） — ✅ 全完了 (2026-05-20)
- **M2**: AI と対戦できる（P1-T8〜T13） — ✅ 全完了 (2026-05-22)
- **M3**: 公開済み（P1-T14〜T15） — ✅ 全完了 (2026-05-23)
- **M4**: Phase2 完了（P2-T1〜T7）
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
| P1-T12 | 勝敗判定 + 結果画面 | 2026-05-22 | `e5be5aa` | 8 件 (累計 112) |
| P1-T13 | AI v0（ルールベース） | 2026-05-22 | `c617ac5` | 8 件 (累計 120) |
| P1-T14 | リプレイ録画 / 再生 | 2026-05-22 | `44ded2a` | 12 件 (累計 132) |
| P1-T15 | Cloudflare Pages デプロイ | 2026-05-23 | `4189b9a` | — (インフラのみ) |

詳細（作業内容・学び・指示文サンプル）: `archive/completed-tasks.md`

---

## ★Phase 1 完了

Phase 1 全タスク（P1-T1〜T15）完了。M3（公開済み）マイルストーン達成。
公開 URL: https://dots-war-sim.pages.dev/

---

## Phase 2: AI 改善 / Heavy / 複数マップ

### M4 マイルストーン定義

Phase 2 全タスク（P2-T1〜T7）完了で M4 達成:
- Heavy ユニットが生産・移動・戦闘・地形制限付きで動作
- 影響マップが 5tick ごとに計算される（都市パワー投射含む）
- AI v1 が影響マップを使って戦略的に行動する
- 前線が影響マップの等高線として描画される
- マップが合計 5 枚（first-blood + 4 新規）
- 初回起動時にチュートリアルオーバーレイが表示される
- 勝利条件が 80% 都市支配 or 全ユニット殲滅に更新される

### タスク一覧

| ID | タイトル | 依存 | ディレクトリ | 見積 |
|---|---|---|---|---|
| P2-T1 | Heavy ユニット | — | `packages/core` + `apps/web` | 3h |
| P2-T2 | 影響マップ | — | `packages/core` | 2h |
| P2-T3 | AI v1（影響マップベース） | P2-T2 | `apps/web` + `packages/core` | 3h |
| P2-T4 | 前線描画 | P2-T2 | `apps/web` | 2h |
| P2-T5 | マップ追加（計 5 枚） | — | `packages/maps` + `apps/web` | 2h |
| P2-T6 | チュートリアル | — | `apps/web` | 2h |
| P2-T7 | 勝利条件 80% + 影響マップ都市重み | P2-T2 | `packages/core` | 1.5h |

### 依存グラフ

```
P2-T1 ──────────────────────────────┐
P2-T2 ──┬── P2-T3（AI v1）          │
        ├── P2-T4（前線描画）        ├── M4
        └── P2-T7（勝利条件+都市重み）│
P2-T5 ──────────────────────────────┤
P2-T6 ──────────────────────────────┘
```

推奨実行順: T1 → T2 → T3 → T4 → T5 → T6 → T7

---

### ★次タスク: P2-T1 Heavy ユニット

**入力**: DESIGN.md §1.4（ユニット仕様）、§7.2（A* 地形コスト）

**既に実装済みの部分**:
- `types.ts`: `UnitKind = 'light' | 'heavy'` 定義済み
- `constants.ts`: `UNIT_STATS.heavy` 定義済み（speed:2, attack:3, hp:5, attackIntervalTicks:30, produceIntervalTicks:180）
- `astar.ts`: `TERRAIN_COST_HEAVY = [1, -1, -1, -1, 1]` 定義済み
- `recompute-paths.ts`: `findPath(state.map, unit.pos, unit.goal!, unit.kind)` — kind を渡している
- `move-units.ts`: `UNIT_STATS[unit.kind].speed` — kind 対応済み
- `resolve-combat.ts`: `UNIT_STATS[attacker.kind].attack/.attackIntervalTicks` — kind 対応済み
- `produce-units.ts`: `UNIT_STATS[kind].hp/.produceIntervalTicks` — kind 対応済み
- `schema.ts`: `production: picklist(['light', 'heavy'])` — バリデーション対応済み

**未実装（本タスクで実装）**:
1. **補給コスト差分**: `produce-units.ts` で `supplyUsed >= SUPPLY_MAX` は light=1 前提。heavy=2 に対応必要
2. **`remove-dead.ts`**: `supplyUsed--` は常に 1 減算。heavy は 2 減算必要
3. **`set-production` Command**: 都市の生産種別を切り替えるコマンド型が未定義
4. **`apply-inputs.ts`**: `set-production` コマンドのハンドラ未実装
5. **UI**: 都市クリックで生産切替トグル未実装
6. **描画**: heavy ユニットの視覚的区別（サイズ・形状）未実装

**作業内容**:

| ファイル | 変更 |
|---|---|
| `packages/core/src/sim/constants.ts` | `SUPPLY_COST: { light: 1, heavy: 2 }` を `UNIT_STATS` に追加 |
| `packages/core/src/sim/types.ts` | `Command` union に `set-production` 追加 |
| `packages/core/src/sim/steps/apply-inputs.ts` | `set-production` ハンドラ追加 |
| `packages/core/src/sim/steps/produce-units.ts` | 補給コスト差分対応（`supplyUsed + cost <= SUPPLY_MAX`） |
| `packages/core/src/sim/steps/remove-dead.ts` | 補給コスト差分対応（`supplyUsed -= cost`） |
| `packages/core/src/sim/index.ts` | 新定数の export 追加（必要に応じて） |
| `apps/web/src/game/input/commands.ts` | `setProductionCommand()` 追加 |
| `apps/web/src/game/render/units.ts` | heavy ユニットの視覚的区別（大きめの円 + 六角形） |
| `apps/web/src/App.svelte` | 都市クリック → 生産切替の入力ハンドリング追加 |

**成果物**: 上記ファイルの変更 + テストファイル

**受け入れ基準**:
- [ ] heavy ユニットが都市から生産される（`produceIntervalTicks: 180`）
- [ ] heavy は補給スロット 2 消費（都市に heavy 2体 + light 1体 = 5 スロット使用で生産停止）
- [ ] heavy は平地・都市のみ通行可（mountain/forest/water は A* が迂回 or null）
- [ ] heavy の戦闘: attack=3, hp=5, attackIntervalTicks=30
- [ ] `set-production` コマンドで都市の生産種別が切り替わる
- [ ] UI: 自都市クリックで生産種別トグルが機能する
- [ ] heavy ユニットが light と視覚的に区別できる
- [ ] 死亡時に正しい補給コスト分が解放される
- [ ] 決定論テスト: 同一 seed・同一 input で heavy 含む sim が再現する
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 132 件 + 新規テスト全て green）

**見積**: 3h

**テスト計画**:
- `produce-units.test.ts`: heavy 生産（180tick 間隔、supplyCost=2）、補給上限テスト（heavy で上限到達）
- `remove-dead.test.ts`: heavy 死亡時の補給解放（2 減算）
- `apply-inputs.test.ts`: `set-production` コマンドの適用
- `move-units.test.ts`: heavy の移動速度（speed=2）
- `resolve-combat.test.ts`: heavy の攻撃力・HP テスト
- 統合テスト: heavy + light 混成での tick 決定論

---

### 残タスク一覧

#### P2-T2: 影響マップ
- **入力**: DESIGN.md §8.1, §8.2
- **作業**: `packages/core/src/sim/influence-map.ts` 新規作成。`Int16Array(w*h)` × 陣営数、ユニット位置に重み加算 → ガウシアン拡散。5tick ごと更新。
- **ディレクトリ**: `packages/core`（1 ディレクトリ）
- **見積**: 2h

#### P2-T3: AI v1（影響マップベース）
- **入力**: DESIGN.md §9.2, §9.3。**依存: P2-T2**
- **作業**: `apps/web/src/game/ai/controller.ts` を拡張。影響マップで前線検出 → 押し返し方向にユニット投入。経済/軍事バランス評価。難易度パラメータ再調整。
- **ディレクトリ**: `apps/web` + `packages/core`（export 追加のみ）
- **見積**: 3h

#### P2-T4: 前線描画
- **入力**: DESIGN.md §8.3。**依存: P2-T2**
- **作業**: `apps/web/src/game/render/frontline.ts` 新規作成。マーチングスクエアで `infl[A] - infl[B]` の 0 等高線を生成 → PixiJS Graphics で半透明線描画。
- **ディレクトリ**: `apps/web`（1 ディレクトリ）
- **見積**: 2h

#### P2-T5: マップ追加（計 5 枚）
- **入力**: future-phases.md P2-T5
- **作業**: `packages/maps/src/data/` に 4 マップ JSON 追加（中央橋、4 隅都市、海峡、回廊）。`index.ts` 更新。`Title.svelte` にマップ選択 UI 追加。`App.svelte` で選択マップを `loadMap` に渡す。
- **ディレクトリ**: `packages/maps` + `apps/web`
- **見積**: 2h

#### P2-T6: チュートリアル
- **入力**: DESIGN.md §12.2
- **作業**: `apps/web/src/ui/Tutorial.svelte` 新規作成。操作説明オーバーレイ（矩形選択・移動命令・生産切替等）。初回起動フラグを IndexedDB（`idb-keyval`）で管理。`App.svelte` に統合。
- **ディレクトリ**: `apps/web`（1 ディレクトリ）
- **見積**: 2h

#### P2-T7: 勝利条件 80% + 影響マップ都市重み
- **入力**: DESIGN.md §1.1, §8.1。**依存: P2-T2**
- **作業**: `evaluate-game-end.ts` の domination 判定を 80% 閾値に変更。`influence-map.ts` に都市位置への重み加算（city_weight=300）を追加。
- **ディレクトリ**: `packages/core`（1 ディレクトリ）
- **見積**: 1.5h

---

プロンプトファイル: `archive/task-prompts/P2-T1-prompt.md` 〜 `P2-T7-prompt.md`
