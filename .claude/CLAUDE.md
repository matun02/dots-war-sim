# CLAUDE.md — War of Dots クローン (Web RTS) プロジェクト指針

> このファイルは **Claude Code（および他のAIコーディング支援）** に最初に読ませる「最重要コンテキスト」です。
> 全ての作業はこの規約に従ってください。

---

## 0. このファイルの読み方
- 各セクションは **規約**。違反する変更は PR でリジェクトされます。
- 「★MUST」「★MUST NOT」「SHOULD」「MAY」を厳密に解釈してください（RFC 2119 準拠）。
- 迷ったら **「過剰設計禁止 / MVP最優先」** に従ってください。

---

## 1. プロジェクト概要

### 1.1 何を作るか
- **War of Dots 風のミニマル RTS**（Web ブラウザ動作）
- 2Dトップダウン、ユニットは「点」、都市を奪い合う陣取りゲーム
- ユニット種別は **light / heavy** の2種類のみ（MVPは light のみ）
- 都市は **最大5ユニット補給**、超過は生産停止
- 前線は **ユニット配置で動的に変動**
- 地形（山）を **A* で迂回**
- 試合長は **5〜10分** 程度のセッションを想定

### 1.2 ゴール
- **個人開発**で完成・維持できる規模
- **無料サービスのみ**で公開（Cloudflare 一式）
- **OSS 中心**・**TypeScript** 統一
- **AI コーディング支援前提**（Claude Code / Cursor）
- **長期保守**：可読性最優先、過剰設計禁止

### 1.3 非ゴール（やらないこと）
- 3D グラフィック
- 凝ったアート（Kenney 等の CC0 素材で進める）
- 基地建設・テックツリー・複雑な経済
- リアルタイムでない要素（ターン制要素）
- Unity / Godot / Unreal 等の重量級エンジン
- バックエンドに Node.js を自前ホスト
- vendor lock-in が強いサービス（Firebase 等）

---

## 2. 技術スタック（決定済み）

| 層 | 採用 | 用途 |
|---|---|---|
| 言語 | **TypeScript (strict)** | 全コード |
| ビルド | **Vite** | dev / build |
| UI フレームワーク | **Svelte 5** | メニュー・HUD のみ |
| レンダラ | **PixiJS v8** | ゲーム本体の描画 |
| UI 状態 | **Zustand**（Svelte 用は store API でも可）| UI 状態のみ |
| Sim 状態 | **純 TS（プリミティブ／TypedArray）** | ゲーム本体 |
| 音 | **Howler.js** | SFX / BGM |
| ローカル永続化 | **idb-keyval (IndexedDB)** | リプレイ・設定 |
| ホスティング | **Cloudflare Pages** | 静的 SPA |
| サーバ関数（後） | **Cloudflare Workers + Durable Objects** | マルチプレイ・ランキング |
| DB（後） | **Cloudflare D1 (SQLite)** | ランキング・プロフィール |
| オブジェクトストア（後） | **Cloudflare R2** | リプレイ共有 |
| 認証（後） | **匿名 UUID → Auth.js** | 段階導入 |
| テスト | **Vitest**（単体）+ **Playwright**（E2E） | 自動テスト |
| エラー | **Sentry** | 本番監視 |
| 分析 | **Cloudflare Web Analytics + PostHog** | 行動分析 |
| CI/CD | **GitHub Actions** | テスト・デプロイ |

★MUST: これら以外の依存追加は Issue で議論し合意を得る。

---

## 3. ディレクトリ構成（pnpm workspaces）

```
war-of-dots/
├── apps/
│   ├── web/                 # @war-of-dots/web — Svelte 5 + Vite + PixiJS（クライアント）
│   │   ├── src/
│   │   │   ├── ui/          # Svelte コンポーネント
│   │   │   ├── game/
│   │   │   │   ├── render/  # PixiJS 描画レイヤ
│   │   │   │   ├── input/   # 入力 → Command 変換
│   │   │   │   ├── ai/      # AI プレイヤー
│   │   │   │   ├── net/     # ネットワーククライアント
│   │   │   │   └── loop.ts  # ゲームループ統合
│   │   │   ├── stores/      # Zustand (UI only)
│   │   │   └── main.ts
│   │   └── public/assets/
│   └── server/              # @war-of-dots/server — Cloudflare Workers（Phase3 以降）
│       └── src/
├── packages/
│   ├── core/                # @war-of-dots/core — ★最重要：sim・型・共通ロジック
│   │   ├── src/
│   │   │   ├── sim/         # 純関数シミュレーション
│   │   │   ├── pathfinding/
│   │   │   ├── rng.ts       # 決定論RNG
│   │   │   ├── replay.ts
│   │   │   └── types.ts
│   │   └── package.json
│   ├── maps/                # @war-of-dots/maps — マップ JSON + バリデーション
│   └── assets/              # @war-of-dots/assets — 共通アセット定義
├── tests/
│   └── e2e/                 # Playwright
├── .github/workflows/
├── .claude/                 # 規約・設計・作業手順・セットアップ
│   ├── CLAUDE.md            # ← このファイル
│   ├── DESIGN.md
│   ├── TASKS.md
│   └── SETUP.md             # 環境セットアップ実録
├── pnpm-workspace.yaml
└── README.md
```

