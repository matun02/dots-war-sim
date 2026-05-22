# Phase 2〜5 タスク概要

> TASKS.md から分離した将来 Phase のタスク定義。
> Phase 2 以降の作業に移る際は、入力・作業内容・成果物・受け入れ基準・見積の詳細化を行い TASKS.md に記載すること。

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
