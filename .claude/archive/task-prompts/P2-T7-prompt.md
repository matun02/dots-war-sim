## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3（決定論）、§7.2（2ディレクトリ制限）と DESIGN.md §1.1（勝利条件）、§8.1（影響マップ）を厳密に守ること。

## 現在の状態
- M4 進行中。P2-T1〜T6 完了。
  - commit `{P2-T6のcommit}`: チュートリアル実装
  - commit `{P2-T2のcommit}`: 影響マップ実装 — `packages/core/src/sim/influence-map.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: 合計 {P2-T6完了後の件数} 件。

### 関連する既存実装状態

- `packages/core/src/sim/steps/evaluate-game-end.ts`:
  - `evaluateGameEnd(state)`: domination / annihilation / timeout / draw を判定
  - domination 判定: `state.cities.every(c => c.owner === pid)` — **全都市占領 (100%)** で domination
  - annihilation 判定: `alivePlayers.length === 1` — 片方のユニット・都市が全滅
  - timeout 判定: `state.tick >= GAME_TIME_LIMIT_TICKS` — 都市数比較
  - ★ domination を **80% 閾値** に変更 → 本タスクで修正

- `packages/core/src/sim/steps/evaluate-game-end.test.ts`:
  - 8 テストケース（domination, annihilation, timeout, draw, no overwrite, in progress, etc.）
  - ★ 80% 閾値のテストケースが不足 → 本タスクで追加

- `packages/core/src/sim/influence-map.ts`（P2-T2 で実装済み）:
  - `computeInfluenceMap(state): InfluenceData`
  - `computeInfluenceDiff(data, playerA, playerB): Int16Array`
  - ステップ: 全セル 0 クリア → ユニット位置に重み加算 → ガウシアン拡散
  - ★ 都市位置への重み加算 (city_weight=300) が未実装 → 本タスクで追加

- `packages/core/src/sim/constants.ts`:
  - `UNIT_STATS.light.supplyCost: 1`, `UNIT_STATS.heavy.supplyCost: 2`
  - `SUPPLY_MAX = 5`, `GAME_TIME_LIMIT_TICKS = 36000`
  - ★ `CITY_INFLUENCE_WEIGHT` 定数が未定義 → 本タスクで追加（必要に応じて）

- `packages/core/src/sim/types.ts`:
  - `City.owner: PlayerId | null`
  - `GameResult.reason: 'domination' | 'annihilation' | 'timeout'`
  - ★ reason 型は変更不要（80% でも 'domination' は適切）

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T7: 勝利条件 80% + 影響マップ都市重み**

本家 War of Dots との比較調査に基づき、勝利条件を 80% 都市支配に変更し、影響マップに都市パワー投射を追加する。

### 仕様

#### 1. `evaluate-game-end.ts` — domination 判定を 80% 閾値に変更

変更前:
```ts
if (state.cities.every((c) => c.owner === pid)) {
  state.result = { type: 'victory', winner: pid, reason: 'domination' };
  return;
}
```

変更後:
```ts
const totalCities = state.cities.length;
const ownedCities = state.cities.filter((c) => c.owner === pid).length;
if (ownedCities / totalCities >= 0.8) {
  state.result = { type: 'victory', winner: pid, reason: 'domination' };
  return;
}
```

★ 整数演算で書く場合: `ownedCities * 5 >= totalCities * 4`（浮動小数回避）

**注意事項**:
- `totalCities === 0` のエッジケースは考慮不要（マップには必ず都市がある）
- `reason: 'domination'` はそのまま維持（名称は「都市支配勝利」で適切）
- annihilation / timeout / draw ロジックは変更しない

#### 2. `influence-map.ts` — 都市パワー投射追加

`computeInfluenceMap` のステップ 2（ユニット重み加算）の後に、都市重み加算を追加:

```ts
// ステップ 2b: 都市パワー投射
const CITY_INFLUENCE_WEIGHT = 300;
for (const city of state.cities) {
  if (city.owner === null) continue;  // 中立都市は加算しない
  const idx = Math.floor(city.pos.y) * width + Math.floor(city.pos.x);
  if (idx >= 0 && idx < width * height) {
    maps[city.owner as number][idx] += CITY_INFLUENCE_WEIGHT;
  }
}
```

**設計意図**:
- 都市は恒久的な影響源。ユニットがいなくても都市周辺に影響力が残る
- city_weight=300 > heavy=200 > light=100 — 都市は最も強い影響源
- 中立都市は影響を持たない（誰の影響圏にも属さない）
- AI（P2-T3）と前線描画（P2-T4）が自動的に都市の影響を考慮するようになる

#### 3. 定数定義（任意）

`constants.ts` に追加するか、`influence-map.ts` 内にローカル定数として定義:

```ts
export const CITY_INFLUENCE_WEIGHT = 300;
```

influence-map.ts 内のみで使用する場合はローカル定数で十分。

### 実装要件
1. **決定論維持** — 整数演算のみ。domination 判定は `ownedCities * 5 >= totalCities * 4` で浮動小数回避（CLAUDE.md §4.3）
2. **純関数** — `evaluateGameEnd` も `computeInfluenceMap` も副作用なし（CLAUDE.md §4.4）
3. **1 ディレクトリ制限** — `packages/core` のみ（CLAUDE.md §7.2）
4. **既存テスト維持** — 既存テストを壊さない（80% 変更で既存 domination テストが pass するか確認）
5. **GameResult 型は変更しない** — `reason: 'domination'` はそのまま

### テスト計画

#### `packages/core/src/sim/steps/evaluate-game-end.test.ts`（追加ケース）

- **80% 支配で domination**: 5 都市中 4 都市 (80%) を所有 → domination 勝利
- **80% 未満で domination しない**: 5 都市中 3 都市 (60%) → ゲーム継続
- **100% 支配でも domination**: 全都市占領 → 引き続き domination（後方互換）
- **ちょうど 80% 境界**: 10 都市中 8 都市 → domination、7 都市 → 継続

#### `packages/core/src/sim/influence-map.test.ts`（追加ケース）

- **都市パワー投射**: 所有都市のセルに 300 が加算される
- **中立都市は加算しない**: `owner === null` の都市は影響 0
- **都市 + ユニット複合**: 同セルに都市とユニットがある場合、両方の重みが加算される
- **決定論**: 都市あり state で 2 回計算 → 同一結果

### 禁止事項
* `core/sim/` 内で `Math.random()`, `Date.now()`, `console.log` 等の副作用
* domination 判定で浮動小数演算に依存する比較（整数演算で 80% を表現）
* `GameResult` 型の変更（`reason` のバリアントを増やさない）
* `apps/web` を変更する（本タスクの範囲外）
* 既存テストを壊す
* annihilation / timeout / draw ロジックを変更する

### 受け入れ基準
- [ ] 80% 以上の都市を支配すると domination 勝利が発生する
- [ ] 80% 未満ではゲームが継続する
- [ ] 100% 占領でも引き続き domination が発生する（後方互換）
- [ ] annihilation / timeout / draw は従来通り動作する
- [ ] 影響マップに都市パワー投射（city_weight=300）が加算される
- [ ] 中立都市は影響マップに加算されない
- [ ] 整数演算のみで domination 判定される（決定論維持）
- [ ] 既存テスト全て green
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
feat(sim): add 80% domination victory and city influence weight (P2-T7)
```

[本文に変更要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。

★ P2-T7 完了で **M4（Phase 2 完了）マイルストーン達成**。
TASKS.md のマイルストーンセクションで M4 を「✅ 全完了」に更新すること。

### 補足: P2-T6 チュートリアル文言の更新
P2-T6 で作成される `Tutorial.svelte` の勝利条件ステップに「敵の全都市を占領 or 全ユニットを殲滅で勝利」と記載されている。P2-T7 完了後、「80% の都市を支配 or 全ユニットを殲滅で勝利」に更新すること。