★MUST: 全パッケージは `@war-of-dots/<name>` スコープを使う。
`pnpm --filter` 指定時は **`pnpm --filter @war-of-dots/web dev`** のようにフルネームを指定する（短縮の `web` は package.json の name と一致しないため動かない）。

### 3.1 依存方向（★MUST）

```
packages/core ──┐
                ├── apps/web   （クライアント）
                └── apps/server（サーバ）
tests ──────────→ 上記すべてを参照可
```

- **`packages/core` は他に依存しない**（DOM, Node, Pixi, Svelte いずれも使わない）
- ★MUST NOT: `core/` から `apps/` を import する
- ★MUST NOT: `core/sim` 内で副作用（DOM, fetch, console.log, Date.now, Math.random）

---

## 4. コーディング規約

### 4.1 言語ルール
- **TypeScript `strict: true`**
- **`any` 禁止**（やむを得ない場合は `unknown` + ナローイング）
- **`as` 型アサーション最小化**（ランタイム保証がない場所のみ）
- **ESM のみ**（CommonJS 不可）
- **Node API を `core/` で使わない**（ブラウザでも動かなくなる）

### 4.2 命名規約
- **ファイル**: `kebab-case.ts`（例: `flow-field.ts`）
- **Svelte コンポーネント**: `PascalCase.svelte`
- **型・クラス・コンポーネント**: `PascalCase`
- **関数・変数**: `camelCase`
- **定数（モジュールスコープ）**: `UPPER_SNAKE_CASE`
- **テストファイル**: `*.test.ts`
- **ID 系の型**: `EntityId`, `CityId` のように **branded type** を推奨

```ts
type Brand<T, B> = T & { __brand: B };
export type EntityId = Brand<number, "EntityId">;
```

### 4.3 ★決定論的シミュレーションのルール（最重要）

**`packages/core/sim/` 配下では以下を絶対に禁止**：

| ★MUST NOT | 代わりに |
|---|---|
| `Math.random()` | `rng.next()`（mulberry32 のシード固定） |
| `Date.now()` / `performance.now()` | `state.tick`（tick 番号で時間管理） |
| `Map`/`Set` のイテレーション順依存 | 配列にソート済みのキーを使う |
| 浮動小数の **順序依存** な集計（並列で合計が変わる等）| 整数演算 or ソート済みで合計 |
| `Array.sort` の不安定ソートに依存 | 比較関数を**全順序**で書く（ID で tie-break） |
| `for...in` | `for...of` or インデックス for |
| 外部 I/O（fetch, console, DOM, localStorage） | sim 外で行う |
| `async/await`、`Promise`、`setTimeout` | tick は同期関数 |

**tick 関数のシグネチャ（必ずこの形）**:

```ts
// packages/core/src/sim/tick.ts
export function tick(
  state: GameState,
  inputs: readonly InputFrame[],
  rng: Rng,           // 状態を持つ決定論的 RNG
): GameState;          // 副作用なし、新状態を返す（or in-place + 戻り値 void でもよい：要相談）
```

### 4.4 純度・テスト可能性
- `core/sim` の関数は **入力 → 出力** の純関数を基本
- 副作用が必要な場合は **`apps/web/game/`** 側で行い、`core/sim` には渡さない
- ★MUST: 新規 `core/sim` ロジックには対応する Vitest を追加

### 4.5 Pixi / DOM レイヤー
- **`apps/web/game/render/`** のみが PixiJS を import してよい
- Pixi のオブジェクトは sim の `GameState` を**読み取り**、自分の表示状態に反映する
- ★MUST NOT: Pixi 側で sim の state を変更する（一方向データフロー）

### 4.6 Svelte レイヤー
- **`apps/web/src/ui/`** のみ Svelte コンポーネント
- UI 状態（メニュー、ポーズ、設定）は Zustand or Svelte store
- ★MUST NOT: Svelte リアクティブシステムで sim の state を購読する（ゲームループが破綻する）

---

## 5. ゲームループの規約

### 5.1 ループ構造
- **Simulation**: 固定 30 Hz（`TICK_DT = 1000/30 ms`）
- **Render**: `requestAnimationFrame`（60 Hz 想定、補間あり）

```ts
// apps/web/src/game/loop.ts
const TICK_DT = 1000 / 30;
let acc = 0, last = performance.now();
let prev = clone(state), cur = state;

function frame(now: number) {
  const dt = Math.min(now - last, 250); // スパイク対策
  last = now;
  acc += dt;
  while (acc >= TICK_DT) {
    prev = cur;
    cur = tick(cur, collectInputs(), rng);
    acc -= TICK_DT;
  }
  render(prev, cur, acc / TICK_DT);
  requestAnimationFrame(frame);
}
```

