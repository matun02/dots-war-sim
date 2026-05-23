## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3（決定論）、§7.1（作業前チェック）、§7.2（2ディレクトリ制限）と DESIGN.md §1.4（ユニット仕様）、§7.2（A* 地形コスト）を厳密に守ること。

## 現在の状態
- M3 完了（公開済み）。P1-T1〜T15 全て green。Phase 1 全完了。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
  - commit `335a662`: マップ JSON + 地形描画 — `packages/maps/`, `terrain.ts`, `cities.ts`
  - commit `efafc60`: ユニット生産 + 直線移動 — `constants.ts`, `init.ts`, `produce-units.ts`, `move-units.ts`, `units.ts`
  - commit `688d854`: 矩形選択 + 移動命令 — `input/selection.ts`, `input/commands.ts`, `apply-inputs.ts`, `selection-box.ts`
  - commit `d8441ec`: A* パスファインディング — `pathfinding/binary-heap.ts`, `astar.ts`, `recompute-paths.ts`
  - commit `eb5ef21`: 戦闘・死亡処理・都市占領 — `spatial-hash.ts`, `resolve-combat.ts`, `remove-dead.ts`, `update-city-capture.ts`
  - commit `e5be5aa`: 勝敗判定 + 結果画面 — `evaluate-game-end.ts`, `Title.svelte`, `ResultDialog.svelte`
  - commit `c617ac5`: AI v0（ルールベース） — `apps/web/src/game/ai/controller.ts`
  - commit `44ded2a`: リプレイ録画/再生 — `replay.ts`, `hash.ts`, recorder/player/storage
  - commit `4189b9a`: Cloudflare Pages デプロイ — `vite.config.ts`, `_redirects`
  - commit `15e09ff`: ゲームタイトル修正
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 95件 + maps 8件 + web 29件 = 合計 132件。
- 公開 URL: https://dots-war-sim.pages.dev/

### Heavy ユニット関連の既存実装状態

以下は **既に実装済み** で、本タスクでは変更不要:

- `packages/core/src/sim/types.ts`:
  - `UnitKind = 'light' | 'heavy'` — 型定義済み
  - `Unit.kind: UnitKind` — フィールド定義済み
  - `City.production: UnitKind` — フィールド定義済み
  - `Command` union — `select`, `move`, `line` の 3 種のみ（`set-production` は未定義 → 本タスクで追加）

- `packages/core/src/sim/constants.ts`:
  ```ts
  export const SUPPLY_MAX = 5;
  export const UNIT_STATS = {
    light: { speed: 4, attack: 1, hp: 1, attackIntervalTicks: 15, produceIntervalTicks: 60 },
    heavy: { speed: 2, attack: 3, hp: 5, attackIntervalTicks: 30, produceIntervalTicks: 180 },
  } as const;
  ```
  ★ `supplyCost` フィールドが未定義 → 本タスクで追加

- `packages/core/src/pathfinding/astar.ts`:
  - `TERRAIN_COST_HEAVY = [1, -1, -1, -1, 1]` — plain=1, mountain/forest/water=通行不可, city=1
  - `terrainCost(terrainValue, kind)` — kind で light/heavy を分岐済み
  - `findPath(map, start, goal, kind)` — kind パラメータ済み

- `packages/core/src/sim/steps/recompute-paths.ts`:
  - `findPath(state.map, unit.pos, unit.goal!, unit.kind)` — unit.kind を渡している

- `packages/core/src/sim/steps/move-units.ts`:
  - `UNIT_STATS[unit.kind].speed / TICK_RATE` — kind 対応済み

- `packages/core/src/sim/steps/resolve-combat.ts`:
  - `UNIT_STATS[attacker.kind].attack` / `.attackIntervalTicks` — kind 対応済み

