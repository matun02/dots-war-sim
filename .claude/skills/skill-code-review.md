# コードレビュー観点チェックリスト

このファイルはコードレビュー時に参照するスキルです。
`/review` などのコマンドで呼び出すか、PR 差分と一緒に渡してください。

---

## 1. 決定論チェック（core/sim 変更時は必須）

- [ ] `Math.random()` を使っていないか → `rng.next()` を使っているか
- [ ] `Date.now()` / `performance.now()` を使っていないか → `state.tick` で時間管理しているか
- [ ] `Map` / `Set` のイテレーション順に依存していないか
- [ ] `Array.sort` に全順序比較関数（ID で tie-break）があるか
- [ ] `for...in` を使っていないか（`for...of` or インデックス for にする）
- [ ] `async/await` / `Promise` / `setTimeout` が `core/sim` に混入していないか
- [ ] 外部 I/O（fetch, console.log, DOM, localStorage）が `core/sim` に混入していないか

## 2. 型安全性

- [ ] `any` を使っていないか（`unknown` + 型ガードへ）
- [ ] `as` 型アサーションは最小限か（使う場合はコメントで理由明記）
- [ ] `strict: true` で型エラーが出ないか（`pnpm typecheck` 通過）
- [ ] branded type（`EntityId`, `CityId` 等）を適切に使っているか

## 3. アーキテクチャ境界

- [ ] `packages/core` が他パッケージを import していないか
- [ ] `core/sim` で DOM / Node API を使っていないか
- [ ] PixiJS の import が `apps/web/game/render/` 以外にないか
- [ ] Svelte コンポーネントが `apps/web/src/ui/` 以外にないか
- [ ] Pixi 側で `GameState` を変更していないか（一方向データフロー）

## 4. テスト

- [ ] `core/sim` の新規ロジックに対応する Vitest があるか
- [ ] 決定論テスト（同シード・同入力で同出力）が追加されているか
- [ ] 既存テストが全て通るか（`pnpm test:run`）

## 5. 可読性・保守性

- [ ] マジックナンバーが `src/config/` の定数に切り出されているか
- [ ] 1 ファイルが 200 行を超えていないか（超える場合は分割を検討）
- [ ] 関数名・変数名が意図を表しているか（省略しすぎていないか）
- [ ] ファイル名が `kebab-case.ts` になっているか（Svelte は `PascalCase.svelte`）
- [ ] 触ったディレクトリが 2 つ以内か（横断変更は PR を分ける）

## 6. パフォーマンス（RTS 固有）

- [ ] ゲームループ内（tick / render）で不必要なオブジェクト生成をしていないか
- [ ] オブジェクトプールを使うべき箇所でプールを使っているか
- [ ] PixiJS の描画更新が必要な時だけ行われているか（dirty flag など）

## 7. PR の DoD 確認

- [ ] `pnpm test` が green
- [ ] `pnpm typecheck` 通過
- [ ] `pnpm lint` 通過
- [ ] PR に変更内容と動作確認手順が記載されている
- [ ] 影響範囲が明示されている
