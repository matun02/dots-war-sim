## 事前にコンテキスト把握（必須）
@.claude/CLAUDE.md @.claude/DESIGN.md @.claude/TASKS.md @.claude/SETUP.md を読んでください。
特に CLAUDE.md §4.3（決定論）、§7.2（2ディレクトリ制限）と DESIGN.md §9.2（AI v1）、§9.3（難易度）を厳密に守ること。

## 現在の状態
- M3 完了。Phase 1 全完了。P2-T1（Heavy ユニット）、P2-T2（影響マップ）完了。
  - commit `{P2-T1のcommit}`: heavy ユニット実装
  - commit `{P2-T2のcommit}`: 影響マップ実装 — `packages/core/src/sim/influence-map.ts`
- `pnpm install`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint` すべて green。
- テスト件数: 合計 {P2-T2完了後の件数} 件。

### AI 関連の既存実装状態

- `apps/web/src/game/ai/controller.ts`:
  - `createAIController(playerId, difficulty, rng)` — AI v0（ルールベース）
  - `AIDifficulty = 'easy' | 'normal' | 'hard'`
  - `DIFFICULTY_CONFIG`: thinkIntervalTicks + selectionAccuracy
  - v0 ロジック:
    - `handleDefense()`: 脅威都市への防衛ユニット派遣
    - `handleOffense()`: 中立/敵都市への攻撃（距離・重み・守備弱さでスコアリング）
    - `scoreTargets()`: 都市スコア計算（1/距離 * 重み）
    - `computeCenter()`: 自陣営の重心計算
  - ★ 影響マップは未使用 → 本タスクで v1 に拡張

- `packages/core/src/sim/influence-map.ts`（P2-T2 で実装済み）:
  - `computeInfluenceMap(state): InfluenceData`
  - `computeInfluenceDiff(data, playerA, playerB): Int16Array`
  - `InfluenceData { maps: Int16Array[], width, height }`

- `packages/core/src/sim/types.ts`:
  - `Command` に `set-production` あり（P2-T1 で追加）
  - `UnitKind = 'light' | 'heavy'`

- `apps/web/src/App.svelte`:
  - AI 呼び出し: `aiController.update(cur)` で Command[] を取得
  - AI 用 RNG: `new Rng(123)` で独立シード

- `.claude/settings.json` で Edit/Write 後に自動で prettier・eslint --fix が走る hook が有効。
- Node >= 22, pnpm 9.15.0 が PATH 通済。

## これからやるタスク
**P2-T3: AI v1（影響マップベース）**

影響マップを使って戦略的に行動する AI v1 を実装する。v0 のルールベースを拡張し、前線の圧力検出・押し返し・経済/軍事バランス評価を追加する。

### 仕様

#### 1. `controller.ts` — v1 ロジック追加

既存の v0 ロジック（`handleDefense`, `handleOffense`）は残しつつ、v1 として以下を追加:

```ts
// AI v1 の思考フロー:
// 1. 影響マップを計算（5tick ごとにキャッシュ）
// 2. 前線分析: 影響差分で「最も押し込まれているセクター」を検出
// 3. 防衛: 脅威都市への防衛（v0 と同じ）
// 4. 反撃: 最も押し込まれたセクター方向にユニット投入
// 5. 経済判断: 都市数が不利なら中立都市を狙う、有利なら前線に集中
// 6. 生産判断: 前線安定 → heavy 生産に切替（set-production コマンド発行）
```

**前線圧力検出アルゴリズム**:
```
1. computeInfluenceDiff(data, enemyId, myId) → diff マップ
2. diff > 0 のセルを「敵優勢」とみなす
3. 敵優勢セルを 4 セクター（上/下/左/右）に分類
4. 各セクターの敵優勢度合い（合計値）を計算
5. 最大セクター方向にユニットを投入
```

**経済/軍事バランス評価**:
```ts
const myCities = cities.filter(c => c.owner === myId).length;
const enemyCities = cities.filter(c => c.owner === enemyId).length;
const economyRatio = myCities / (myCities + enemyCities);
// economyRatio < 0.4 → 中立都市を優先的に狙う
// economyRatio >= 0.4 → 前線集中
```

**Heavy 生産判断**:
```ts
// 自都市が 3 以上 && 前線が安定（自陣営が押されていない）→ heavy 生産
// 自都市生産が light なら set-production コマンドで heavy に切替
// 条件を満たさなくなったら light に戻す
```

#### 2. 影響マップのキャッシュ

影響マップ計算は重いため、AI 内部でキャッシュする:

```ts
let cachedInfluence: InfluenceData | null = null;
let lastInfluenceTick = -Infinity;
const INFLUENCE_INTERVAL = 5;