- `packages/core/src/sim/steps/produce-units.ts`:
  - `UNIT_STATS[kind].hp` / `.produceIntervalTicks` — kind 対応済み
  - ★ 補給チェック: `city.supplyUsed >= SUPPLY_MAX` — light=1 前提、heavy=2 未対応
  - ★ 補給加算: `city.supplyUsed++` — 常に 1 加算、heavy=2 未対応

- `packages/core/src/sim/steps/remove-dead.ts`:
  - ★ 補給解放: `city.supplyUsed--` — 常に 1 減算、heavy=2 未対応

- `packages/core/src/sim/steps/apply-inputs.ts`:
  - `switch (cmd.type)`: `move`, `select`, `line` のみ。`set-production` 未実装

- `apps/web/src/game/input/commands.ts`:
  - `InputCollector`: `select()`, `moveCommand()`, `flush()` のみ。`setProductionCommand()` 未実装

- `apps/web/src/game/render/units.ts`:
  - ユニットは全て同じサイズの円（`radius = cellPx * 0.25`）で描画。heavy の視覚的区別なし

- `apps/web/src/App.svelte`:
  - ゲーム開始時に `startGame()` で初期化。都市クリックのハンドリングなし

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T1: Heavy ユニット**

heavy ユニット種別を完全に動作させる。既存の型・定数・A* 地形コストは実装済みのため、補給コスト差分・生産切替コマンド・UI・描画の差分実装が中心。

### 仕様

#### 1. `constants.ts` — `supplyCost` 追加

`UNIT_STATS` に `supplyCost` フィールドを追加する。DESIGN.md §1.4 準拠:

```ts
export const UNIT_STATS = {
  light: {
    speed: 4, attack: 1, hp: 1,
    attackIntervalTicks: 15, produceIntervalTicks: 60,
    supplyCost: 1,
  },
  heavy: {
    speed: 2, attack: 3, hp: 5,
    attackIntervalTicks: 30, produceIntervalTicks: 180,
    supplyCost: 2,
  },
} as const;
```

#### 2. `types.ts` — `set-production` Command 追加

```ts
export type Command =
  | { type: 'select'; player: PlayerId; ids: EntityId[] }
  | { type: 'move'; player: PlayerId; ids: EntityId[]; to: Vec2 }
  | { type: 'line'; player: PlayerId; ids: EntityId[]; from: Vec2; to: Vec2 }
  | { type: 'set-production'; player: PlayerId; cityId: CityId; production: UnitKind };
```

#### 3. `apply-inputs.ts` — `set-production` ハンドラ

```ts
case 'set-production': {
  const city = state.cities.find(
    (c) => c.id === cmd.cityId && c.owner === cmd.player,
  );
  if (city) {
    city.production = cmd.production;
  }
  break;
}
```

★ 自プレイヤーの都市のみ変更可（`c.owner === cmd.player`）。

#### 4. `produce-units.ts` — 補給コスト差分

変更前:
```ts
if (city.supplyUsed >= SUPPLY_MAX) continue;
// ... 生産 ...
city.supplyUsed++;
```

変更後:
```ts
const supplyCost = UNIT_STATS[kind].supplyCost;
if (city.supplyUsed + supplyCost > SUPPLY_MAX) continue;
// ... 生産 ...
city.supplyUsed += supplyCost;
```

#### 5. `remove-dead.ts` — 補給解放コスト差分

変更前:
```ts
city.supplyUsed--;
```

変更後:
```ts
city.supplyUsed -= UNIT_STATS[unit.kind].supplyCost;
```

#### 6. `commands.ts` — `setProductionCommand` 追加

```ts
import type { CityId, UnitKind } from '@dots-war-sim/core';

setProductionCommand(cityId: CityId, production: UnitKind): void {
  buffer.push({ type: 'set-production', player, cityId, production });
}
```

`InputCollector` インターフェースにも追加。

#### 7. `units.ts` — heavy の視覚的区別

heavy ユニットは light より大きい円で描画:
- light: `radius = cellPx * 0.25`（現在の値）
- heavy: `radius = cellPx * 0.35`

