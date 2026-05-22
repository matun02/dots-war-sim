## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §2「技術スタック」（Cloudflare Pages）と §7「Claude Code への期待動作」を厳密に守ること。

## 現在の状態
- M0〜M2 全完了。P1-T1〜T14 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
  - commit `335a662`: マップ JSON + 地形描画 — `packages/maps/`, `terrain.ts`, `cities.ts`
  - commit `efafc60`: ユニット生産 + 直線移動 — `constants.ts`, `init.ts`, `produce-units.ts`, `move-units.ts`, `units.ts`
  - commit `688d854`: 矩形選択 + 移動命令 — `input/selection.ts`, `input/commands.ts`, `apply-inputs.ts`, `selection-box.ts`
  - commit `d8441ec`: A* パスファインディング — `pathfinding/binary-heap.ts`, `astar.ts`, `recompute-paths.ts`, `move-units.ts` path追従版
  - commit `50d2e02`: レビュー修正（astar テスト強化 + export 統合）
  - commit `eb5ef21`: 戦闘・死亡処理・都市占領 — `spatial-hash.ts`, `resolve-combat.ts`, `remove-dead.ts`, `update-city-capture.ts`
  - commit `a316019`: 都市色の動的更新修正 — `cities.ts` を `createCityRenderer` パターンに
  - commit `e5be5aa`: 勝敗判定 + 結果画面 — `evaluate-game-end.ts`, `Title.svelte`, `ResultDialog.svelte`, `App.svelte` 画面遷移
  - commit `c617ac5`: AI v0（ルールベース） — `apps/web/src/game/ai/controller.ts`, `controller.test.ts`, `App.svelte` AI統合
  - commit `44ded2a`: リプレイ録画/再生 — `replay.ts`, `hash.ts`, recorder/player/storage, UI統合
  - commit `94eb742`: fix(web): reuse PixiJS stage for replay to avoid WebGL hang
  - commit `600d9e9`: fix(web): reuse PixiJS stage on rematch to avoid WebGL hang
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 95件 + maps 8件 + web 29件 = 合計 132件。
- GitHub リポジトリ: `matun02/dots-war-sim`
- ブランチ: `update/claude-skills-config`
- `.github/workflows/` は未作成（CI 未設定）
- pnpm monorepo 構成:
  - `apps/web` — Svelte 5 + Vite + PixiJS v8（クライアント SPA）
  - `packages/core` — 決定論シミュレーション
  - `packages/maps` — マップ JSON + バリデーション
- ビルド:
  - ルート `pnpm -r build` で全パッケージビルド
  - `apps/web/package.json` の `build`: `svelte-check --tsconfig ./tsconfig.json && vite build`
  - 出力先: `apps/web/dist/`
  - `vite.config.ts`: `target: 'es2022'`, `sourcemap: true`
- ランタイム依存: PixiJS v8（WebGL2）、idb-keyval（IndexedDB）、Svelte 5
- SPA（クライアントサイドルーティングなし、index.html 1 枚）
- Node >= 22（`package.json` の `engines` に記載）、pnpm 9.15.0

## これからやるタスク
**P1-T15: Cloudflare Pages デプロイ**

ゲームを Cloudflare Pages にデプロイし、公開 URL で誰でもプレイできるようにする。
Phase 1 最終タスク。これが完了すると M3（公開済み）マイルストーン達成。

### 仕様

#### 1. ローカルビルド確認
- `pnpm -r build` がローカルで成功することを確認
- `apps/web/dist/` の内容・サイズを確認
- DESIGN.md §15 のパフォーマンス目標: バンドル（gz）< 500 KB

#### 2. Vite ビルド設定の調整（必要に応じて）
`apps/web/vite.config.ts` で以下を検討:
- `base: '/'` 明示（Cloudflare Pages はルートから配信）
- production ビルドでの sourcemap: 現在 `sourcemap: true` — そのままでも可、無効化でサイズ削減も可
- manualChunks で PixiJS を別チャンクに分割（初回ロード改善）

```ts
// 例: PixiJS を別チャンクに
build: {
  target: 'es2022',
  rollupOptions: {
    output: {
      manualChunks: {
        pixi: ['pixi.js'],
      },
    },
  },
},
```

