## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.6（Svelte レイヤー規約）、§7.2（2ディレクトリ制限）と DESIGN.md §12.2（入力操作一覧）を厳密に守ること。

## 現在の状態
- M3 完了。Phase 1 全完了。P2-T1〜T5 完了。
  - commit `{P2-T1のcommit}`: heavy ユニット実装
  - commit `{P2-T2のcommit}`: 影響マップ実装
  - commit `{P2-T3のcommit}`: AI v1 実装
  - commit `{P2-T4のcommit}`: 前線描画実装
  - commit `{P2-T5のcommit}`: マップ 4 枚追加 + マップ選択 UI
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: 合計 {P2-T5完了後の件数} 件。

### チュートリアル関連の既存実装状態

- `apps/web/src/ui/Title.svelte`:
  - タイトル画面。マップ選択 UI（P2-T5 で追加）+ 「Start Game」ボタン
  - `Props: { onstart: (mapId: string) => void }`

- `apps/web/src/App.svelte`:
  - `Screen = 'title' | 'game' | 'result' | 'replay'`
  - `startGame(mapId)` でゲーム開始
  - ★ チュートリアル表示ロジックなし → 本タスクで追加

- `apps/web/src/ui/` 配下:
  - `Title.svelte`, `ResultDialog.svelte` が存在
  - ★ `Tutorial.svelte` は存在しない → 本タスクで新規作成

- ローカル永続化:
  - `idb-keyval` が `apps/web` の依存に含まれている
  - `apps/web/src/game/replay/storage.ts` で `idb-keyval` を使用中（`set`/`get`/`keys` 等）
  - ★ チュートリアル既読フラグの保存に `idb-keyval` を再利用

- 入力操作一覧（DESIGN.md §12.2）:
  | 操作 | 内容 |
  |---|---|
  | 左ドラッグ | 矩形選択 |
  | 左クリック | 単体選択 |
  | 右クリック | 選択ユニットへ移動命令 |
  | 自都市クリック | 生産種別切替（P2-T1 で追加） |
  | マウスホイール | ズーム |
  | Space | ポーズ |

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T6: チュートリアル**

初回ゲーム起動時に操作説明オーバーレイを表示する。2 回目以降は表示しない（IndexedDB にフラグ保存）。

### 仕様

#### 1. `Tutorial.svelte` — 新規作成

ファイル: `apps/web/src/ui/Tutorial.svelte`

```svelte
<script lang="ts">
  interface Props {
    ondone: () => void;
  }
  const { ondone }: Props = $props();

  const steps = [
    { title: 'ユニット選択', desc: '左ドラッグで矩形選択、左クリックで単体選択', icon: '🖱️' },
    { title: '移動命令', desc: 'ユニット選択後、右クリックで移動先を指定', icon: '➡️' },
    { title: '生産切替', desc: '自都市をクリックして Light/Heavy を切替', icon: '🏭' },
    { title: '都市占領', desc: '敵都市にユニットを送り込んで占領', icon: '🏰' },
    { title: '勝利条件', desc: '敵の全都市を占領 or 全ユニットを殲滅で勝利', icon: '🏆' },
  ];

  let currentStep = $state(0);
</script>
```

**UI レイアウト**:
- 全画面半透明オーバーレイ（`position: fixed; background: rgba(0,0,0,0.8)`）
- 中央にカード: タイトル + 説明 + アイコン
- 下部に「Next」ボタン + ステップインジケーター（1/5, 2/5...）
- 最終ステップで「Start!」ボタン
- 右上に「Skip」ボタン（いつでもスキップ可能）
- 既存のタイトルデザイン（`#1a1a1a` 系、system-ui フォント）に合わせる

#### 2. IndexedDB フラグ管理

```ts
import { get, set } from 'idb-keyval';

const TUTORIAL_KEY = 'tutorialSeen';

export async function shouldShowTutorial(): Promise<boolean> {
  const seen = await get(TUTORIAL_KEY);
  return seen !== true;
}

export async function markTutorialSeen(): Promise<void> {
  await set(TUTORIAL_KEY, true);
}
```

これらのヘルパーは `Tutorial.svelte` 内または別ファイル（`apps/web/src/game/tutorial-storage.ts` 等）に配置。

