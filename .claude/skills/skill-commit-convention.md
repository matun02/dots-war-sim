# コミット規約（Conventional Commits）

このファイルはコミットメッセージ作成時に参照するスキルです。
コミット前や PR 作成時に呼び出してください。

---

## 基本フォーマット

```
<type>(<scope>): <subject>

[body]（任意）

[footer]（任意：Breaking Change や Issue 参照）
```

### ルール
- subject は **英語・命令形・小文字始まり・ピリオドなし**
- 件名は **72 文字以内**
- body は必要な場合のみ（「なぜ」を書く）

---

## type 一覧

| type | 用途 |
|------|------|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `test` | テストの追加・修正 |
| `refactor` | 機能を変えないリファクタ |
| `perf` | パフォーマンス改善 |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド設定・CI・依存更新など |
| `style` | フォーマット修正（動作変更なし） |
| `revert` | コミットの取り消し |

---

## scope 一覧（このプロジェクト固有）

| scope | 対象 |
|-------|------|
| `sim` | packages/core/src/sim/ |
| `pathfinding` | packages/core/src/pathfinding/ |
| `render` | apps/web/src/game/render/ |
| `input` | apps/web/src/game/input/ |
| `ai` | apps/web/src/game/ai/ |
| `ui` | apps/web/src/ui/ |
| `loop` | apps/web/src/game/loop.ts |
| `maps` | packages/maps/ |
| `ci` | .github/workflows/ |
| `deps` | 依存パッケージ更新 |

---

## 例

```
feat(sim): add A* pathfinding with terrain cost

Implements A* search over grid with mountain tile penalty.
Uses mulberry32 RNG for tie-breaking to ensure determinism.

Closes #12
```

```
fix(render): fix unit interpolation drift on pause
```

```
test(sim): add deterministic replay equivalence test

Verifies same seed + inputs always produce identical GameState.
```

```
chore(deps): upgrade PixiJS to v8.2.1
```

```
refactor(sim): extract combat resolution into pure function
```

---

## Breaking Change

フッターに `BREAKING CHANGE:` を書く：

```
feat(sim): change tick signature to accept RNG parameter

BREAKING CHANGE: tick() now requires rng as third argument.
Update all call sites in loop.ts and tests.
```

---

## やってはいけない例

```bash
# NG: 日本語・曖昧・型なし
git commit -m "修正"
git commit -m "update"
git commit -m "fix bug"

# OK
git commit -m "fix(sim): fix city supply count going negative on capture"
```
