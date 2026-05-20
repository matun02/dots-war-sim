## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3「決定論的シミュレーション」§4.5「Pixi / DOM レイヤー」§4.6「Svelte レイヤー」と DESIGN.md §2.2「データフロー」§5.2「各ステップの責務」§12.2「入力（PC）」を厳密に守ること。

## 現在の状態
- M1（ゲーム表示）完了済み。P1-T1〜T8 全て green。
  - commit `bcd442d`: pnpm workspace skeleton
  - commit `9d6f2d9`: 決定論 RNG (mulberry32) — `packages/core/src/rng.ts`
  - commit `b1f7fb7`: ゲーム状態型定義 — `packages/core/src/sim/types.ts`
  - commit `7488397`: tick orchestrator + 8 空ステップ — `packages/core/src/sim/tick.ts`
  - commit `12f1fab`: ゲームループ — `apps/web/src/game/loop.ts`
  - commit `4b8f443`: PixiJS v8 ステージ + グリッド — `apps/web/src/game/render/stage.ts`, `grid.ts`
  - commit `335a662`: マップ JSON + 地形描画 — `packages/maps/`, `terrain.ts`, `cities.ts`
  - commit `efafc60`: ユニット生産 + 直線移動 — `constants.ts`, `init.ts`, `produce-units.ts`, `move-units.ts`, `units.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 39件 + maps 8件 + loop 6件 = 合計 53件。
- `packages/core/src/sim/types.ts` に全型定義済み:
  - `Command = { type: 'select'; player: PlayerId; ids: EntityId[] } | { type: 'move'; player: PlayerId; ids: EntityId[]; to: Vec2 } | { type: 'line'; player: PlayerId; ids: EntityId[]; from: Vec2; to: Vec2 }`
  - `InputFrame = { tick: number; commands: Command[] }`
  - `Unit` に `goal: Vec2 | null`, `path: Vec2[] | null` フィールドあり
- `packages/core/src/sim/steps/apply-inputs.ts` — **空実装**（`_state`, `_inputs` を無視するだけ）:
  ```ts
  export function applyInputs(_state: GameState, _inputs: readonly InputFrame[]): void {}
  ```
- `packages/core/src/sim/constants.ts` — `TICK_RATE=30`, `SUPPLY_MAX=5`, `UNIT_STATS` 定義済み
- `packages/core/src/sim/init.ts` — `createInitialState(map, players, seed)` 実装済み
- `apps/web/src/game/render/units.ts` — `createUnitRenderer(app, cellPx)` で Sprite プール + prev/cur 補間描画
- `apps/web/src/game/input/` — **ディレクトリ未作成**
- `apps/web/src/stores/` — **ディレクトリ未作成**
- `apps/web/src/App.svelte` — 現在の状態:
  - `onMount` で createStage → loadMap → createInitialState → drawTerrain → drawGrid → drawCities → createUnitRenderer → createLoop
  - ゲームループ内: `tick(prev, [], rng)` で空入力。生成ユニットに `unit.goal = { x: 32, y: 18 }` をハードコード（動作確認用）
  - ★T9 でこのハードコード goal を削除し、マウス入力に置き換える
- Node v24.15.0, pnpm 9.15.0 が PATH 通済。
- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。

## これからやるタスク
**P1-T9: 入力（矩形選択 + 移動命令）**

マウスでユニットを矩形選択し、右クリックで移動命令を出せるようにする。
apply-inputs.ts を実装して Command → Unit.goal の反映を行う。

### 仕様

#### 1. `apps/web/src/game/input/selection.ts` — 矩形選択

```ts
import type { EntityId, Unit, Vec2 } from '@war-of-dots/core';

export interface SelectionBox {
  startWorld: Vec2;   // ドラッグ開始のワールド座標
  endWorld: Vec2;     // 現在のワールド座標
}

export function unitsInRect(
  units: readonly Unit[],
  player: number,       // プレイヤー 0 のユニットのみ選択可
  topLeft: Vec2,        // セル座標
  bottomRight: Vec2,    // セル座標
): EntityId[] {
  // units のうち owner === player かつ AABB 内にいるものの id を返す
  // id 昇順でソート（決定論のため）
}
```

- canvas のマウス座標 → ワールド座標（`clientX / cellPx`, `clientY / cellPx`）
- 左ドラッグで矩形範囲を指定。mousedown → mousemove → mouseup
- ドラッグ中は矩形の可視化（半透明のボックスを描画）

#### 2. `apps/web/src/game/input/commands.ts` — コマンド生成 + 入力バッファ

```ts
import type { Command, PlayerId, EntityId, Vec2 } from '@war-of-dots/core';

export interface InputCollector {
  /** 選択されているユニットの ID 一覧 */
  selectedIds: EntityId[];

  /** 矩形選択完了時に呼ぶ */
  select(ids: EntityId[]): void;

  /** 右クリック時に呼ぶ — 選択中ユニットへ移動命令 */
  moveCommand(to: Vec2): void;

  /** 次の tick に渡す Command[] を取り出し、バッファをクリア */
  flush(): Command[];
}

export function createInputCollector(player: PlayerId): InputCollector {
  // 内部にバッファ: Command[] を保持
  // select(): selectedIds を更新 + select Command をバッファに追加
  // moveCommand(): selectedIds が空でなければ move Command をバッファに追加
  // flush(): バッファの中身を返して空にする
}
```

#### 3. `packages/core/src/sim/steps/apply-inputs.ts` — 入力反映

```ts
import type { GameState, InputFrame } from '../types.js';

