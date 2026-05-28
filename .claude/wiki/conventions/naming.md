| 対象 | 規約 | 例 |
|---|---|---|
| ファイル | `kebab-case.ts` | `flow-field.ts` |
| Svelteコンポーネント | `PascalCase.svelte` | `Title.svelte` |
| 型・クラス | `PascalCase` | `GameState` |
| 関数・変数 | `camelCase` | `moveUnits` |
| 定数(モジュールスコープ) | `UPPER_SNAKE_CASE` | `TICK_DT` |
| テストファイル | `*.test.ts` | `tick.test.ts` |
| ID系型 | branded type | `EntityId`, `CityId` |

```ts
type Brand<T, B> = T & { __brand: B };
export type EntityId = Brand<number, "EntityId">;
```
