## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §7.2（2ディレクトリ制限）を厳密に守ること。

## 現在の状態
- M3 完了。Phase 1 全完了。P2-T1〜T4.1 完了。
  - commit `a6e6beb`: P2-T1 heavy ユニット実装
  - commit `ff1390f`: P2-T2 影響マップ実装
  - commit `dc97deb`: P2-T3 AI v1 実装
  - commit `41c8257`: P2-T4 前線描画（マーチングスクエア）
  - commit `1816f95`: P2-T4.1 前線・領土システム再設計（初期配置+円形フォールオフ+都市重み）
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: core 133 + maps 8 + web 36 = 合計 177 件。

### マップ関連の既存実装状態

- `packages/maps/src/data/first-blood.json`:
  - 64×36、都市 5、spawn 2 プレイヤー
  - 地形: 中央に mountain（1）帯 + 左右に forest（2）帯
  - 全都市 `production: "light"`

- `packages/maps/src/schema.ts`:
  - `MapJsonSchema`: valibot バリデーション
  - id（非空文字列）、width/height（1〜256）、terrain（number[]）、cities、spawns
  - cities: `{ id: number, pos: { x, y }, production: 'light' | 'heavy' }`
  - spawns: `{ player: number, cityId: number }`

- `packages/maps/src/loader.ts`:
  - `loadMap(json): MapDef` — JSON → MapDef 変換 + バリデーション
  - terrain 値: 0=plain, 1=mountain, 2=forest, 3=water
  - 都市位置のマップ境界チェック、spawn の cityId 存在チェック

- `packages/maps/src/index.ts`:
  ```ts
  export { loadMap } from './loader.js';
  export { MapJsonSchema } from './schema.js';
  export { default as firstBloodJson } from './data/first-blood.json';
  ```

- `apps/web/src/ui/Title.svelte`:
  - 「Start Game」ボタンのみ。マップ選択 UI なし
  - `Props: { onstart: () => void }`

- `apps/web/src/App.svelte`:
  - `startGame()` 内で `loadMap(firstBloodJson)` をハードコード
  - ★ マップ選択機能なし → 本タスクで追加

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T5: マップ追加（計 5 枚）**

既存の first-blood に加え、4 つの新規マップを作成し、タイトル画面でマップを選択できるようにする。

### 仕様

#### 1. 新規マップ 4 枚

全マップ共通: 2 プレイヤー spawn、terrain 値は `0=plain, 1=mountain, 2=forest, 3=water`。

| ID | テーマ | サイズ | 都市数 | 設計意図 |
|---|---|---|---|---|
| `bridge` | 中央橋 | 48×36 | 6 | 水域で分断、中央の平地橋で接続。チョークポイント戦 |
| `four-corners` | 4 隅都市 | 48×48 | 8 | 4 隅に初期都市、中央に中立都市群。多方面展開 |
| `strait` | 海峡 | 64×36 | 6 | 縦に水域で二分、上下に狭い海峡。挟撃が可能 |
| `corridor` | 回廊 | 64×36 | 6 | 山脈で区切られた 3 本の回廊。ルート選択が重要 |

**マップ設計の注意**:
- heavy ユニットが活躍できるよう、平地が十分にある（P2-T1 考慮）
- 各マップで異なる戦略が要求される地形配置
- 左右（または上下）対称にする（公平性）
- spawn は対角または対辺に配置

#### bridge マップ（48×36）
```
左半分: player 0 陣地（平地 + 都市 2）
中央: 水域帯（width=8）、中央に平地の橋（width=4, height=6）
右半分: player 1 陣地（平地 + 都市 2）
中央上下: 中立都市 2
```

#### four-corners マップ（48×48）
```
4 隅: 各プレイヤーの初期都市（左上+右下 = P0、右上+左下 = P1）
中央: 中立都市 4（十字配置）
地形: 各隅から中央への通路、間に forest 帯
```

#### strait マップ（64×36）
```
左半分: player 0 陣地
右半分: player 1 陣地
中央: 水域の縦壁（width=6）、上部と下部に海峡（幅 3 セル）
海峡近くに中立都市 2
```

#### corridor マップ（64×36）
```
3 本の横方向回廊（平地）
回廊間を mountain 壁で分離（各壁 height=3〜4）
各回廊に都市 1（P0 側 1、P1 側 1）
中央回廊に中立都市 2
```

#### 2. JSON ファイル作成

`packages/maps/src/data/` に以下を追加:
- `bridge.json`
- `four-corners.json`
- `strait.json`
- `corridor.json`