function getInfluence(state: GameState): InfluenceData {
  if (state.tick - lastInfluenceTick >= INFLUENCE_INTERVAL) {
    cachedInfluence = computeInfluenceMap(state);
    lastInfluenceTick = state.tick;
  }
  return cachedInfluence!;
}
```

#### 3. 難易度パラメータ（DESIGN.md §9.3 維持）

既存パラメータは変更しない:
- Easy: thinkIntervalTicks=90, selectionAccuracy=0.7
- Normal: thinkIntervalTicks=30, selectionAccuracy=0.85
- Hard: thinkIntervalTicks=1, selectionAccuracy=0.95

v1 ロジックは全難易度で使用。thinkIntervalTicks と selectionAccuracy が既に行動頻度と精度を制御する。

### 実装要件
1. **AI は Command 経由のみ** — sim の state を直接書き換えない（DESIGN.md §9.4）
2. **AI の RNG は `Rng` 経由** — `Math.random()` 禁止（DESIGN.md §9.4）
3. **2 ディレクトリ制限** — `apps/web`（AI 本体） + `packages/core`（export 追加のみ、必要な場合）（CLAUDE.md §7.2）
4. **v0 フォールバック** — v1 ロジックが影響マップなしでも動作するよう、v0 を完全に削除しない
5. **既存テスト不変** — 既存テストを壊さない

### テスト計画

#### `apps/web/src/game/ai/controller.test.ts`（追加ケース）

- **影響マップ利用**: 敵ユニットが集中しているセクターに向かってユニットを派遣する
- **経済判断**: 都市数が少ない場合、中立都市を狙う Command が生成される
- **生産切替**: 条件を満たすと `set-production` コマンドが発行される
- **防衛優先**: 自都市が脅威下 → 影響マップ関係なく防衛を優先（v0 と同じ挙動維持）
- **難易度差**: Easy は thinkIntervalTicks=90 で低頻度に思考する（既存テスト維持）
- **決定論**: 同一 state + 同一 rng seed → 同一 Command 列

### 禁止事項
* AI 内で `Math.random()` を使用する（`Rng` 経由のみ）
* AI が `GameState` を変更する（読み取り専用）
* `packages/core/src/sim/` のロジック（tick, steps 等）を変更する
* 既存テストを壊す
* v0 のテスト（既存 8 件相当）を壊す

### 受け入れ基準
- [ ] AI v1 が影響マップを使って前線を分析する
- [ ] 押し込まれたセクターにユニットを投入する
- [ ] 都市数が不利な場合、中立都市を優先的に狙う
- [ ] 前線安定時に heavy 生産へ切替（`set-production` コマンド発行）
- [ ] v0 の防衛ロジック（脅威都市への呼び戻し）が維持される
- [ ] 影響マップは 5tick ごとにキャッシュ再計算
- [ ] 全難易度（easy/normal/hard）で動作する
- [ ] 決定論テスト通過
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
feat(ai): upgrade to influence-map-based AI v1 with economy evaluation (P2-T3)
```

[本文に変更要点を簡潔に]

コミット前に `pnpm -r typecheck && pnpm -r test && pnpm lint` を必ず通すこと。
コミット後に `git push` すること。
完了後に `.claude/skills/skill-task-completion.md` に従い TASKS.md / CLAUDE.md を更新してコミット・push すること。
