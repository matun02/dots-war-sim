# CLAUDE.md — War of Dots (Web RTS) 絶対ルール

> 「★MUST」「★MUST NOT」は RFC 2119 準拠。迷ったら「MVP最優先・過剰設計禁止・決定論最優先」。

---

## 1. プロジェクト概要

- **War of Dots 風ミニマル RTS**（Web ブラウザ、2D トップダウン）
- ユニット種別: light / heavy。都市を奪い合う陣取り
- 個人開発・無料サービスのみ(Cloudflare)・TypeScript統一・AI支援前提
- **非ゴール**: 3D / 重量級エンジン / 基地建設 / Firebase / Node自前ホスト

---

## 2. 技術スタック

| 層 | 採用 | 用途 |
|---|---|---|
| 言語 | TypeScript (strict) | 全コード |
| ビルド | Vite | dev / build |
| UI | Svelte 5 | メニュー・HUD |
| レンダラ | PixiJS v8 | ゲーム描画 |
| Sim状態 | 純TS(プリミティブ/TypedArray) | ゲーム本体 |
| 音 | Howler.js | SFX / BGM |
| 永続化 | idb-keyval (IndexedDB) | リプレイ・設定 |
| ホスティング | Cloudflare Pages | 静的SPA |
| UI状態 | Zustand | UI状態のみ |
| テスト | Vitest + Playwright | 単体 + E2E |
| CI/CD | GitHub Actions | テスト・デプロイ |
| サーバ(後) | CF Workers + Durable Objects | マルチプレイ |
| DB(後) | Cloudflare D1 | ランキング |
| ストア(後) | Cloudflare R2 | リプレイ共有 |
| 認証(後) | 匿名UUID → Auth.js | 段階導入 |
| エラー(後) | Sentry | 本番監視 |
| 分析(後) | CF Web Analytics + PostHog | 行動分析 |

★MUST: 依存追加は Issue で合意を得る。

---

## 3. 依存方向

```
packages/core ──┐
                ├── apps/web
                └── apps/server
```

- ★MUST NOT: `core/`から`apps/`をimport
- ★MUST NOT: `core/sim`内で副作用(DOM, fetch, console.log, Date.now, Math.random)
- `pnpm --filter @dots-war-sim/web dev` のようにフルネーム指定

---

## 4. コーディングルール

### 4.1 言語
- TypeScript `strict: true`
- `any`禁止(`unknown`+ナローイング)
- `as`最小化
- ESMのみ(CommonJS不可)
- `core/`でNode API不可
- 1ファイル200行以内を目安とする

### 4.2 ★決定論(最重要)

`packages/core/sim/`配下で絶対禁止:

| ★MUST NOT | 代わりに |
|---|---|
| `Math.random()` | `rng.next()` |
| `Date.now()`/`performance.now()` | `state.tick` |
| `Map`/`Set`イテレーション順依存 | 配列+ソート済みキー |
| 浮動小数の順序依存集計 | 整数演算 or ソート済み合計 |
| `Array.sort`不安定ソート依存 | 全順序比較関数(IDでtie-break) |
| `for...in` | `for...of` or インデックスfor |
| 外部I/O(fetch, console, DOM) | sim外で行う |
| `async/await`/`Promise`/`setTimeout` | tickは同期関数 |

tick関数シグネチャ:
```ts
export function tick(state: GameState, inputs: readonly InputFrame[], rng: Rng): GameState;
```

### 4.3 レイヤー分離
- ★MUST: `core/sim`は入力→出力の純関数。新規ロジックにはVitest追加
- ★MUST NOT: Pixi側でsimのstateを変更(一方向データフロー)
- ★MUST NOT: Svelteリアクティブでsim stateを購読

---

## 5. ゲームループ

Sim: 固定30Hz (`TICK_DT = 1000/30`)。Render: `requestAnimationFrame`(補間あり)。

---

## 6. Claude Code 期待動作

### ★MUST: 作業前
1. このファイルと DESIGN.md を読む
2. 対象タスクIDを確認
3. 影響範囲を洗い出して提示してから着手
4. TDDで進められる場合はTDDで
5. 環境未整備なら`SETUP.md`確認
6. Phase 2以降: 入力・作業内容・成果物・受け入れ基準・見積の記載がなければ更新を促す

### ★MUST: 作業中
- 1タスクで触るディレクトリは2つまで
- 既存テストを壊さない
- 不明点は推測せず質問
- コミット前に`skills/skill-pre-commit-check.md`実施
- 視覚変更は「目視確認が必要」と報告
- 数値変更時は設定値と期待ログを提示する
- ユーザーの報告→症状確認が先。仮説に読み替えない

### ★MUST NOT
- 技術スタック差し替え / ディレクトリ構造変更 / パッケージ追加(要相談)
- グローバルESLint/TS設定変更
- ドキュメント大規模書き換え / 頼まれていない修正
- ユーザーの診断 > AIの仮説

### SHOULD: 人間に判断を仰ぐもの
- パフォーマンス vs 可読性のトレードオフ
- APIのシグネチャ変更
- 公開関数のリネーム
- アセット差し替え

### ★MUST: wiki整合性ルール
- **wikiの数値とコードが矛盾する場合、勝手に判断せずユーザーに確認する**
- コードがtruth source。wikiが古い可能性がある
- アルゴリズムや定数を変更したら対応wikiページも更新

### ウェブテスト注意
- WebGL Canvasはスクリーンショット不可(黒画面)→JS状態検証が最初の手段
- Chrome拡張ボタンクリック不安定→JSの`.click()`優先
- `?debug=1`デバッグモード常設推奨
- 途中状態からのテストハーネス整備が必要(heavy切替・経済拡張等)
- ウェブテストはログで検証。ログがなければ追加を提案

---

## 7. Wiki リファレンス

詳細仕様は`.claude/wiki/index.md`参照。該当サブシステム作業時にReadで参照。
**★MUST NOT: 全ページを一度に読み込まない。必要なページのみ読む。**
**★MUST: wiki探索は index.md 階層を辿る（root→各dir index→個別ページ）。grep横断は「横断的に見て」と明示された時のみ。**

---

## 8. 変更履歴（最新 3 件 — 全履歴は `archive/changelog.md`）

| 日付 | 変更 |
|---|---|
| 2026-06-03 | P2-T7 完了（commit `60c7b17`）。`evaluate-game-end.ts` の domination 勝利を全都市(100%)→80%以上に変更（整数演算 `owned*5>=total*4` で決定論維持）。影響マップ都市重み(CITY_WEIGHT=300)は P2-T4.1 で実装済みのため確認のみ。core テスト+4(166)。M4 は P2-T6 のみ残 |
| 2026-06-02 | PR #4 Codex 指摘対応。`separate-units.ts` の `isImpassable` が water を壁扱いしていたのを mountain のみに修正（A*/init と統一。water 上で重なったユニットが分離不能だったバグ）。separate-units テスト+1。全テスト緑(core162/maps43/web36) |
| 2026-06-02 | 地形による移動速度倍率を追加（`TERRAIN_SPEED_PCT`: water light/heavy 50%・forest heavy 75%、乗っているタイルで判定。移動コスト＝経路選択とは別軸）。`constants.ts`＋`move-units.ts`、move-unitsテスト+2。全テスト緑(core161/maps43/web36) |