### 5.2 入力（Command）
- 入力は **`InputFrame`** にバッチ化される
- ローカル入力もネットワーク入力も同じ型
- Lockstep 化（Phase3）の際は、サーバから配布された InputFrame をそのまま tick へ渡す

---

## 6. PR / コミット規約

### 6.1 ブランチ命名
- `feat/<short-name>` 機能追加
- `fix/<short-name>` バグ修正
- `chore/<short-name>` 雑務
- `docs/<short-name>` 文書のみ
- `refactor/<short-name>` 機能を変えないリファクタ

### 6.2 コミットメッセージ（Conventional Commits）
```
<type>(<scope>): <subject>

例:
feat(sim): add A* pathfinding with terrain cost
fix(render): fix unit interpolation drift on pause
test(sim): add deterministic replay equivalence test
```

### 6.3 PR の DoD（Definition of Done）
- [ ] `pnpm test` がすべて green
- [ ] `pnpm typecheck` 通過
- [ ] `pnpm lint` 通過
- [ ] 変更内容と動作確認手順を PR に記載
- [ ] 影響範囲を明示
- [ ] core/sim 変更時は **決定論テスト** を追加 or 確認

---

## 7. Claude Code への期待動作

### 7.1 ★MUST：作業前に必ず行うこと
1. **このファイル（CLAUDE.md）と DESIGN.md を読む**
2. **対象 Issue / タスク ID を確認**
3. **影響範囲（ファイル）を洗い出して提示してから着手**
4. **テストを先に書ける場合は TDD で進める**
5. **環境未整備の場合は `SETUP.md` を確認**（Windows での PowerShell 実行ポリシー、pnpm インストール方法など）
6. Phase 2以降の作業に移る際は**入力**、**作業内容**、**成果物**、**受け入れ基準**、**見積**のPhase 2以降の記載がないため、Tasks含む関連ファイル更新を促すこと

### 7.2 ★MUST：作業中に守ること
- 1 タスクで触るディレクトリは **2 つまで**（横断したい時は PR を分ける）
- 既存テストを壊さない（壊れたら原因を提示）
- 不明点は **推測せず質問する**

### 7.3 ★MUST NOT：勝手にやらないこと
- 採用済み技術スタックの差し替え
- ディレクトリ構造の変更
- パッケージの追加（要相談）
- グローバル ESLint / TS 設定の変更
- ドキュメントの大規模書き換え

### 7.4 SHOULD：人間に判断を仰ぐもの
- パフォーマンス vs 可読性のトレードオフ
- API のシグネチャ変更
- 公開関数のリネーム
- アセット差し替え

---

## 8. グロッサリ（用語統一）

| 用語 | 英語 | 定義 |
|---|---|---|
| 単位 | unit | 1 体の戦闘単位（dot） |
| 都市 | city | ユニット生産・補給拠点 |
| 補給スロット | supply slot | 1 都市が抱えられるユニット枠（最大 5） |
| 軽歩兵 | light | 速い・弱い・全地形 |
| 重歩兵 | heavy | 遅い・強い・平地のみ |
| Tick | tick | sim の1ステップ（33.33 ms） |
| InputFrame | input frame | tick に対する入力束 |
| Command | command | 選択・移動・編成などの指示 |
| 前線 | frontline | 陣営密度の境界（描画用） |
| 影響マップ | influence map | 各セルへの陣営影響度 |
| 決定論 | deterministic | 同入力で常に同結果 |
| Lockstep | lockstep | 全クライアントで同一 sim を回す同期方式 |
| desync | desync | クライアント間の sim 不一致 |

---

## 9. 最初に投げるべきタスク（順番付き要約）

詳細は `TASKS.md` 参照。

1. リポジトリ初期化（pnpm workspace, Vite+Svelte+TS+Pixi スケルトン）
2. 決定論 RNG（mulberry32）+ Vitest
3. `core/sim` の型定義（GameState 等）
4. 純関数 `tick()` の空実装 + テスト
5. ゲームループ（30Hz fixed + RAF render）
6. PixiJS ステージ初期化（背景・グリッド）
7. A* パスファインディング
8. マップ読み込み + ユニット出現
9. 入力（矩形選択・移動命令）
10. 戦闘解決・都市占領・勝敗判定
11. AI v0
12. リプレイ録画/再生
13. Cloudflare Pages デプロイ

---

## 10. リンク（雛形）

- 設計詳細: `DESIGN.md`
- 作業順手順: `TASKS.md`
- 環境セットアップ: `SETUP.md`（Windows での実録手順とトラブルシュート）
- 開発フロー: `CONTRIBUTING.md`（後で作成）
- マップ仕様: `packages/maps/README.md`（後で作成）
- ライセンス: `../LICENSE`（MIT）

---

## 11. 変更履歴

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

---

**最後に**: 困ったら「MVP最優先・過剰設計禁止・決定論最優先」の3つを思い出してください。