terrain 配列はプログラム的に生成してもよい（手書きは非現実的）。
マップ生成スクリプトを一時的に書いて JSON を出力し、`data/` に保存する方法も可。

#### 3. `packages/maps/src/index.ts` — export 追加

```ts
export { loadMap } from './loader.js';
export { MapJsonSchema } from './schema.js';
export { default as firstBloodJson } from './data/first-blood.json';
export { default as bridgeJson } from './data/bridge.json';
export { default as fourCornersJson } from './data/four-corners.json';
export { default as straitJson } from './data/strait.json';
export { default as corridorJson } from './data/corridor.json';
```

#### 4. `Title.svelte` — マップ選択 UI

```svelte
<script lang="ts">
  interface Props {
    onstart: (mapId: string) => void;
  }
  const { onstart }: Props = $props();

  const maps = [
    { id: 'first-blood', name: 'First Blood', size: '64×36' },
    { id: 'bridge', name: 'Bridge', size: '48×36' },
    { id: 'four-corners', name: 'Four Corners', size: '48×48' },
    { id: 'strait', name: 'Strait', size: '64×36' },
    { id: 'corridor', name: 'Corridor', size: '64×36' },
  ];

  let selectedMap = $state('first-blood');
</script>

<!-- マップ選択リスト + Start Game ボタン -->
```

- 既存のタイトルデザイン（`#1a1a1a` 背景、system-ui フォント）に合わせる
- マップはラジオボタンまたはクリック選択で切替
- 選択中のマップをハイライト

#### 5. `App.svelte` — マップ選択の受け渡し

`startGame()` のシグネチャを変更:

```ts
const MAP_REGISTRY: Record<string, unknown> = {
  'first-blood': firstBloodJson,
  'bridge': bridgeJson,
  'four-corners': fourCornersJson,
  'strait': straitJson,
  'corridor': corridorJson,
};

async function startGame(mapId: string = 'first-blood'): Promise<void> {
  const mapJson = MAP_REGISTRY[mapId] ?? firstBloodJson;
  const map = loadMap(mapJson);
  // ... 以降は既存ロジック
}
```

`Title` コンポーネントの呼び出し:
```svelte
<Title onstart={(mapId) => startGame(mapId)} />
```

### 実装要件
1. **2 ディレクトリ制限** — `packages/maps` + `apps/web`（CLAUDE.md §7.2）
2. **マップ JSON は `MapJsonSchema` バリデーションを通ること** — `loadMap()` でエラーなし
3. **既存テスト不変** — maps の loader テスト 8 件 + 他テスト全て green
4. **左右（または対角）対称** — ゲームバランスのため
5. **`packages/core` は変更しない** — マップデータとUIのみ

### テスト計画

#### `packages/maps/src/loader.test.ts`（追加ケース）
- 各新規マップ（bridge, four-corners, strait, corridor）が `loadMap()` で正常にロードできる
- terrain 値が 0〜3 の範囲内
- 都市位置がマップ境界内
- spawn の cityId が cities に存在する
- terrain.length === width * height

#### `apps/web/src/ui/Title.test.ts`（新規、任意）
- マップ選択後に `onstart(mapId)` が正しい mapId で呼ばれる

### 禁止事項
* `packages/core/src/sim/` を変更する
* `packages/core/src/pathfinding/` を変更する
* 既存マップ（first-blood.json）の内容を変更する
* 既存テストを壊す

### 受け入れ基準
- [ ] 4 つの新規マップ JSON が `packages/maps/src/data/` に存在する
- [ ] 全マップが `loadMap()` で正常にロードできる（バリデーション通過）
- [ ] `packages/maps/src/index.ts` から全マップが export されている
- [ ] タイトル画面でマップを選択できる
- [ ] 選択したマップでゲームが開始される
- [ ] 各マップが対称（公平）で、異なる戦略が要求される地形配置
- [ ] heavy ユニットが通行可能な平地が十分にある
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. 各マップの地形レイアウト概要（テキストで簡易描画）
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(maps): add 4 new maps with map selection UI (P2-T5)
```

[本文に変更要点を簡潔に]

コミット前の必須チェック（★MUST）: `.claude/skills/skill-pre-commit-check.md` に従い、セルフレビュー → 自動テスト → ウェブテスト の全ステップを実施すること。

ウェブテスト確認項目:
- タイトル画面でマップ選択 UI が表示される
- 各マップを選択して Start Game → ゲームが正常に開始される
- 各マップの地形（水域、山脈、森）が意図通りに描画される
- ユニット・AI・前線が各マップで正常に動作する
- コンソールにエラーが出ていない

コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。
