## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §5「ゲームループの規約」と DESIGN.md §4「ゲームループ詳細」を厳密に守ること。

## 現在の状態
- M0（スケルトン）完了済み。P1-T1〜T4 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- `packages/core/src/sim/tick.ts` に `tick(state, inputs, rng): GameState` が実装済み。
- `packages/core/src/rng.ts` に `Rng` クラス（mulberry32）実装済み。
- `apps/web` は Vite + Svelte 5 + TypeScript のスケルトンのみ（テスト 0 件、`--passWithNoTests`）。
- `apps/web` にはまだ vitest 用の環境設定（jsdom 等）がない。
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T5: ゲームループ（クライアント側）**

`apps/web/src/game/loop.ts` に固定 30Hz tick + RAF render の骨格を作る。

### 仕様 (DESIGN.md §4.1〜4.2 に準拠)

```ts
// apps/web/src/game/loop.ts
export interface LoopOptions {
  tickRateHz: number;
  onTick: () => void;
  onRender: (alpha: number) => void;
}
export function createLoop(opts: LoopOptions): {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
};
```

#### 実装要件
1. **accumulator パターン**（DESIGN.md §4.2 参照）
   - `TICK_DT = 1000 / tickRateHz`
   - 毎フレーム `dt = now - last` を accumulator に加算
   - `while (acc >= TICK_DT)` で `onTick()` を呼び、`acc -= TICK_DT`
   - 残った `acc / TICK_DT` を `alpha` として `onRender(alpha)` に渡す
2. **スパイク対策**: `MAX_FRAME_DT = 250`ms。`dt = Math.min(now - last, MAX_FRAME_DT)` で暴発防止（タブ復帰時等）
3. **1 フレームあたり最大 tick 回数**はスパイク対策により自然に制限される（250ms / 33.33ms ≈ 7 回）
4. `performance.now()` を使うのは loop.ts 内部だけ（tick 関数の外）
5. tick 関数は **引数で受け取る（依存逆転）** — `core/sim` を直接 import しない

#### API 仕様
- `start()`: ループ開始。`requestAnimationFrame` でフレーム駆動を始める
- `stop()`: ループ完全停止。RAF をキャンセルし、内部状態をリセット
- `pause()`: tick・render を一時停止（RAF は回り続けてもよいが、tick/render は呼ばない）
- `resume()`: pause 解除。accumulator は 0 にリセットして再開（溜まった dt で暴発させない）

### テスト環境の準備
- `apps/web` に vitest 用の環境設定が必要。以下のいずれかで `requestAnimationFrame` と `performance.now()` をテスト可能にする:
  - vite.config.ts の `test` セクションに `environment: 'jsdom'` を追加
  - または別途 `vitest.config.ts` を作成
- テストには `vi.useFakeTimers()` を使用。vitest の fake timers は `requestAnimationFrame` と `performance` も fake 化できる

### テスト計画 (`apps/web/src/game/loop.test.ts`)
1. **基本動作**: `start()` 後に 1000ms 進めたら `onTick` が 30 回呼ばれる
2. **100ms テスト**: 100ms 経過で `onTick` が 3 回呼ばれる（受け入れ基準）
3. **pause/resume**: `pause()` 中は `onTick` が呼ばれない。`resume()` で再開すると再び呼ばれる
4. **stop**: `stop()` 後は `onTick` も `onRender` も呼ばれない
5. **スパイク対策**: 500ms 一気に進めても `onTick` が 7 回程度（MAX_FRAME_DT=250 による上限）
6. **alpha 値**: `onRender` に渡される `alpha` が `[0, 1)` の範囲であること

### 禁止事項
* `Math.random()` ★絶対に使わない
* `Date.now()` ★絶対に使わない（時刻取得は `performance.now()` のみ）
* `core/sim` の直接 import（loop.ts はコールバックで受け取る。依存逆転）
* loop.ts 内で `console.log` / `console.warn` 等の副作用
* `async/await`, `Promise` — ループは RAF ベースの同期駆動

### 受け入れ基準
- [ ] `pnpm --filter @war-of-dots/web test` 全 pass
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] 1000ms 進行で onTick が 30 回呼ばれる
- [ ] 100ms 進行で onTick が 3 回呼ばれる
- [ ] pause 中は onTick が呼ばれない
- [ ] `Math.random` も `Date.now` も新規ファイルに登場しない（grep で確認）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(web): add fixed-rate game loop with accumulator pattern (P1-T5)
```

[本文に accumulator パターン・スパイク対策の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること。