#### 3. `App.svelte` — 統合

```ts
import Tutorial from './ui/Tutorial.svelte';

type Screen = 'title' | 'tutorial' | 'game' | 'result' | 'replay';
let showTutorial = $state(false);

// startGame の中で:
async function startGame(mapId: string = 'first-blood'): Promise<void> {
  // チュートリアル表示チェック
  if (await shouldShowTutorial()) {
    showTutorial = true;
    // チュートリアル完了を待ってからゲーム開始
    return;
  }
  // ... 既存の startGame ロジック
}

function handleTutorialDone(): void {
  showTutorial = false;
  markTutorialSeen();
  // ゲーム開始を続行
  actualStartGame(pendingMapId);
}
```

テンプレート:
```svelte
{#if showTutorial}
  <Tutorial ondone={handleTutorialDone} />
{/if}
```

**表示タイミング**:
- 「Start Game」クリック後、初回のみチュートリアル表示
- チュートリアル完了（最終ステップの「Start!」or 「Skip」）後にゲーム開始
- 2 回目以降は直接ゲーム開始

### 実装要件
1. **Svelte レイヤー規約** — `apps/web/src/ui/` のみ Svelte コンポーネント（CLAUDE.md §4.6）
2. **1 ディレクトリ制限** — `apps/web` のみ（CLAUDE.md §7.2）
3. **PixiJS 不使用** — チュートリアルは HTML/CSS のみ。Pixi import 禁止（CLAUDE.md §4.6）
4. **idb-keyval 再利用** — 既存依存（新規パッケージ追加不要）
5. **既存のゲームループに影響しない** — チュートリアルはゲーム開始前に表示・完了する
6. **レスポンシブ** — 画面幅に応じてカードサイズ調整（min-width: 320px 想定）

### テスト計画

#### `apps/web/src/ui/Tutorial.test.ts`（新規、任意）
- ステップ送り: 「Next」で次のステップに進む
- 最終ステップ: 「Start!」で `ondone` が呼ばれる
- スキップ: 「Skip」で `ondone` が呼ばれる
- ステップ数: 5 ステップ全て表示される

#### 手動テスト
- 初回起動: Start Game → チュートリアル表示 → 全ステップ → ゲーム開始
- 2 回目起動: Start Game → チュートリアルなし → 直接ゲーム開始
- ブラウザの IndexedDB をクリア → 再度チュートリアル表示
- Skip クリック → チュートリアルスキップ → ゲーム開始

### 禁止事項
* `packages/core/` を変更する
* `packages/maps/` を変更する
* PixiJS を Tutorial コンポーネントで使用する
* 新規パッケージを追加する
* 既存テストを壊す
* チュートリアル表示中にゲームループを開始する

### 受け入れ基準
- [ ] 初回ゲーム起動時にチュートリアルオーバーレイが表示される
- [ ] 5 ステップの操作説明（選択、移動、生産切替、占領、勝利条件）が表示される
- [ ] 「Next」でステップ送り、最終ステップの「Start!」でゲーム開始
- [ ] 「Skip」でいつでもスキップしてゲーム開始
- [ ] 2 回目以降はチュートリアルが表示されない（IndexedDB フラグ）
- [ ] IndexedDB クリア後は再度表示される
- [ ] 既存のゲームフロー（タイトル → ゲーム → 結果 → リマッチ/リプレイ）が壊れない
- [ ] `pnpm -r typecheck` 通る
- [ ] `pnpm lint` 通る
- [ ] `pnpm -r test` 通る（既存 + 新規テスト全て green）

### 着手前に提示してほしいこと
CLAUDE.md §7.1 の規約に従い、実装に入る前に以下を提示してください:
1. 変更予定ファイル一覧
2. チュートリアルステップの内容案
3. 想定される影響範囲

承認したら実装に進んでください。

### 完了後のコミット
完了したら以下の形式でコミット (.claude/skills/skill-commit-convention.md 準拠):

```
feat(ui): add first-launch tutorial overlay (P2-T6)
```

[本文に変更要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。

★ P2-T6 完了で **M4（Phase 2 完了）マイルストーン達成**。
TASKS.md のマイルストーンセクションで M4 を「✅ 全完了」に更新すること。