#### 3. SPA フォールバック設定
Cloudflare Pages は SPA 対応だが、念のため:
- `apps/web/public/_redirects` に `/* /index.html 200` を配置
  （将来ルーティングを追加した場合にも対応）

#### 4. Cloudflare Pages デプロイ

**方法 A: wrangler CLI で手動デプロイ（推奨 — MVP 最速）**
```bash
# wrangler をグローバルインストール or npx
npx wrangler pages project create war-of-dots
npx wrangler pages deploy apps/web/dist --project-name=war-of-dots
```
- Cloudflare アカウントへのログインが必要（`npx wrangler login`）
- プロジェクト名: `war-of-dots`（→ `war-of-dots.pages.dev`）

**方法 B: GitHub 連携（Cloudflare Dashboard）**
- Cloudflare Dashboard → Pages → Create a project → Connect to Git
- リポジトリ: `matun02/dots-war-sim`
- ビルド設定:
  - Framework preset: None
  - Build command: `pnpm install && pnpm -r build`
  - Build output directory: `apps/web/dist`
  - Root directory: `/`（monorepo ルート）
- 環境変数:
  - `NODE_VERSION`: `22`（Cloudflare のデフォルトが古い場合に必要）
  - `PNPM_VERSION`: `9.15.0`（Cloudflare が pnpm を認識しない場合）

#### 5. GitHub Actions CI/CD（任意 — MVP 後で可）
`.github/workflows/deploy.yml` を作成:
```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r typecheck
      - run: pnpm -r test
      - run: pnpm -r build
      - name: Deploy to Cloudflare Pages
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/web/dist --project-name=war-of-dots
```
- シークレット: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` を GitHub に登録

#### 6. 動作確認
公開 URL（`war-of-dots.pages.dev` or 類似）で以下を確認:
- タイトル画面が表示される
- Start Game → AI と対戦開始
- ユニット選択・移動が動作
- 勝敗判定 → 結果画面表示
- Rematch → 新しいゲームが開始（フリーズしない）
- Watch Replay → リプレイ再生（一時停止/再開可能）
- WebGL2 が正常に初期化される（PixiJS エラーなし）
- ブラウザコンソールにエラーがない

### 実装要件
1. **既存のゲームコード（sim, render, AI, replay 等）は変更しない** — ビルド設定・デプロイ設定のみ
2. **新規パッケージ追加は最小限** — wrangler のみ（devDependencies、または npx で実行）
3. **Cloudflare Workers / Durable Objects は使わない** — Phase 3 まで不要（CLAUDE.md §2）
4. **Cloudflare 無料プランの範囲内** — 静的サイトホスティングのみ
5. **1 タスクで触るディレクトリは 2 つまで** — `apps/web`（ビルド設定） + ルート（CI/CD）（CLAUDE.md §7.2）

### テスト計画
このタスクは主にインフラ・設定作業のため、新規テストコードは不要。
- ローカルビルド確認: `pnpm -r build` が成功
- 既存テスト: `pnpm -r test` が全 132 件 green のまま
- 型チェック: `pnpm -r typecheck` が通る
- lint: `pnpm lint` が通る
- 動作確認: 公開 URL でのブラウザ目視テスト（上記§6 の項目）

### 禁止事項
* 既存のゲームロジック（`packages/core/src/sim/`）を変更する
* 既存の描画コード（`apps/web/src/game/render/`）を変更する
* 既存テスト（core 95件 + maps 8件 + web 29件 = 132件）を壊す
* CLAUDE.md §2 に記載のない新規依存を追加する（wrangler は開発ツールなので OK）
* Cloudflare Workers / Durable Objects / D1 / R2 を使う（Phase 3 以降）

### 受け入れ基準
- [ ] `pnpm -r build` がローカルで成功する
- [ ] Cloudflare Pages にデプロイされ、公開 URL でゲームが動作する
- [ ] タイトル → ゲーム → 結果 → リマッチ / リプレイの全フローが動く
- [ ] WebGL2 エラーが出ない
- [ ] ブラウザコンソールにエラーがない
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 132 件全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. デプロイ方法の選択（wrangler CLI 手動 or GitHub 連携）
2. 変更予定ファイル一覧
3. ビルド設定の調整内容（manualChunks 等）
4. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
chore(deploy): add Cloudflare Pages deployment (P1-T15)
```

[本文にデプロイ設定・ビルド最適化・公開 URL の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-task-completion.md` を参照）。
