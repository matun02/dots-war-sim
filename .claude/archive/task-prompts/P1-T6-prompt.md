## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.5「Pixi / DOM レイヤー」と DESIGN.md §2「アーキテクチャ概要」を厳密に守ること。

## 現在の状態
- M0（スケルトン）完了済み。P1-T1〜T5 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- `packages/core/src/sim/tick.ts` に `tick(state, inputs, rng): GameState` が実装済み。
- `packages/core/src/rng.ts` に `Rng` クラス（mulberry32）実装済み。
- `apps/web/src/game/loop.ts` に `createLoop(opts)` 実装済み（30Hz tick + RAF render、accumulator パターン）。
- `apps/web` は Vite + Svelte 5 + TypeScript のスケルトン。現在 `App.svelte` は "Hello War of Dots" 表示のみ。
- `apps/web` に vitest 用の jsdom 環境設定済み（`vite.config.ts` の `test.environment: 'jsdom'`）。
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T6: PixiJS ステージ初期化と描画**

PixiJS v8 を導入し、暗背景 + 薄いグリッド線を Canvas に描画する。

### 仕様

#### 1. `apps/web/src/game/render/stage.ts`
```ts
export async function createStage(canvas: HTMLCanvasElement): Promise<Application> {
  // PixiJS v8 の Application を初期化
  // - background: '#1a1a1a'
  // - autoDensity: true
  // - resolution: window.devicePixelRatio
  // - canvas 要素を受け取る
  // - リサイズハンドラ: window resize で app.renderer.resize()
}

export function destroyStage(app: Application): void {
  // リサイズリスナー解除 + app.destroy()
}
```

#### 2. `apps/web/src/game/render/grid.ts`
```ts
export function drawGrid(
  app: Application,
  width: number,  // セル数（デフォルト 64）
  height: number, // セル数（デフォルト 36）
  cellPx: number, // 1セルのピクセル（デフォルト 20）
): Container {
  // Graphics で薄いグレー線 (#2a2a2a) の格子を描画
  // Container を返す（後でステージに add する）
}
```

#### 3. `apps/web/src/App.svelte` の更新
- `<canvas>` 要素を配置し、`bind:this` でバインド
- `onMount` で `createStage(canvas)` → `drawGrid(app, 64, 36, 20)` → ステージに追加
- `onDestroy` で `destroyStage(app)` を呼ぶ
- 既存の "Hello War of Dots" テキストは削除してよい

### 実装要件
1. **PixiJS v8 を使用**: `pnpm --filter @war-of-dots/web add pixi.js@8`
2. **PixiJS v8 の初期化 API** に注意:
   - v8 では `new Application()` 後に `await app.init(options)` を呼ぶ（コンストラクタに options を渡す v7 とは異なる）
   - `app.init()` は非同期なので `createStage` は `async` 関数にする
3. **Pixi の import は `render/` 配下のみ** — CLAUDE.md §4.5 の規約
4. **Svelte からは `createStage` 経由で呼ぶ** — Svelte コンポーネントが Pixi を直接 import しない
5. **リサイズ対応**: `window` の `resize` イベントで `app.renderer.resize(window.innerWidth, window.innerHeight)` を呼ぶ
6. Canvas は画面全体を覆う（`width: 100vw; height: 100vh`）

### テスト計画
- P1-T6 はビジュアル出力が主なので、自動テストは最小限でよい
- `pnpm -r typecheck` と `pnpm lint` が通ることを確認
- **dev サーバ起動** (`pnpm --filter @war-of-dots/web dev`) で以下を目視確認:
  - 暗い背景 (#1a1a1a) に薄いグレー (#2a2a2a) のグリッド線が表示される
  - グリッドは 64 列 × 36 行（1280px × 720px の領域）
  - ウィンドウリサイズでキャンバスが追従する

### 禁止事項
* `core/sim` への変更
* Pixi の import を `render/` 以外に置く
* `Math.random()` / `Date.now()`（この Task では使う場面がないはず）

### 受け入れ基準
- [ ] `pnpm --filter @war-of-dots/web dev` で起動し、暗背景 + 薄いグリッドが見える
- [ ] ウィンドウリサイズで追従する
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存テスト壊していないこと）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(render): add PixiJS v8 stage with grid overlay (P1-T6)
```

[本文に PixiJS v8 初期化・グリッド描画・リサイズ対応の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
