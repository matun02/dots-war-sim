## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3（決定論）、§7.2（2ディレクトリ制限）と DESIGN.md §8.1（影響マップ）、§8.2（計算頻度）を厳密に守ること。

## 現在の状態
- M3 完了（公開済み）。Phase 1 全完了。P2-T1（Heavy ユニット）完了。
  - commit `{P2-T1のcommit}`: heavy ユニット実装 — `constants.ts` supplyCost追加, `types.ts` set-production Command, `apply-inputs.ts`, `produce-units.ts`, `remove-dead.ts` 補給コスト差分, `commands.ts`, `units.ts` 視覚区別, `App.svelte` 都市クリック
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: 合計 {P2-T1完了後の件数} 件。

### 影響マップ関連の既存実装状態

- `packages/core/src/sim/types.ts`:
  - `GameState`: `map: MapDef`, `units: Unit[]`, `players: Player[]`
  - `Unit`: `owner: PlayerId`, `pos: Vec2`, `kind: UnitKind`
  - `MapDef`: `width: number`, `height: number`
  - `PlayerId`: branded number type

- `packages/core/src/sim/constants.ts`:
  - `UNIT_STATS.light.supplyCost: 1`, `UNIT_STATS.heavy.supplyCost: 2`（P2-T1 で追加）

- `packages/core/src/sim/index.ts`:
  - 現在の export 一覧: types, tick, createInitialState, constants, SpatialHash, hashState
  - ★ `computeInfluenceMap` は未実装 → 本タスクで新規追加

- `packages/core/src/sim/influence-map.ts`: **存在しない** → 本タスクで新規作成

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T2: 影響マップ**

各陣営のユニット配置から影響マップを計算する純関数を実装する。AI（P2-T3）と前線描画（P2-T4）の基盤となるモジュール。

### 仕様

#### 1. `influence-map.ts` — 新規作成

ファイル: `packages/core/src/sim/influence-map.ts`

```ts
import type { GameState, PlayerId } from './types.js';

/** 影響マップの計算結果 */
export interface InfluenceData {
  /** maps[playerId] = Int16Array(width * height)。各セルの影響度。 */
  maps: Int16Array[];
  width: number;
  height: number;
}

/**
 * GameState から影響マップを計算する（純関数）。
 *
 * 1. 全セルを 0 クリア
 * 2. 各ユニット位置に重みを加算（light=100, heavy=200）
 * 3. ガウシアン拡散（3回反復、3×3 均一カーネル）
 *
 * 呼び出し元で 5 tick ごとに呼ぶ想定（DESIGN.md §8.2）。
 * この関数自体は頻度制御しない（純関数）。
 */
export function computeInfluenceMap(state: GameState): InfluenceData;

/**
 * 2 陣営の影響マップの差分を計算する。
 * diff[i] = maps[playerA][i] - maps[playerB][i]
 * 前線描画（P2-T4）で使用。
 */
export function computeInfluenceDiff(
  data: InfluenceData,
  playerA: PlayerId,
  playerB: PlayerId,
): Int16Array;
```

#### 2. 計算アルゴリズム詳細

**ステップ 1: 初期化**
```
for each player p:
  maps[p] = new Int16Array(width * height)  // 全 0
```

**ステップ 2: ユニット重み加算**
```
for each unit u:
  idx = floor(u.pos.y) * width + floor(u.pos.x)
  if idx in bounds:
    maps[u.owner][idx] += (u.kind === 'heavy' ? 200 : 100)
```

**ステップ 3: ガウシアン拡散（3 回反復）**
3×3 均一カーネルでぼかす。各セルの値を周囲 8 セル + 自身の平均で置換:
```
for iter = 0..2:
  for each cell (x, y):
    sum = 0, count = 0
    for dx = -1..1, dy = -1..1:
      nx = x + dx, ny = y + dy
      if in bounds:
        sum += maps[p][ny * width + nx]
        count++
    next[y * width + x] = floor(sum / count)
  swap(maps[p], next)
```

★ 整数演算のみ（`Math.floor` で切り捨て）。決定論維持。
★ 地形は無視する（影響は全セルに拡散）。

#### 3. `index.ts` — export 追加

```ts
export { computeInfluenceMap, computeInfluenceDiff } from './influence-map.js';
export type { InfluenceData } from './influence-map.js';
```

### 実装要件
1. **決定論維持** — 整数演算のみ。浮動小数の順序依存なし（CLAUDE.md §4.3）
2. **純関数** — `computeInfluenceMap` は GameState を読み取り専用で扱い、InfluenceData を返す。副作用なし
3. **1 ディレクトリ制限** — `packages/core` のみ（CLAUDE.md §7.2）
4. **パフォーマンス意識** — 64×36 マップで 5tick ごと呼ばれる。TypedArray（Int16Array）使用で高速化
5. **core/sim 依存ルール** — DOM, Pixi, Svelte, Node, fetch 禁止（CLAUDE.md §2.3）

### テスト計画

#### `packages/core/src/sim/influence-map.test.ts`（新規）

- **空の状態**: ユニットなし → 全セル 0
- **単一ユニット**: light 1体 → そのセルに 100、拡散後に周囲にも値が広がる
- **heavy 重み**: heavy 1体 → そのセルに 200
- **拡散検証**: ユニット 1体の拡散後、隣接セルの値 > 0、離れたセルは減衰
- **2 陣営分離**: player 0 と player 1 のマップが独立
- **決定論**: 同じ state → 同じ InfluenceData（2 回計算で一致）
- **computeInfluenceDiff**: 差分が正しく計算される（正 = playerA 優勢、負 = playerB 優勢）
- **境界**: マップ端のユニットで out of bounds にならない
- **整数性**: 全値が整数（Int16Array なので自動だが、ロジック上も確認）

### 禁止事項
* `core/sim/` 内で `Math.random()`, `Date.now()`, `console.log` 等の副作用
* 浮動小数演算に依存する集計（整数演算のみ）
* `GameState` を変更する（読み取り専用）
* 既存テスト（{P2-T1完了後の件数}件）を壊す
* `apps/web` を変更する（本タスクの範囲外）
* `tick.ts` の処理順を変更する（影響マップは tick 外で計算）

### 受け入れ基準
- [ ] `computeInfluenceMap(state)` が `InfluenceData` を返す
- [ ] `computeInfluenceDiff(data, pA, pB)` が差分 `Int16Array` を返す
- [ ] ユニットなし → 全セル 0
- [ ] light=100, heavy=200 の重み加算が正しい
- [ ] 3 回ガウシアン拡散で周囲に値が広がる
- [ ] 整数演算のみ（決定論維持）
- [ ] 同一入力で同一出力（決定論テスト）
- [ ] `packages/core/src/sim/index.ts` から export されている
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(sim): add influence map computation with Gaussian diffusion (P2-T2)
```

[本文に変更要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。