テクスチャ生成を kind ごとに分けるか、sprite の scale で対応する。
色は owner で決まるため変更なし。

#### 8. `App.svelte` — 都市クリック入力ハンドリング

左クリック（mouseup）で、クリック位置が自都市のセル上なら `set-production` コマンドを発行:
- light → heavy にトグル、heavy → light にトグル
- ユニット選択と競合する場合: 矩形選択のドラッグ距離が小さい（< 0.5 セル）かつ自都市セル上 → 生産切替を優先
- それ以外は従来通りユニット選択

### 実装要件
1. **決定論維持** — `core/sim/` 内で `Math.random()`, `Date.now()` 等禁止（CLAUDE.md §4.3）
2. **純関数** — sim ステップは副作用なし（CLAUDE.md §4.4）
3. **2 ディレクトリ制限** — `packages/core` + `apps/web` のみ（CLAUDE.md §7.2）
4. **`as const` 維持** — `UNIT_STATS` の `as const` を壊さない。型推論に影響する
5. **既存テスト不変** — 既存 132 件のテストを壊さない

### テスト計画

#### `packages/core/src/sim/steps/produce-units.test.ts`（追加ケース）
- heavy 生産: 180tick 間隔で heavy が生産される
- 補給上限: supplyUsed=4 の都市で heavy（cost=2）は生産されない
- 補給上限: supplyUsed=3 の都市で heavy（cost=2）は生産される（3+2=5=SUPPLY_MAX）
- light/heavy 混在: supplyUsed が正しく加算される

#### `packages/core/src/sim/steps/remove-dead.test.ts`（追加ケース）
- heavy 死亡時: supplyUsed が 2 減る
- light 死亡時: supplyUsed が 1 減る（既存テストと重複しなければ追加）

#### `packages/core/src/sim/steps/apply-inputs.test.ts`（追加ケース）
- `set-production` コマンド: 自都市の production が変わる
- `set-production` コマンド: 他プレイヤーの都市は変わらない
- `set-production` コマンド: 存在しない cityId は無視

#### `packages/core/src/sim/steps/resolve-combat.test.ts`（追加ケース）
- heavy vs light: heavy が attack=3 で light を一撃（hp=1）で倒す
- light vs heavy: light が attack=1、heavy の hp=5 → 5 回攻撃で倒す
- heavy の attackIntervalTicks=30 が正しく適用される

#### 統合テスト（新規 or 既存拡張）
- heavy 含む tick が決定論的であること（同一 seed + input → 同一 state hash）

### 禁止事項
* `core/sim/` 内で `Math.random()`, `Date.now()`, `console.log` 等の副作用
* `UNIT_STATS` の既存値（light/heavy の speed, attack, hp 等）を変更する
* 既存テスト（core 95件 + maps 8件 + web 29件 = 132件）を壊す
* `packages/maps` を変更する（本タスクの範囲外）
* 新規パッケージを追加する

### 受け入れ基準
- [ ] heavy ユニットが都市から生産される（`produceIntervalTicks: 180` = 6秒）
- [ ] heavy は補給スロット 2 消費（supplyUsed + 2 > 5 で生産停止）
- [ ] heavy は平地・都市のみ通行可（mountain/forest/water は通行不可）
- [ ] heavy の戦闘: attack=3, hp=5, attackIntervalTicks=30
- [ ] `set-production` コマンドで自都市の生産種別が切り替わる
- [ ] UI: 自都市クリックで生産種別トグルが機能する
- [ ] heavy ユニットが light と視覚的に区別できる（サイズ差）
- [ ] 死亡時に正しい補給コスト分（light=1, heavy=2）が解放される
- [ ] 決定論テスト: 同一 seed・同一 input で heavy 含む sim が再現する
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 132 件 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(sim): add heavy unit with supply cost and production toggle (P2-T1)
```

[本文に変更要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。