export function applyInputs(
  state: GameState,
  inputs: readonly InputFrame[],
): void {
  // 各 InputFrame の各 Command について:
  //
  // type: 'move'
  //   → ids に該当する unit（owner が player と一致）の goal を to に設定
  //   → path を null に設定（P1-T10 で recomputePaths が再計算する）
  //
  // type: 'select'
  //   → sim 側では何もしない（選択状態は client 側のみ）
  //
  // type: 'line'
  //   → P1-T9 では未実装。スキップ
}
```

- ★MUST: owner チェック（他プレイヤーのユニットを操作できないようにする）
- ★MUST: 存在しない id を無視する（安全性）

#### 4. `apps/web/src/game/render/selection-box.ts` — 選択矩形の描画

```ts
import { type Application, Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@war-of-dots/core';

export function createSelectionRenderer(app: Application, cellPx: number): {
  show(startWorld: Vec2, endWorld: Vec2): void;
  hide(): void;
  container: Container;
} {
  // 半透明の矩形（fill alpha 0.15、stroke alpha 0.6、プレイヤー色）
  // show() で矩形を更新、hide() で非表示
}
```

#### 5. `apps/web/src/game/render/units.ts` の拡張 — 選択ユニットの視覚フィードバック

```ts
// 既存の update() に selectedIds パラメータを追加:
update(
  prevUnits: readonly Unit[],
  curUnits: readonly Unit[],
  alpha: number,
  selectedIds?: readonly EntityId[],
): void;

// selectedIds に含まれるユニットの sprite に選択リング（白い枠線）を表示
// 方法: 選択されている sprite に tint を変えるか、別の Graphics オーバーレイを重ねる
```

#### 6. `apps/web/src/App.svelte` の更新 — 入力統合

```ts
onMount(async () => {
  // ... 既存のセットアップ ...

  const inputCollector = createInputCollector(0 as PlayerId);

  // マウスイベントを canvas に登録
  // - mousedown（左ボタン）: ドラッグ開始
  // - mousemove: ドラッグ中は選択ボックス更新
  // - mouseup（左ボタン）: 矩形内ユニット抽出 → inputCollector.select()
  // - contextmenu（右クリック）: inputCollector.moveCommand()
  //   → e.preventDefault() でブラウザメニューを抑制

  const selectionRenderer = createSelectionRenderer(app, cellPx);
  app.stage.addChild(selectionRenderer.container);

  loop = createLoop({
    tickRateHz: 30,
    onTick: () => {
      prev = cur;
      const commands = inputCollector.flush();
      const frame: InputFrame = { tick: cur.tick, commands };
      cur = tick(prev, [frame], rng);
    },
    onRender: (alpha) => {
      unitRenderer.update(prev.units, cur.units, alpha, inputCollector.selectedIds);
      // 選択ボックスの描画（ドラッグ中のみ）
    },
  });
  loop.start();

  // ★ハードコード goal を削除
});
```

### 実装要件
1. **`core/sim` 内は決定論厳守** — apply-inputs は純関数的に state を変更する（CLAUDE.md §4.3）
2. **Pixi の import は `render/` 配下のみ** — input/ からは Pixi を import しない（CLAUDE.md §4.5）
3. **input/ は `core/sim/types` のみに依存** — DOM イベントは使うが、Pixi 直接操作禁止（DESIGN.md §2.3）
4. **一方向データフロー** — Input → Command → InputFrame → tick() → GameState → Render（DESIGN.md §2.2）
5. **owner チェック必須** — apply-inputs で他プレイヤーのユニットを操作不可にする
6. **既存の structuredClone パターンを踏襲** — tick.ts 内で clone 済みの state を受け取るので apply-inputs は in-place 変更で OK

### テスト計画

#### `packages/core/src/sim/steps/apply-inputs.test.ts`
- move コマンドで対象ユニットの goal が更新される
- 存在しない id の move コマンドは無視される（crash しない）
- 他プレイヤーのユニットへの move コマンドは無視される
- select コマンドでは state が変更されない（client-only）
- 複数の InputFrame が順に適用される
- move で path が null にリセットされる

#### `apps/web/src/game/input/selection.test.ts`（可能なら）
- unitsInRect: AABB 内のユニットのみが返る
- unitsInRect: 他プレイヤーのユニットは含まれない
- unitsInRect: 結果は id 昇順

### 禁止事項
* `Math.random()` / `Date.now()` / `performance.now()` を sim 内で使用
* Pixi の import を `render/` 以外に置く
* `core/sim` 内で `async/await`、`Promise`、`setTimeout`
* input/ から Pixi を直接 import する
* 既存テスト（core 39件 + maps 8件 + loop 6件）を壊す

### 受け入れ基準
- [ ] 左ドラッグで矩形選択し、プレイヤー 0 のユニットが選択される
- [ ] 選択中ユニットに視覚的フィードバック（リングや色変化）がある
- [ ] 右クリックで選択ユニットが移動命令を受け、目的地に向かって移動する
- [ ] ハードコード goal (`{ x: 32, y: 18 }`) が削除されている
- [ ] apply-inputs が owner チェックを行い、他プレイヤーのユニットを操作できない
- [ ] `pnpm --filter @war-of-dots/web dev` で操作が確認できる
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 53 件 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. テスト計画（どんなケースを書くか）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(input): add rect selection and move commands (P1-T9)
```

[本文に selection・commands・apply-inputs・選択描画の要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/TASKS.md` と `.claude/CLAUDE.md` の変更履歴を更新してコミット・push すること（`.claude/skills/skill-update-tasks.md` と `.claude/skills/skill-update-claude.md` と `.claude/skills/skill-doc-commit.md` を参照）。
