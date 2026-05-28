> 完了タスクから抽出した教訓。

- `noUncheckedIndexedAccess: true`→TypedArrayアクセスにも`!`必要
- `import type`必須(型のみ使用時、`isolatedModules`違反回避)
- `MapDef.terrain`は`number[]`(`Uint8Array`はJSONラウンドトリップ不可)
- strict: 配列`for(let i=0;...)`のアクセスが`possibly undefined`→`for...of`で回避
- valibot v1: `v.pipe()`でバリデーションチェーン
- `svelte-check`: パッケージ内部パス解決不可→公開API経由re-export
- Svelte 5: `createEventDispatcher`→props callback
