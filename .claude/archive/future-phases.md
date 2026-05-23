# Phase 2〜5 タスク概要

> TASKS.md から分離した将来 Phase のタスク定義。
> Phase 2 以降の作業に移る際は、入力・作業内容・成果物・受け入れ基準・見積の詳細化を行い TASKS.md に記載すること。

---

# Phase 2: AI 改善 / Heavy / 複数マップ

> 設計詳細化: 2026-05-23（P2-design タスク）

## P2-T1: Heavy ユニット

**概要**: light に加えて heavy を実装。地形通行制限を A* に反映。

**既に実装済み**:
- `types.ts`: `UnitKind = 'light' | 'heavy'`
- `constants.ts`: `UNIT_STATS.heavy` (speed:2, attack:3, hp:5, attackIntervalTicks:30, produceIntervalTicks:180)
- `astar.ts`: `TERRAIN_COST_HEAVY = [1, -1, -1, -1, 1]`
- `schema.ts`: `production: picklist(['light', 'heavy'])`
- sim ステップ各所で `unit.kind` を参照済み

**新規実装**:
1. `UNIT_STATS` に `supplyCost` フィールド追加: light=1, heavy=2
2. `produce-units.ts`: `supplyUsed + supplyCost <= SUPPLY_MAX` チェック、`supplyUsed += supplyCost`
3. `remove-dead.ts`: `supplyUsed -= UNIT_STATS[unit.kind].supplyCost`
4. `types.ts`: `Command` に `{ type: 'set-production'; player: PlayerId; cityId: CityId; production: UnitKind }` 追加
5. `apply-inputs.ts`: `set-production` ハンドラ（自プレイヤーの都市のみ変更可）
6. `commands.ts`: `setProductionCommand(cityId, production)` 追加
7. `units.ts`: heavy は大きめの円（radius * 1.4）+ 異なる形状で視覚的に区別
8. `App.svelte`: 自都市クリック → `set-production` コマンド発行（light↔heavy トグル）

**ディレクトリ**: `packages/core` + `apps/web`（2）
**見積**: 3h
**依存**: なし

---

## P2-T2: 影響マップ

**概要**: `packages/core/src/sim/influence-map.ts` を新規実装。

**仕様（DESIGN.md §8.1〜§8.2）**:
- データ構造: `Int16Array(width * height)` × 陣営数
- 計算方式:
  1. マップ全体を 0 クリア
  2. 各ユニット位置に重み（light=100, heavy=200）を加算
  3. ガウシアン拡散（3 回反復、3×3 カーネル）
- 更新頻度: 5 tick ごと（DESIGN.md §8.2）
- 出力:

```ts
export interface InfluenceData {
  maps: Int16Array[];   // maps[playerId] = Int16Array(w * h)
  width: number;
  height: number;
}
export function computeInfluenceMap(state: GameState): InfluenceData;
```

**ディレクトリ**: `packages/core`（1）
**見積**: 2h
**依存**: なし

---

## P2-T3: AI v1（影響マップベース）

**概要**: 影響マップを使って戦略的に行動する AI v1 を実装。

**仕様（DESIGN.md §9.2〜§9.3）**:
- 影響マップを取得し「最も押し込まれている」前線セクターを検出
- 押し返し方向にユニット群を投入
- 経済評価: 都市数比率。軍事評価: 前線での影響度比率
- 難易度パラメータ:
  - Easy: thinkIntervalTicks=90, selectionAccuracy=0.7
  - Normal: thinkIntervalTicks=30, selectionAccuracy=0.85
  - Hard: thinkIntervalTicks=1, selectionAccuracy=0.95
- heavy ユニットの生産判断: 前線が安定 → heavy を優先的に生産切替

**変更ファイル**:
- `apps/web/src/game/ai/controller.ts`: v1 ロジック追加（v0 は fallback として残す）
- `packages/core/src/sim/index.ts`: `computeInfluenceMap` の export 追加（P2-T2 で実装済み前提）

**ディレクトリ**: `apps/web` + `packages/core`（export のみ）（2）
**見積**: 3h
**依存**: P2-T2

---

## P2-T4: 前線描画

**概要**: 影響マップの等高線をマーチングスクエアで描画。

**仕様（DESIGN.md §8.3）**:
- `infl[playerA] - infl[playerB]` の 0 等高線を計算
- マーチングスクエア法（16 パターン）で線分リスト生成
- PixiJS `Graphics` で半透明線描画（白, alpha=0.3, width=2）
- 5 tick ごと更新（影響マップと同期）

**新規ファイル**: `apps/web/src/game/render/frontline.ts`

**ディレクトリ**: `apps/web`（1）
**見積**: 2h
**依存**: P2-T2

---

## P2-T5: マップ追加（合計 5 枚）

**概要**: 既存 first-blood に加え 4 マップを追加。合計 5 枚。

**マップ構成**:
| ID | テーマ | サイズ | 都市数 | 特徴 |
|---|---|---|---|---|
| `first-blood` | （既存） | 64×36 | 5 | 中央山脈 + 森林 |
| `bridge` | 中央橋 | 48×36 | 6 | 中央に水域、橋（平地帯）で接続 |
| `four-corners` | 4 隅都市 | 48×48 | 8 | 4 隅に初期都市、中央に中立都市群 |
| `strait` | 海峡 | 64×36 | 6 | 左右を水域で分断、狭い海峡で接続 |
| `corridor` | 回廊 | 64×36 | 6 | 山脈で区切られた複数の回廊 |

**変更ファイル**:
- `packages/maps/src/data/`: 4 JSON 追加
- `packages/maps/src/index.ts`: 新マップの export 追加
- `apps/web/src/ui/Title.svelte`: マップ選択 UI 追加
- `apps/web/src/App.svelte`: 選択マップを `startGame()` に渡す

**ディレクトリ**: `packages/maps` + `apps/web`（2）
**見積**: 2h
**依存**: なし

---

## P2-T6: チュートリアル

**概要**: 初回起動時に操作説明オーバーレイを表示。

**仕様**:
- 表示タイミング: ゲーム開始直後（`startGame()` 内）で初回のみ
- 初回判定: `idb-keyval` で `tutorialSeen: boolean` を永続化
- 表示内容（DESIGN.md §12.2 より）:
  1. 左ドラッグ → 矩形選択
  2. 右クリック → 移動命令
  3. 自都市クリック → 生産切替（P2-T1 で追加）
  4. ホイール → ズーム
  5. Space → ポーズ
- UI: 半透明オーバーレイ + ステップ送り（Next / Skip）
- 「今後表示しない」チェックボックスまたは Skip で完了

**新規ファイル**: `apps/web/src/ui/Tutorial.svelte`

**ディレクトリ**: `apps/web`（1）
**見積**: 2h
**依存**: なし（P2-T1 完了後が望ましいが必須ではない）

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
