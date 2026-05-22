## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§4.5「Pixi / DOM レイヤー」と DESIGN.md §1.4「ユニット仕様」§5「シミュレーション」を厳密に守ること。

## 現在の状態
- M0（スケルトン）完了済み。P1-T1〜T7 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
  - commit `335a662`: マップ JSON + 地形描画 — `packages/maps/`, `terrain.ts`, `cities.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 22件 + maps 8件 + loop 6件 = 合計 36件。
- `packages/core/src/sim/types.ts` に全型定義済み（`Unit`, `City`, `GameState`, `MapDef` 等）。
- `packages/core/src/sim/tick.ts` に orchestrator 実装済み。8 ステップ関数は全て**空実装**（`_state` を受けて何もしない）。
- `packages/core/src/sim/steps/` に 8 ファイル:
  - `apply-inputs.ts` — 空（`_state`, `_inputs` を無視）
  - `produce-units.ts` — 空（`_state`, `_rng` を無視）
  - `move-units.ts` — 空（`_state` を無視）
  - 他 5 ファイルも同様に空
- `apps/web/src/game/loop.ts` — `createLoop({ tickRateHz, onTick, onRender })` API。start/stop/pause/resume。accumulator パターン。
- `apps/web/src/App.svelte` — 現在は `onMount` で createStage → loadMap → drawTerrain → drawGrid → drawCities のみ。ゲームループ未統合。
- `apps/web/src/game/render/` に `stage.ts`, `grid.ts`, `terrain.ts`, `cities.ts` が存在。
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T8: ユニット生成と直線移動（戦闘前）**

都市が時間経過でユニット（dot）を生産し、目標地点へ直線移動するところまで実装する。

### 仕様

#### 1. `packages/core/src/sim/init.ts` — 初期状態生成

```ts
import type { GameState, MapDef, Player } from './types.js';

export function createInitialState(
  map: MapDef,
  players: Player[],
  seed: number,
): GameState {
  // 1. MapDef.spawns に基づき、各 spawn の cityId に対応する City を
  //    完全な City オブジェクトとして組み立てる（owner = spawn.player）
  // 2. spawns に含まれない都市は owner = null（中立）
  // 3. 各 City の初期値:
  //    - produceCooldownTicks: 0（即生産開始可能）
  //    - captureProgressTicks: 0
  //    - capturingPlayer: null
  //    - supplyUsed: 0
  // 4. units: []（空）
  // 5. tick: 0, nextEntityId: 0, result: null
  // 6. GameState を返す
}
```

- `core/sim/index.ts` から re-export する

#### 2. `packages/core/src/sim/steps/produce-units.ts` — ユニット生産

```ts
export function produceUnits(state: GameState, _rng: Rng): void {
  // 各 city について:
  // 1. owner が null → スキップ
  // 2. capturingPlayer が null でない（占領進行中）→ スキップ
  // 3. supplyUsed >= SUPPLY_MAX (5) → スキップ
  // 4. produceCooldownTicks > 0 → デクリメントしてスキップ
  // 5. 上記を全パスしたら:
  //    a. 新 Unit を生成:
  //       - id: state.nextEntityId++ as EntityId
  //       - owner: city.owner
  //       - kind: city.production
  //       - homeCity: city.id
  //       - pos: { x: city.pos.x, y: city.pos.y }（都市位置に出現）
  //       - hp: UNIT_STATS[kind].hp
  //       - path: null, goal: null
  //       - attackCooldownTicks: 0
  //    b. state.units.push(unit)
  //    c. city.supplyUsed++
  //    d. city.produceCooldownTicks = UNIT_STATS[kind].produceIntervalTicks
}
```

**ユニット定数** — DESIGN.md §1.4 に基づく:

```ts
// packages/core/src/sim/constants.ts（新規作成）
export const TICK_RATE = 30;
export const SUPPLY_MAX = 5;

export const UNIT_STATS = {
  light: {
    speed: 4,            // セル/秒
    attack: 1,
    hp: 1,
    attackIntervalTicks: 15,  // 0.5s × 30Hz
    produceIntervalTicks: 60, // 2s × 30Hz
  },
  heavy: {
    speed: 2,
    attack: 3,
    hp: 5,
    attackIntervalTicks: 30,  // 1.0s × 30Hz
    produceIntervalTicks: 180, // 6s × 30Hz
  },
} as const;
```

#### 3. `packages/core/src/sim/steps/move-units.ts` — 直線移動

```ts
export function moveUnits(state: GameState): void {
  // 各 unit について:
  // 1. goal が null → スキップ
  // 2. 現在位置から goal への距離を計算
  // 3. 距離 < 0.05 → goal 到達。goal = null, path = null にして次へ
  // 4. 単位ベクトル = (goal - pos) / distance
  // 5. 移動量 = UNIT_STATS[unit.kind].speed * (1000 / 30 / 1000)
  //    = UNIT_STATS[unit.kind].speed / 30 セル/tick
  // 6. 移動量 > 残り距離 の場合は残り距離分だけ移動（オーバーシュート防止）
  // 7. pos.x += dx * stepSize, pos.y += dy * stepSize
}
```

- ★MUST NOT: `Date.now()` や `performance.now()` を使わない。移動は tick 単位で計算する
- パスファインディングは P1-T10 で導入。この段階では直線移動のみ

#### 4. `apps/web/src/game/render/units.ts` — ユニット描画

```ts
import { type Application, Container, Graphics, RenderTexture, Sprite } from 'pixi.js';
import type { Unit } from '@war-of-dots/core';

const PLAYER_COLORS: Record<number, number> = {
  0: 0x4488ff,  // blue
  1: 0xff8844,  // orange
};

export function createUnitRenderer(app: Application, cellPx: number): {
  update(prevUnits: readonly Unit[], curUnits: readonly Unit[], alpha: number): void;
  container: Container;
} {
  // 1. Container を作成
  // 2. 各プレイヤー色の小円テクスチャを RenderTexture で事前生成（半径 = cellPx * 0.25 程度）
  // 3. update() で:
  //    a. 現在の Sprite 数と curUnits の差を埋める（追加 or 削除）
  //    b. 各ユニットについて prev/cur の pos を alpha で線形補間
  //    c. sprite.x = lerp(prev.pos.x, cur.pos.x, alpha) * cellPx
  //    d. sprite.y = lerp(prev.pos.y, cur.pos.y, alpha) * cellPx
  //    e. tint でプレイヤー色を設定
  // 4. 新規ユニット（prev に対応がない）は補間なし（cur の位置をそのまま使う）
  // 5. 死亡ユニット（cur に対応がない）は sprite を非表示にする
}
```

- PixiJS v8 の API を使用（`new Graphics()` → `.circle().fill()` → `app.renderer.generateTexture(g)` でテクスチャ化）
- Container を stage に追加するのは呼び出し側（App.svelte）で行う

#### 5. `apps/web/src/App.svelte` の更新 — ゲームループ統合

```ts
onMount(async () => {
  app = await createStage(canvasEl);
  const map = loadMap(firstBloodJson);

  // 初期状態を作る
  const players: Player[] = [
    { id: 0 as PlayerId, name: 'Player 1', color: 0x4488ff, alive: true },
    { id: 1 as PlayerId, name: 'Player 2', color: 0xff8844, alive: true },
  ];
  let prev = createInitialState(map, players, 42);
  let cur = structuredClone(prev);
  const rng = new Rng(42);

  // 静的レイヤー
  drawTerrain(app, map, 20);
  drawGrid(app, map.width, map.height, 20);
  const citiesContainer = drawCities(app, cur.cities, 20);

  // ユニットレンダラー
  const unitRenderer = createUnitRenderer(app, 20);
  app.stage.addChild(unitRenderer.container);

  // ★仮: 生産されたユニットにハードコード goal を設定（動作確認用）
  // 全ユニットの goal を (32, 18) — マップ中央付近に設定
  // ※ P1-T9 で入力システムが入ったら削除する

  // ゲームループ
  const loop = createLoop({
    tickRateHz: 30,
    onTick: () => {
      prev = cur;
      // 仮: 新規生成されたユニットに goal を設定
      for (const unit of cur.units) {
        if (unit.goal === null) {
          unit.goal = { x: 32, y: 18 };
        }
      }
      cur = tick(prev, [], rng);
    },
    onRender: (alpha) => {
      unitRenderer.update(prev.units, cur.units, alpha);
      // 都市の再描画（supplyUsed 等が変わるため）
      // → 簡易実装: 毎フレーム描画し直すか、dirty フラグで最適化
    },
  });
  loop.start();
});
```

### 実装要件
1. **`core/sim` 内は決定論厳守** — `Math.random()`, `Date.now()`, `Map`/`Set` イテレーション順依存を禁止（CLAUDE.md §4.3）
2. **定数は `constants.ts` に集約** — マジックナンバーを避ける
3. **`init.ts` は `core/sim/index.ts` から re-export** — 外部パッケージ（web）が使う
4. **Pixi の import は `render/` 配下のみ** — CLAUDE.md §4.5
5. **ユニット描画は prev/cur 補間** — ゲームループの alpha 値で滑らかに動かす
6. **tick は空入力 `[]` で回す** — P1-T9 で入力システムを入れるまでは
7. **仮の goal ハードコード** — 動作確認用。ユニットが中央に向かって移動するのを目視確認
8. **`structuredClone` による immutability** — tick.ts の既存パターンを踏襲

### テスト計画

#### `packages/core/src/sim/init.test.ts`
- `createInitialState` が正しい初期 `GameState` を返す
- spawn 都市に owner が設定される
- 非 spawn 都市は owner = null
- units が空配列で始まる
- tick が 0 から始まる

#### `packages/core/src/sim/steps/produce-units.test.ts`
- owner のある都市から 60 tick 後にユニットが 1 体生産される
- 補給上限 (5) に達したら生産停止
- owner が null の都市は生産しない
- `produceCooldownTicks` が正しくデクリメントされる
- 占領進行中（`capturingPlayer !== null`）は生産しない
- 生成されたユニットの pos が都市の pos と一致する
- `nextEntityId` がインクリメントされる

#### `packages/core/src/sim/steps/move-units.test.ts`
- goal に向かって 1 tick で `speed / 30` セル移動する
- goal に到達（距離 < 0.05）したら goal = null になる
- goal が null のユニットは動かない
- オーバーシュートしない（残り距離 < 1 tick 分の移動量のとき）
- 30 tick（1 秒）で light ユニットが約 4 セル移動する

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を sim 内で使用
* Pixi の import を `render/` 以外に置く
* `core/sim` 内で `async/await`、`Promise`、`setTimeout`
* 既存テスト（core 22件 + maps 8件 + loop 6件）を壊す

### 受け入れ基準
- [ ] `packages/core/src/sim/init.ts` が作成され、`createInitialState` が動作する
- [ ] `produce-units.ts` でユニットが生産され、補給上限で停止する
- [ ] `move-units.ts` でユニットが goal に向かって直線移動する
- [ ] `pnpm --filter @war-of-dots/web dev` で都市から dot が湧き、中央に向かって移動するのが見える
- [ ] ユニット描画に prev/cur 補間が効いている（滑らかに動く）
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 36 件 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(sim): add unit production and linear movement (P1-T8)
```

[本文に init・生産・移動・ユニット描画の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
